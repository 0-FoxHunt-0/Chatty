import cloudinary from "../lib/cloudinary";
import Message from "../models/message.model";
import User, { IUser } from "../models/user.model";
import { Request, Response } from "express";

export const getUsersForSidebar = async (req: Request, res: Response) => {
  try {
    const loggedInUserId = (req.user as IUser)?._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json({
      success: true,
      users: filteredUsers,
    });
  } catch (error) {
    console.log("Error in getUsersForSidebar controller", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const currentUserId = (req.user as IUser)?._id;
    const otherUserId = req.params._id;
    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId },
      ],
    });
    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.log("Error in getMessages controller", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const currentUserId = (req.user as IUser)?._id;
    const otherUserId = req.params._id;
    const { text, image } = req.body;

    let imageUrl = null;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const message = await Message.create({
      senderId: currentUserId,
      receiverId: otherUserId,
      text,
      image: imageUrl,
    });

    // TODO: add realtime functionality to send message to the other user => Socket.io

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      content: message,
    });
  } catch (error) {
    console.log("Error in sendMessage controller", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
