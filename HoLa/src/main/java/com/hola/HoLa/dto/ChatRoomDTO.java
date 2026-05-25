package com.hola.HoLa.dto;

import lombok.Data;

@Data
public class ChatRoomDTO {
    private Long id;
    private String roomName;
    private Boolean isGroup;
    private String avatarUrl;
    private Long targetUserId;
    private String targetUserName;
    private String targetAvatarUrl;
    private Boolean isOnline;
    private String lastMessage;
    private java.time.LocalDateTime lastMessageTime;
    private Long lastSenderId;
    private Integer unreadCount;
    private Boolean isLastMessageSeen;
    
    // Thuộc tính phục vụ Real-time Friend Request
    private String friendshipStatus;
    private Long friendshipSenderId;
}