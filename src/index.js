import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/index.js";
import seedUsers from "./seed.js";

// Load environment variables
dotenv.config();


const PORT = process.env.PORT || 5000;

// Connect DB first, then start server
connectDB()
  .then(async () => {

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });


