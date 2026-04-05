import express from 'express';
import {authRouter} from './Routes/user.route.js';
import chatRouter from './Routes/chat.route.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import path from "path"
import { fileURLToPath } from "url"


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "https://chat-iznx.onrender.com",
    credentials: true,
}));


app.use((req, res, next) => {
  req.io = global.io
  req.onlineUsers = global.onlineUsers  
  next()
})



app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);


app.use(morgan("dev"));

app.use(express.static(path.join(__dirname, "../public")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});


export default app;