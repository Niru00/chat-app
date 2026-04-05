import express from "express";
import { verifyUser } from "../middlewares/auth.middleware.js";
import { createConversation,sendMessage,getMessages,getConversations} from "../controllers/chat.controller.js";

const chatRouter = express.Router();

chatRouter.post("/conversation",verifyUser,createConversation );
chatRouter.post("/message",verifyUser,sendMessage );
chatRouter.get("/messages/:conversationId",verifyUser,getMessages );
chatRouter.get("/conversations",verifyUser,getConversations);


export default chatRouter;