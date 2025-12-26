import "./env";
import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import User, { IUser } from "../models/user.model";
import cloudinary from "./cloudinary";

// Google OAuth requires an absolute callback URL
// In development, use localhost:5001 (backend)
// In production, use the full URL from env or construct from backend URL
const getCallbackURL = (): string => {
  if (process.env.GOOGLE_CALLBACK_URL) {
    return process.env.GOOGLE_CALLBACK_URL;
  }

  const isDevelopment = process.env.NODE_ENV !== "production";
  const backendPort = process.env.PORT || 5001;

  if (isDevelopment) {
    return `http://localhost:${backendPort}/api/auth/google/callback`;
  }

  // In production, try to construct from BACKEND_URL or default
  const backendUrl =
    process.env.BACKEND_URL || `http://localhost:${backendPort}`;
  return `${backendUrl.replace(/\/$/, "")}/api/auth/google/callback`;
};

const callbackURL = getCallbackURL();

// Only register Google OAuth strategy if credentials are provided
// This allows the app to run without Google OAuth configured
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (googleClientId && googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL,
      },
      async (_accessToken, _refreshToken, profile: Profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value?.toLowerCase();
          const fullName =
            profile.displayName ||
            [profile.name?.givenName, profile.name?.familyName]
              .filter(Boolean)
              .join(" ") ||
            "User";
          const googleProfilePictureUrl = profile.photos?.[0]?.value || "";

          // Upload profile picture to Cloudinary if available
          let profilePicture = "";
          if (googleProfilePictureUrl) {
            try {
              // Cloudinary can upload directly from a URL
              const uploadResponse = await cloudinary.uploader.upload(
                googleProfilePictureUrl,
                {
                  transformation: [
                    { width: 400, height: 400, crop: "fill", gravity: "face" },
                  ],
                }
              );
              profilePicture = uploadResponse.secure_url;
            } catch (uploadError) {
              console.error(
                "Failed to upload Google profile picture to Cloudinary:",
                uploadError
              );
              // Fallback to Google's URL if Cloudinary upload fails
              profilePicture = googleProfilePictureUrl;
            }
          }

          // 1) already linked by googleId
          let user = await User.findOne({ googleId });
          if (user) return done(null, user);

          // 2) link by email
          if (email) {
            user = await User.findOne({ email });
            if (user) {
              user.googleId = googleId;
              // Only update profile picture if user doesn't have one or if we got a new one from Google
              if (!user.profilePicture && profilePicture) {
                user.profilePicture = profilePicture;
              }
              await user.save();
              return done(null, user);
            }
          }

          // 3) new user (google-only)
          if (!email) {
            return done(
              new Error("Google account did not provide an email"),
              false
            );
          }

          const created = await User.create({
            googleId,
            email,
            fullName,
            profilePicture,
            bio: "",
          } as Partial<IUser>);

          return done(null, created);
        } catch (err) {
          return done(err as Error, false);
        }
      }
    )
  );
} else {
  console.warn(
    "Google OAuth credentials not found. Google sign-in will be disabled."
  );
}

passport.serializeUser((user: any, done) => {
  done(null, user._id?.toString?.() ?? user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id).select("-password");
    done(null, user);
  } catch (err) {
    done(err as Error, false);
  }
});

export default passport;
