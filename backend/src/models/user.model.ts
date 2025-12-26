import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  fullName: string;
  email: string;
  password?: string; // Optional for OAuth users
  googleId?: string; // Present for Google-linked users
  profilePicture: string;
  bio?: string;
}

const UserSchema: Schema = new Schema<IUser>(
  {
    // fullName must NOT be unique (many users can share names)
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String },
    // sparse allows multiple docs with null/undefined googleId while keeping uniqueness when set
    googleId: { type: String, unique: true, sparse: true },
    profilePicture: { type: String, default: "" },
    bio: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
