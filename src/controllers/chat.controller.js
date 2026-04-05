import {Conversation} from "../models/conversation.model.js";
import {Message} from "../models/message.model.js";
import admin from "../config/firebaseadmin.js";
import User from "../models/user.model.js";

async function createConversation(req, res) {
  try {
    const { receiverId } = req.body;
    const senderId = req.user.id;

    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] }
    });

    if (!conversation) {
      conversation = new Conversation({ members: [senderId, receiverId] });
      await conversation.save();
    }

    // ✅ always populate so frontend has full user data
    await conversation.populate("members", "username email profilePic firebaseId");

    // ✅ emit to receiver so their sidebar updates instantly (no refresh needed)
    const receiver = await User.findById(receiverId);
    if (receiver) {
      const receiverSocketId = req.onlineUsers.get(receiver.firebaseId);
      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("newConversation", conversation);
      }
    }

    res.status(200).json(conversation);

  } catch (error) {
    console.error("Error in createConversation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function sendMessage(req, res) {
  try {
    const { conversationId, text } = req.body;
    const senderId = req.user.id;

    const message = await Message.create({ conversationId, senderId, text });
    await message.populate("senderId", "username profilePic firebaseId");

    req.io.to(conversationId).emit("newMessage", message);

    await Conversation.findByIdAndUpdate(conversationId, { lastMessage: text });

    const conversation = await Conversation.findById(conversationId);
    const receiverId = conversation.members.find(
      (id) => id.toString() !== senderId.toString()
    );

    const unreadMescount = await Message.countDocuments({
      conversationId,
      senderId: { $ne: receiverId },
      seen: false
    });

    const receiver = await User.findById(receiverId);
    const receiverSocketId = req.onlineUsers.get(receiver.firebaseId);

    if (receiverSocketId) {
      req.io.to(receiverSocketId).emit("unreadCount", {
        conversationId,
        count: unreadMescount
      });
    }

    try {
      await admin.messaging().send({
        token: receiver.fcmToken,
        data: {
          title: message.senderId.username,
          body: text,
          conversationId: conversationId.toString(),
          image: message.senderId.profilePic || "",
        },
        android: { notification: { sound: "default" } },
      });
      console.log("Push sent");
    } catch (err) {
      console.log("Push error:", err.message);
    }

    res.status(200).json(message);

  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({ message: "Error sending message" });
  }
}

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId })
      .populate("senderId", "username profilePic firebaseId")
      .sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages" });
  }
};

async function getConversations(req, res) {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.find({ members: userId })
      .populate("members", "username email profilePic firebaseId")
      .sort({ updatedAt: -1 });
    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: "Error fetching conversations" });
  }
}

export { createConversation, sendMessage, getConversations };