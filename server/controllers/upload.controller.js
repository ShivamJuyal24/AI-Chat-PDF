import { db } from '../config/db.js';
import { documentQueue } from '../queues/documentQueue.js';

export const uploadFile = async (req, res) => {
  console.log("UPLOAD HIT");
  console.log("Headers:", req.headers);
  console.log("File:", req.file);

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.auth.userId;

    // Insert metadata into database
    const result = await db.query(
      `INSERT INTO documents 
       (user_id, original_name, file_name, file_path, file_size)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        userId,                 // Clerk user id
        req.file.originalname,
        req.file.filename,
        req.file.path,
        req.file.size,
      ]
    );

    const documentId = result.rows[0].id;

    // Enqueue job with filePath for Phase 3 worker
    await documentQueue.add('process-document', {
      documentId,
      filePath: req.file.path, // <-- important for worker
    });

    res.status(200).json({
      documentId,
      status: "uploaded",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
};
