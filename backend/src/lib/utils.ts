import jwt from "jsonwebtoken";
import { Response } from "express";

const generateToken = (id: string, res: Response) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  // Cookie SameSite rules:
  // - If frontend + backend are on different "sites" (different registrable domain), Strict/Lax will block cookies on XHR.
  // - In that case you need SameSite=None + Secure (HTTPS).
  // - If same-site (e.g. localhost:5173 + localhost:5001), Lax is fine and avoids surprises with redirects.
  const frontendUrlConfigured = !!process.env.FRONTEND_URL;
  const isProduction = process.env.NODE_ENV === "production";
  const sameSite: "lax" | "none" = isProduction && frontendUrlConfigured ? "none" : "lax";

  res.cookie("jwt", token, {
    httpOnly: true,
    // Only require Secure cookies in production (HTTPS).
    // In local dev, Secure cookies on http://localhost will be dropped by the browser.
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24,
    sameSite,
  });

  return token;
};

export default generateToken;
