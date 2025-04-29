import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { userRouter } from "./routes/users.js";
import { recipesRouter } from "./routes/recipes.js";

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routers
app.use("/auth", userRouter);
app.use("/recipes", recipesRouter);

// MongoDB Connection
const MONGO_URL = "mongodb+srv://suresh306dm:recipeDbms@recipes.stqecho.mongodb.net/recipes?retryWrites=true&w=majority";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1); // Exit the process if connection fails
  }
};

connectDB();

// Start server
const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
