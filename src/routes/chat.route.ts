import { Router } from "express";
import { getChatHistory, saveMessage, getConversations } from "../modules/chat/chat.service";
import { redisClient } from "../config/redis.config";
import { ioInstance } from "../server";
import { requireFields } from "../middlewares/validate.middleware";

const router = Router();

// GET /chats/:userId/with/:withUser
router.get("/:userId/with/:withUser", async (req, res) => {
  try {
    const { userId, withUser } = req.params;
    const requester = (req as any).userId as string | undefined;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });
    if (requester !== userId) return res.status(403).json({ message: "Forbidden" });

    const history = await getChatHistory(userId, withUser);
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch history" });
  }
});

// POST /chats/:userId/send
router.post("/:userId/send", requireFields(["receiverId","message"]), async (req, res) => {
  try {
    const { userId } = req.params;
    const requester = (req as any).userId as string | undefined;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });
    if (requester !== userId) return res.status(403).json({ message: "Forbidden" });

    const { receiverId, message } = req.body as { receiverId?: string; message?: string };
    if (!receiverId || !message) return res.status(400).json({ message: "receiverId and message are required" });

    const saved = await saveMessage(userId, receiverId, message);

    // attempt realtime delivery if receiver is online
    try {
      const receiverSocket = await redisClient.get(`user:${receiverId}`);
      if (receiverSocket && ioInstance) {
        ioInstance.to(receiverSocket).emit("receive_message", saved);
      }
    } catch (e) {
      // ignore real-time delivery errors
    }

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: "Failed to send message" });
  }
});

// GET /chats/:userId/conversations
router.get("/:userId/conversations", async (req, res) => {
  try {
    const { userId } = req.params;
    const requester = (req as any).userId as string | undefined;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });
    if (requester !== userId) return res.status(403).json({ message: "Forbidden" });

    const conv = await getConversations(userId);
    res.json(conv);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
});

export default router;
