import app from "../src/app.js";
import connectDB from "../src/db/index.js";


let isDbConnected = false;

export default async function handler(req, res) {
  if (!isDbConnected) {
    try {
      await connectDB();

      isDbConnected = true;
    } catch (err) {
      console.error("Database connection error in Vercel handler:", err);
      return res.status(500).json({
        success: false,
        message: "Database connection failed",
        error: err.message,
      });
    }
  }

  return app(req, res);
}
