package com.hola.HoLa.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lớp đại diện cho thành viên trong một phòng chat.
 * Ánh xạ với bảng "room_members" trong cơ sở dữ liệu.
 */
@Entity
@Table(name = "room_members")
@Data
@NoArgsConstructor 
@AllArgsConstructor 
public class RoomMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ChatRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    private MemberRole role = MemberRole.MEMBER; // Enum: ADMIN, MEMBER

    private Long lastReadMessageId;

    @CreationTimestamp
    private LocalDateTime joinedAt;
}

