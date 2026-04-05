import app from "./src/app.js";
import dotenv from "dotenv";
import connectDB from "./src/config/database.js";
import http from "http"
import { initSocketServer } from "./src/services/socket.server.js";
import { onlineUsers } from './src/services/socket.server.js'

dotenv.config();    

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

connectDB();
const io = initSocketServer(server);

global.io = io
global.onlineUsers = onlineUsers 


server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});