package com.hola.HoLa.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lớp lưu trữ token của thiết bị (dùng cho Push Notification).
 * Ánh xạ với bảng "device_tokens" trong cơ sở dữ liệu.
 */
@Entity
@Table(name = "device_tokens")
@Data
@NoArgsConstructor 
@AllArgsConstructor
public class DeviceToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true)
    private String token;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
