import { Server, Socket } from "socket.io";
import { redisClient } from "../../config/redis.config";
import { saveMessage, getChatHistory } from "./chat.service";
import { SendMessagePayload } from "./chat.types";

export const chatSocket = (io: Server) => {
  io.on("connection", async (socket: Socket) => {
    const userId = socket.data.userId as string;
    if (!userId) return socket.disconnect();

    // Mark online
    await redisClient.set(`user:${userId}`, socket.id);

    socket.on("send_message", async (payload: SendMessagePayload) => {
      try {
        const saved = await saveMessage(userId, payload.receiverId, payload.message);

        const receiverSocket = await redisClient.get(`user:${payload.receiverId}`);
        if (receiverSocket) {
          io.to(receiverSocket).emit("receive_message", saved);
        }
        // also emit ack to sender
        socket.emit("message_sent", saved);
      } catch (err) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("fetch_history", async ({ withUser }) => {
      const history = await getChatHistory(userId, withUser);
      socket.emit("chat_history", history);
    });

    socket.on("disconnect", async () => {
      await redisClient.del(`user:${userId}`);
    });
  });
};
