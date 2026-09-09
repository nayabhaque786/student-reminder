import express from "express";

const router = express.Router();

// Example route
router.post("/add", (req, res) => {
  const { reminderId, reminderData } = req.body;
  // For now, just echo back
  res.json({ reminderId, reminderData, status: "saved" });
});

router.get("/:id", (req, res) => {
  const reminderId = req.params.id;
  // For now, just return dummy data
  res.json({ reminderId, reminder: "Sample reminder data" });
});

export default router;
