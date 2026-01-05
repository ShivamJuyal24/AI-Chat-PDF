'use client'

import { useState, ChangeEvent, KeyboardEvent } from 'react';
import { Upload, Send, FileText, X } from 'lucide-react';

export default function SplitPage() {
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleSendMessage = () => {
    if (input.trim()) {
      setMessages([...messages, input]);
      setInput('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-slate-50">
      {/* Left Half - Upload Section */}
      <div className="w-1/2 flex flex-col items-center justify-center p-12 border-r border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Upload Document
            </h2>
            <p className="text-slate-600">
              Share your files to get started
            </p>
          </div>
          
          <label 
            htmlFor="file-upload"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center w-full h-72 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
              isDragging 
                ? 'border-indigo-500 bg-indigo-50 scale-105' 
                : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50'
            }`}
          >
            <div className="flex flex-col items-center justify-center py-8 px-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                isDragging ? 'bg-indigo-100' : 'bg-slate-100'
              }`}>
                <Upload className={`w-8 h-8 transition-colors ${
                  isDragging ? 'text-indigo-600' : 'text-slate-400'
                }`} />
              </div>
              <p className="mb-2 text-base text-slate-700 font-medium">
                <span className="text-indigo-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-sm text-slate-500">
                PDF, DOC, TXT, or any file type
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Maximum file size: 50MB
              </p>
            </div>
            <input 
              id="file-upload" 
              type="file" 
              className="hidden" 
              onChange={handleFileChange}
            />
          </label>

          {file && (
            <div className="mt-6 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="ml-2 p-1 hover:bg-slate-100 rounded-md transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Half - Chat Section */}
      <div className="w-1/2 bg-white flex flex-col">
        {/* Messages Display Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-slate-900 mb-1">
                Conversation
              </h2>
              <p className="text-slate-600">
                Ask questions about your document
              </p>
            </div>
            
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-32">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Send className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-slate-400 text-center">
                  No messages yet
                </p>
                <p className="text-slate-400 text-sm text-center mt-1">
                  Start typing below to begin the conversation
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div 
                    key={idx}
                    className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl text-slate-800 border border-indigo-100 shadow-sm"
                  >
                    {msg}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input Area at Bottom */}
        <div className="border-t border-slate-200 p-6 bg-white shadow-lg">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-5 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400 transition-all"
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 font-medium shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}