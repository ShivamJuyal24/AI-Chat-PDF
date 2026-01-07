import dotenv from 'dotenv';
dotenv.config();

console.log('DATABASE_URL FROM NODE:', process.env.DATABASE_URL);

import express from 'express';
import cors from 'cors';
import uploadRoutes from './routes/upload.routes.js';
const app = express();

app.use(cors({
    origin:"*",

}));

app.use(express.json());
app.use(express.urlencoded({
     extended: true 
}));

app.get('/', (req, res)=>{
    res.send('Hello World');
})

app.use('/upload', uploadRoutes);

app.listen(8000,()=>{
    console.log('Server is running on port 8000');
})

import './workers/documentWorker.js';