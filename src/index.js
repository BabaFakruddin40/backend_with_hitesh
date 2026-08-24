import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import mongoose from "mongoose";
import connectDB from "./db/index.js";


const ConnectionInstance = async () => {
  try {
    await connectDB();
    console.log("connected to Mongodb server, started successfully");
  } catch (error) {
    console.error("Error Connecting to Mongodb server:", error);
  }
};

ConnectionInstance();