import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

app.use(express.static('public'));
app.use(cookieParser());

//router
import { router as userRouter } from './routes/user.routes.js';

//router declaration 
app.use('/api/v1/users', userRouter);

//http://localhost:3000/api/v1/users/
app.use((req, res) => {
  console.log(`Received ${req.method} request at ${req.url}`);
  res.status(404).json({ message: "Route not found" });
});

export { app };