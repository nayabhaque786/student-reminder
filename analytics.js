import express from "express";
import { connectDB } from "../mongoConfig.js";

const router = express.Router();

router.post("/track", async (req, res) => {
  const { userId, action } = req.body;
  const db = await connectDB();
  await db.collection("analytics").insertOne({
    userId,
    action,
    timestamp: new Date()
  });
  res.json({ status: "ok" });
});

router.get("/:userId", async (req, res) => {
  const db = await connectDB();
  const stats = await db.collection("analytics")
    .find({ userId: req.params.userId })
    .toArray();
  res.json(stats);
});

export default router;
