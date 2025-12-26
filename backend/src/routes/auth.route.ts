import express from "express";
import "../lib/env";
import {
  login,
  logout,
  signup,
  updateProfile,
  checkAuth,
  googleCallback,
} from "../controllers/auth.controller";
import { protectRoute } from "../middleware/auth.middleware";
import passport from "../lib/passport";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

// OAuth provider status (used by the frontend to decide what buttons to show)
router.get("/oauth/status", (req, res) => {
  const missing: string[] = [];
  if (!process.env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!process.env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");

  const googleEnabled = missing.length === 0;

  res.status(200).json({
    success: true,
    providers: {
      google: {
        enabled: googleEnabled,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
        missing,
      },
    },
  });
});

// Google OAuth (backend redirect flow)
// Only register routes if Google OAuth is configured
const isGoogleOAuthConfigured =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

if (isGoogleOAuthConfigured) {
  router.get(
    "/google",
    (req, res, next) => {
      // Store the returnTo path in session before redirecting to Google
      const returnTo = req.query.returnTo as string | undefined;
      if (returnTo) {
        // Ensure it's a valid path (starts with / and doesn't contain protocol)
        const sanitized = returnTo.startsWith("/") ? returnTo : `/${returnTo}`;
        // Remove /login and /register, default to base route
        req.session.returnTo =
          sanitized === "/login" || sanitized === "/register" ? "/" : sanitized;
      } else {
        // Default to base route if no returnTo specified
        req.session.returnTo = "/";
      }
      next();
    },
    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: true,
    })
  );

  router.get(
    "/google/callback",
    passport.authenticate("google", {
      failureRedirect: (() => {
        const isDevelopment =
          process.env?.NODE_ENV !== "production" || !process.env?.NODE_ENV;
        if (isDevelopment) {
          return "http://localhost:5173";
        }
        // In production, use FRONTEND_URL if set, otherwise we'll handle it in the callback
        // This is a fallback - the callback will use request origin if FRONTEND_URL is not set
        return (
          process.env.FRONTEND_URL?.replace(/\/$/, "") ||
          "http://localhost:5173"
        );
      })(),
      session: true,
    }),
    googleCallback
  );
} else {
  // Return error if Google OAuth routes are accessed without configuration
  router.get("/google", (req, res) => {
    const missing: string[] = [];
    if (!process.env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
    if (!process.env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");

    res.status(503).json({
      success: false,
      message: "Google OAuth is not configured",
      missing,
      hint: "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend environment variables. Optionally set GOOGLE_CALLBACK_URL to your full callback URL.",
    });
  });

  router.get("/google/callback", (req, res) => {
    const isDevelopment =
      process.env?.NODE_ENV !== "production" || !process.env?.NODE_ENV;

    let frontendUrl: string;
    if (isDevelopment) {
      frontendUrl = "http://localhost:5173";
    } else if (process.env.FRONTEND_URL) {
      frontendUrl = process.env.FRONTEND_URL.replace(/\/$/, "");
    } else {
      // Try to construct from request (handle proxy headers)
      const forwardedProto = req.get("x-forwarded-proto");
      const protocol =
        forwardedProto || req.protocol || (req.secure ? "https" : "http");
      const host = req.get("x-forwarded-host") || req.get("host");
      frontendUrl = host ? `${protocol}://${host}` : "http://localhost:5173";
    }

    res.redirect(frontendUrl);
  });
}

router.put("/update-profile", protectRoute, updateProfile);

router.get("/check-auth", protectRoute, checkAuth);

export default router;
