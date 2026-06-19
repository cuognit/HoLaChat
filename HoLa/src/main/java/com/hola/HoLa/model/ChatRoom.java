package com.hola.HoLa.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lớp đại diện cho phòng chat (có thể là chat cá nhân hoặc nhóm).
 * Ánh xạ với bảng "chat_rooms" trong cơ sở dữ liệu.
 */
@Entity
@Table(name = "chat_rooms")
@Data
@NoArgsConstructor 
@AllArgsConstructor
public class ChatRoom {
    @Id    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String roomName;

    private Boolean isGroup = false;
    private String avatarUrl;

    @CreationTimestamp
    private LocalDateTime createdAt;

}
