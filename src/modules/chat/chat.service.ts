import { ChatMessage } from "./chat.model";

export const saveMessage = async (
  senderId: string,
  receiverId: string,
  message: string
) => {
  return ChatMessage.create({ senderId, receiverId, message });
};

export const getChatHistory = async (userId: string, withUser: string) => {
  return ChatMessage.find({
    $or: [
      { senderId: userId, receiverId: withUser },
      { senderId: withUser, receiverId: userId },
    ],
  }).sort({ createdAt: 1 });
};

export const getConversations = async (userId: string) => {
  // return list of distinct conversation partner ids with last message timestamp
  const rows = await ChatMessage.aggregate([
    { $match: { $or: [{ senderId: userId }, { receiverId: userId }] } },
    {
      $project: {
        partner: {
          $cond: [{ $eq: ["$senderId", userId] }, "$receiverId", "$senderId"],
        },
        createdAt: 1,
        message: 1,
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$partner",
        lastMessage: { $first: "$message" },
        lastAt: { $first: "$createdAt" },
      },
    },
    { $project: { partner: "$_id", lastMessage: 1, lastAt: 1, _id: 0 } },
    { $sort: { lastAt: -1 } },
  ]);

  return rows;
};

