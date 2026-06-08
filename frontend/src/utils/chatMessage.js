export function parseApiDate(createdAt) {
  if (!createdAt) return null;
  let dateStr = createdAt.replace(" ", "T");
  if (!dateStr.endsWith("Z")) {
    dateStr += "Z";
  }
  return new Date(dateStr);
}

export function formatMessageTime(createdAt) {
  const parsedDate = parseApiDate(createdAt);
  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return createdAt || "";
  }

  return parsedDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function normalizeIncomingMessage(message, currentUserId) {
  return {
    id: message.id ?? Date.now(),
    roomId: message.roomId,
    content: message.content ?? "",
    whoSend: message.senderId === currentUserId ? "self-end" : "self-start",
    time: formatMessageTime(message.createdAt),
    senderId: message.senderId,
    senderName: message.senderName,
    senderAvatarUrl: message.senderAvatarUrl,
    createdAt: message.createdAt,
    messageType: message.messageType,
    recalled: message.recalled ?? false,
    replyToId: message.replyToId,
    replyToSenderName: message.replyToSenderName,
    replyToContent: message.replyToContent,
    replyToMessageType: message.replyToMessageType,
    forwarded: message.forwarded ?? false,
    reactions: message.reactions || [],
  };
}
