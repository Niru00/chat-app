    import { Server } from "socket.io";
    import {Message} from "../models/message.model.js";
import User from "../models/user.model.js";

    export const onlineUsers = new Map();

    export const initSocketServer = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

        io.on("connection", (socket) => {
          
         socket.on("Useronline", (userId) => {
                onlineUsers.set(userId, socket.id);
                io.emit("OnlineUsers", Array.from(onlineUsers.keys()));
            });
         
        socket.on("typing", ({ conversationId, userId }) => {
  socket.to(conversationId).emit("isTyping", { conversationId, userId })
})

socket.on("stopTyping", ({ conversationId, userId }) => {
  socket.to(conversationId).emit("stopTyping", { conversationId, userId })
})


            socket.on("mesSeen",async ({ conversationId, userId }) => {
                 const user = await User.findOne({ firebaseId: userId })
               if (!user) return
                  await Message.updateMany(
    { conversationId, senderId: { $ne: user._id }, seen: false },
    { $set: { seen: true } }
  )
         
                io.to(conversationId).emit("messagesSeen", { conversationId});

 const userSocketId = onlineUsers.get(userId)
  if (userSocketId) {
    io.to(userSocketId).emit("unreadCount", {
      conversationId,
      count: 0
    })
  }

            });

    
            socket.on("joinRoom", (roomId) => {
                socket.join(roomId);
            });

          
            socket.on("disconnect", () => {
                for (let [userId, socketId] of onlineUsers.entries()) {
                    if (socketId === socket.id) {
                        onlineUsers.delete(userId);
                        break;
                    }
                }
                io.emit("OnlineUsers", Array.from(onlineUsers.keys()));
            });

        });

        return io;
    }

