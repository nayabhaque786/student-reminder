import dotenv from "dotenv";
dotenv.config();

console.log("OpenAI Key loaded:", process.env.OPENAI_API_KEY ? "Yes" : "No");

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

import aiRoutes from "./routes/ai.js";
import reminderRoutes from "./routes/reminders.js";
import analyticsRoutes from "./routes/analytics.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api/ai", aiRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/analytics", analyticsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

