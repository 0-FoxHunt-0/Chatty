import jwt from "jsonwebtoken";
import { Response } from "express";

const generateToken = (id: string, res: Response) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  res.cookie("jwt", token, {
    httpOnly: true,
    // Only require Secure cookies in production (HTTPS).
    // In local dev, Secure cookies on http://localhost will be dropped by the browser.
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24,
    sameSite: "strict",
  });

  return token;
};

export default generateToken;
