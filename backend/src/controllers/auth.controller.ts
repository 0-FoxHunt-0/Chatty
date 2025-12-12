import { Request, Response } from "express";
import { IUser } from "../models/user.model";
import User from "../models/user.model";
import bcrypt from "bcryptjs";
import generateToken from "../lib/utils";
import cloudinary from "../lib/cloudinary";

export const signup = async (req: Request, res: Response) => {
  const userData: IUser = req.body;
  const salt = await bcrypt.genSalt(10); //* Salt generation

  if (!userData.username || !userData.email || !userData.password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  } else if (userData.password.length < 6) {
    //* Minimum password length requirement
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long",
    });
  }

  try {
    //* Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    //* Password hashing
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    //* User creation
    const user = await User.create({
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      profilePicture: userData?.profilePicture || "",
    });

    if (user) {
      //* Generate token
      generateToken((user as IUser & { _id: string })._id.toString(), res);

      //* Send success response
      res.status(201).json({
        success: true,
        message: "User created successfully",
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture,
        },
      });
    }
  } catch (error) {
    //* Send error response
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    //* Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    //* Check if password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    //* Generate token
    generateToken((user as IUser & { _id: string })._id.toString(), res);

    //* Send success response
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.log("Error in login controller", error);
    //* Send error response
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const logout = (req: Request, res: Response) => {
  try {
    res.cookie("jwt", "", {
      httpOnly: true,
      expires: new Date(0),
      sameSite: "strict",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.log("Error in logout controller", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    // req.user is set by protectRoute middleware
    const userId = req.user?._id;
    if (!userId) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if req.body exists and has the required properties
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is required",
      });
    }

    const { username, profilePicture } = req.body;

    // Validate required fields
    if (!username || !profilePicture) {
      return res.status(400).json({
        success: false,
        message: "Username and profile picture are required",
      });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePicture);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          username,
          profilePicture: uploadResponse.secure_url,
        },
      },
      { new: true, runValidators: true, select: "-password" }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found or updated",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture,
      },
    });
  } catch (error) {
    console.log("Error in updateProfile controller", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const checkAuth = async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      message: "User is authenticated",
    });
  } catch (error) {
    console.log("Error in checkAuth controller", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
