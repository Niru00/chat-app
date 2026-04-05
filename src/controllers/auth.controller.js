import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import imagekit from "../config/imagekit.js";

async function googleController(req, res) {
  try {
    const { username, email, profilePic, firebaseId } = req.body;

    let user = await User.findOne({ firebaseId });

    if (!user) {
      user = new User({ username, email, profilePic, firebaseId });
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "User authenticated successfully", user });
  } catch (error) {
    console.error("Error in googleController:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function getCurrentUser(req, res) {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-__v")
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error in getCurrentUserController:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function logoutController(req, res) {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logoutController:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const saveFCMToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fcmToken } = req.body;
    await User.findByIdAndUpdate(userId, { fcmToken });
    res.status(200).json({ message: "Token saved" });
  } catch (err) {
    res.status(500).json({ message: "Error saving token" });
  }
};

// ── Search users by username ──────────────────────────────────────────────────
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user.id;

    if (!query || query.trim().length < 1) {
      return res.status(200).json([]);
    }

    const users = await User.find({
      _id: { $ne: currentUserId }, // exclude self
      username: { $regex: query.trim(), $options: "i" }, // case-insensitive
    })
      .select("username profilePic firebaseId email")
      .limit(10);

    res.status(200).json(users);
  } catch (error) {
    console.error("searchUsers error:", error);
    res.status(500).json({ message: "Error searching users" });
  }
};

// ── Update profile (username + profilePic) ────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username } = req.body;

    const updateData = {};

    // update username if provided
    if (username && username.trim().length >= 3) {
      updateData.username = username.trim();
    }

    // upload image to ImageKit if file provided
    if (req.file) {
      const fileBuffer = req.file.buffer;
      const fileName = `profile_${userId}_${Date.now()}`;

      const uploadRes = await imagekit.upload({
        file: fileBuffer,
        fileName,
        folder: "/profiles",
      });

      updateData.profilePic = uploadRes.url;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-firebaseId -__v");

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    console.error("updateProfile error:", error);
    res.status(500).json({ message: "Error updating profile" });
  }
};

export { googleController, getCurrentUser, logoutController };