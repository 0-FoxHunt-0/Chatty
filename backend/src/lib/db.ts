import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error(
        "ERROR: MONGODB_URI is not defined in environment variables"
      );
      throw new Error("MONGODB_URI is not defined in environment variables");
    }
    console.log("Attempting to connect to MongoDB...");
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✓ Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`✗ MongoDB Connection Error: ${(error as Error).message}`);
    console.error("Full error:", error);
    process.exit(1);
  }
};

export default connectDB;
