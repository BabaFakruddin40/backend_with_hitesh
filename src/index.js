import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { app } from "./app.js";
import mongoose from "mongoose";
import connectDB from "./db/index.js";


const ConnectionInstance = async () => {
  try {
    await connectDB();
    console.log("connected to Mongodb server, started successfully");
    console.log(`Host: ${mongoose.connection.host}`);
    console.log(`Port: ${mongoose.connection.port}`);
  } catch (error) {
    console.error("Error Connecting to Mongodb server:", error);
  }
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

ConnectionInstance();