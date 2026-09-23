'use client'

import { useState, ChangeEvent, KeyboardEvent } from 'react';
import { useEffect } from 'react';
import { Upload, Send, FileText, X, Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED';

export default function SplitPage() {
  const { getToken } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus | null>(null);

  useEffect(() => {
    if (!fileId || documentStatus === 'PROCESSED' || documentStatus === 'FAILED') return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const pollStatus = async () => {
      try {
        const token = await getToken();
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/documents/${fileId}`,
          { headers: { ...(token && { Authorization: `Bearer ${token}` }) } },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Status check failed with status ${response.status}`);
        }

        if (cancelled) return;
        setDocumentStatus(data.document.status);

        if (data.document.status !== 'PROCESSED' && data.document.status !== 'FAILED') {
          timeoutId = setTimeout(pollStatus, 2000);
        } else if (data.document.status === 'FAILED') {
          setError(data.document.errorMessage || 'Document processing failed. Please upload it again.');
        }
      } catch (err) {
        if (cancelled) return;
        console.error('[document] status check failed', err);
        setError('Could not check document processing status. Please try again.');
      }
    };

    pollStatus();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [documentStatus, fileId, getToken]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      await uploadFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      await uploadFile(droppedFile);
    }
  };

  const uploadFile = async (fileToUpload: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const token = await getToken();
      const uploadUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/upload`;
      console.info('[upload] starting request', {
        url: uploadUrl,
        name: fileToUpload.name,
        size: fileToUpload.size,
        type: fileToUpload.type,
        hasToken: Boolean(token),
      });
      const formData = new FormData();
      formData.append('file', fileToUpload);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData,
      });

      const responseText = await response.text();
      let data: { id?: string; fileId?: string; status?: DocumentStatus; error?: string };
      try {
        data = JSON.parse(responseText);
      } catch {
        data = {};
      }

      console.info('[upload] response received', {
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get('content-type'),
        body: data.error ?? responseText.slice(0, 500),
      });

      if (!response.ok) {
        throw new Error(data.error || `Upload failed with status ${response.status}`);
      }

      setFileId(data.fileId ?? data.id ?? null);
      setDocumentStatus(data.status ?? 'UPLOADED');
    } catch (err) {
      setError('Failed to upload file. Please try again.');
      console.error('[upload] request failed', err);
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const messageText = input;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          message: messageText,
          documentId: fileId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.answer,
        sender: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Send message error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileId(null);
    setDocumentStatus(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-zinc-900/50">
      {/* Left Half - Upload Section */}
      <div className="flex w-1/2 flex-col items-center justify-center border-r border-zinc-800 bg-zinc-900/50 p-12">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <h2 className="mb-2 text-3xl font-semibold tracking-tight text-zinc-50">
              Your document
            </h2>
            <p className="text-zinc-500">
              Upload a file, then ask questions about it.
            </p>
          </div>

          <label
            htmlFor="file-upload"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex h-72 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors duration-200 ${
              isDragging
                ? 'border-zinc-50 bg-zinc-50/5'
                : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
            } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
          >
            <div className="flex flex-col items-center justify-center px-6 py-8">
              {isUploading ? (
                <>
                  <Loader2 className="mb-4 h-8 w-8 animate-spin text-zinc-50" />
                  <p className="text-base font-medium text-zinc-50">
                    Uploading...
                  </p>
                </>
              ) : (
                <>
                  <div
                    className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-colors ${
                      isDragging ? 'bg-zinc-50/10' : 'bg-zinc-800'
                    }`}
                  >
                    <Upload
                      className={`h-8 w-8 transition-colors ${
                        isDragging ? 'text-zinc-50' : 'text-zinc-500'
                      }`}
                    />
                  </div>
                  <p className="mb-2 text-base font-medium text-zinc-50">
                    <span className="text-zinc-50">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-sm text-zinc-500">
                    PDF files only
                  </p>
                  <p className="mt-2 text-xs text-zinc-600">
                    Maximum file size: 20MB
                  </p>
                </>
              )}
            </div>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>

          {file && (
            <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="flex items-start justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
                    <FileText className="h-5 w-5 text-zinc-50" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-50">
                      {file.name}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatFileSize(file.size)}
                    </p>
                    {documentStatus && (
                      <p className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
                        {(documentStatus === 'UPLOADED' || documentStatus === 'PROCESSING') && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                        {documentStatus === 'UPLOADED' && 'Uploaded - preparing document'}
                        {documentStatus === 'PROCESSING' && 'Creating and storing embeddings'}
                        {documentStatus === 'PROCESSED' && 'Ready for questions'}
                        {documentStatus === 'FAILED' && 'Processing failed'}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  aria-label="Remove file"
                  className="ml-2 rounded-md p-1 transition-colors hover:bg-zinc-800"
                >
                  <X className="h-4 w-4 text-zinc-500 hover:text-zinc-50" />
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Half - Chat Section */}
      <div className="flex w-1/2 flex-col bg-zinc-950">
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            <div className="mb-6">
              <h2 className="mb-1 text-3xl font-semibold tracking-tight text-zinc-50">
                Conversation
              </h2>
              <p className="text-zinc-500">
                Ask questions about your document
              </p>
            </div>

            {messages.length === 0 ? (
              <div className="mt-32 flex flex-col items-center justify-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900">
                  <Send className="h-7 w-7 text-zinc-600" />
                </div>
                <p className="text-center text-zinc-500">
                  No messages yet
                </p>
                <p className="mt-1 text-center text-sm text-zinc-600">
                  Upload a document, then type your first question below.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-xl p-4 ${
                      msg.sender === 'user'
                        ? 'ml-12 border border-zinc-700 bg-zinc-50/5'
                        : 'mr-12 border border-zinc-800 bg-zinc-900'
                    }`}
                  >
                    <p className="mb-1 text-sm font-medium text-zinc-500">
                      {msg.sender === 'user' ? 'You' : 'Assistant'}
                    </p>
                    {msg.sender === 'assistant' ? (
                      <div className="space-y-2 text-zinc-300 [&_a]:text-zinc-50 [&_a]:underline [&_code]:rounded [&_code]:bg-zinc-950 [&_code]:px-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:leading-6 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-zinc-950 [&_pre]:p-3 [&_strong]:font-semibold [&_strong]:text-zinc-50 [&_ul]:list-disc [&_ul]:pl-5">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-zinc-50">{msg.text}</p>
                    )}
                  </div>
                ))}
                {isSending && (
                  <div className="ml-4 flex items-center gap-2 text-zinc-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Assistant is thinking...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-zinc-800 bg-zinc-950 p-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={isSending || documentStatus !== 'PROCESSED'}
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-zinc-50 placeholder-zinc-500 transition-colors focus:border-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-50/20 disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || documentStatus !== 'PROCESSED' || isSending}
              className="flex items-center gap-2 rounded-xl bg-zinc-50 px-6 py-3 font-semibold text-zinc-900 transition-colors hover:bg-zinc-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-zinc-50"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}