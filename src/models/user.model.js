import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minLength: 3,
      maxLength: 20,
    },
    fcmToken: {
      type: String,
      default: "",
    },
    firebaseId: {
  type: String,
  required: true,
  unique: true
},
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    profilePic: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

 const User = mongoose.model("User", userSchema);

export default User;