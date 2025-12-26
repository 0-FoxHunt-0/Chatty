import { Request, Response } from "express";
import { IUser } from "../models/user.model";
import User from "../models/user.model";
import bcrypt from "bcryptjs";
import generateToken from "../lib/utils";
import cloudinary from "../lib/cloudinary";

// Helper function to get frontend URL from request or environment
const getFrontendUrl = (req: Request): string => {
  const isDevelopment =
    process.env.NODE_ENV !== "production" || !process.env.NODE_ENV;

  // In development, always use localhost:5173
  if (isDevelopment) {
    return "http://localhost:5173";
  }

  // In production, try multiple sources:
  // 1. Use FRONTEND_URL env variable if set
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL.replace(/\/$/, "");
  }

  // 2. Use request origin (works when frontend and backend are on same domain)
  const origin = req.headers.origin;
  if (origin) {
    return origin.replace(/\/$/, "");
  }

  // 3. Construct from request protocol and host
  // Handle proxy headers (common on platforms like Render)
  const forwardedProto = req.get("x-forwarded-proto");
  const protocol =
    forwardedProto || req.protocol || (req.secure ? "https" : "http");
  const host = req.get("x-forwarded-host") || req.get("host");
  if (host) {
    return `${protocol}://${host}`.replace(/\/$/, "");
  }

  // 4. Fallback (shouldn't happen in production)
  console.warn(
    "[getFrontendUrl] Could not determine frontend URL, using default"
  );
  return "http://localhost:5173";
};

export const signup = async (req: Request, res: Response) => {
  console.log("=== SIGNUP REQUEST RECEIVED ===");
  console.log("Request body:", { ...req.body, password: "[REDACTED]" });

  const userData: IUser = req.body;
  const salt = await bcrypt.genSalt(10); //* Salt generation

  if (!userData.fullName || !userData.email || !userData.password) {
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
      fullName: userData.fullName,
      email: userData.email,
      password: hashedPassword,
      profilePicture: userData?.profilePicture || "",
      bio: userData?.bio || "",
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
          fullName: user.fullName,
          email: user.email,
          profilePicture: user.profilePicture,
          bio: user.bio,
        },
      });
    }
  } catch (error) {
    console.error("=== ERROR IN SIGNUP CONTROLLER ===");
    console.error(
      "Error type:",
      error instanceof Error ? error.constructor.name : typeof error
    );
    console.error(
      "Error message:",
      error instanceof Error ? error.message : String(error)
    );
    console.error("Full error:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
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

    // If user was created via Google OAuth and has no password, prevent password login
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message:
          "This account uses Google sign-in. Please continue with Google.",
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
        fullName: user.fullName,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
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

export const googleCallback = async (req: Request, res: Response) => {
  try {
    // Passport attaches the linked/created user to req.user
    const user = req.user as (IUser & { _id: string }) | undefined;

    // Get frontend URL from request or environment
    const frontendUrl = getFrontendUrl(req);

    // Get the returnTo path from session (stored before Google redirect)
    const returnTo = req.session.returnTo || "/";
    const redirectUrl = `${frontendUrl}${returnTo}`;

    console.log(
      `[googleCallback] NODE_ENV: ${process.env.NODE_ENV}, frontendUrl: ${frontendUrl}, returnTo: ${returnTo}, redirecting to: ${redirectUrl}`
    );

    if (!user) {
      return res.redirect(redirectUrl);
    }

    generateToken(user._id.toString(), res);

    // Clear the returnTo from session after using it
    if (req.session.returnTo) {
      delete req.session.returnTo;
    }

    // Redirect to the stored returnTo path (or base route)
    return res.redirect(redirectUrl);
  } catch (error) {
    console.log("Error in googleCallback controller", error);
    const frontendUrl = getFrontendUrl(req);

    // Try to get returnTo from session even on error
    const returnTo = req.session.returnTo || "/";
    const redirectUrl = `${frontendUrl}${returnTo}`;

    console.log(`[googleCallback error] redirecting to: ${redirectUrl}`);
    return res.redirect(redirectUrl);
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

    const { fullName, email, bio, profilePicture } = req.body;

    // Validate required fields
    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: "fullName is required",
      });
    }

    const updateData: any = {
      fullName,
    };

    if (email) {
      updateData.email = email;
    }

    if (bio !== undefined) {
      updateData.bio = bio;
    }

    if (profilePicture) {
      const uploadResponse = await cloudinary.uploader.upload(profilePicture);
      updateData.profilePicture = uploadResponse.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: updateData,
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
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture,
        bio: updatedUser.bio,
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
    // req.user is set by protectRoute middleware
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    res.status(200).json({
      success: true,
      message: "User is authenticated",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.log("Error in checkAuth controller", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
