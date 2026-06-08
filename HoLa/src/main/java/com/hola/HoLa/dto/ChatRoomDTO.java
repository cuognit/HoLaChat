package com.hola.HoLa.dto;

import lombok.Data;
import java.time.Instant;

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
    private Instant lastActiveAt;
    private String lastMessage;
    private java.time.LocalDateTime lastMessageTime;
    private Long lastSenderId;
    private Integer unreadCount;
    private Boolean isLastMessageSeen;

    // Thuộc tính phục vụ Real-time Friend Request
    private String friendshipStatus;
    private Long friendshipSenderId;

    // Group room fields
    private Integer memberCount;
    private com.hola.HoLa.model.MemberRole currentUserRole;

    // Last message metadata
    private String lastMessageType;   // TEXT | IMAGE | FILE | SYSTEM
    private String lastSenderName;    // Tên người gửi tin cuối (cho group)

    // Danh sách người đã xem tin nhắn cuối (avatar seen indicator)
    private java.util.List<com.hola.HoLa.dto.SeenUserDTO> seenByUsers;
}