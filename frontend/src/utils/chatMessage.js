export function formatMessageTime(createdAt) {
    if (!createdAt) {
        return "";
    }

    const parsedDate = new Date(createdAt.replace(" ", "T"));

    if (Number.isNaN(parsedDate.getTime())) {
        return createdAt;
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
        createdAt: message.createdAt,
        messageType: message.messageType,
    };
}
