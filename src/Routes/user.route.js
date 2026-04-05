import express from "express";
import multer from "multer";
import { verifyUser } from "../middlewares/auth.middleware.js";
import {
  googleController,
  getCurrentUser,
  logoutController,
  saveFCMToken,
  searchUsers,
  updateProfile,
} from "../controllers/auth.controller.js";

const authRouter = express.Router();

// multer — store in memory so we can pass buffer to ImageKit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

authRouter.post("/google", googleController);
authRouter.get("/me", verifyUser, getCurrentUser);
authRouter.post("/logout", logoutController);
authRouter.post("/fcm-token", verifyUser, saveFCMToken);

// ✅ new routes
authRouter.get("/search", verifyUser, searchUsers);
authRouter.put("/profile", verifyUser, upload.single("profilePic"), updateProfile);

export { authRouter };