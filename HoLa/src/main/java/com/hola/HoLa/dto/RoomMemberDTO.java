package com.hola.HoLa.dto;

import com.hola.HoLa.model.MemberRole;
import lombok.Data;
import java.time.LocalDateTime;
import java.time.Instant;

@Data
public class RoomMemberDTO {
    private Long id;
    private Long roomId;
    private Long userId;
    private MemberRole role;
    private String userName;
    private String avatarUrl;
    private Boolean isOnline;
    private Instant lastActiveAt;
    private LocalDateTime joinedAt;
}
