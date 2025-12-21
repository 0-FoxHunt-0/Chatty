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
    secure: process.env.NODE_ENV !== "development",
    maxAge: 1000 * 60 * 60 * 24,
    sameSite: "strict",
  });

  return token;
};

export default generateToken;
