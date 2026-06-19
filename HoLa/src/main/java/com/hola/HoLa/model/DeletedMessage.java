package com.hola.HoLa.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lớp đại diện cho các tin nhắn đã bị người dùng xóa (xóa ở phía họ, không phải thu hồi).
 * Ánh xạ với bảng "deleted_messages" trong cơ sở dữ liệu.
 */
@Entity
@Table(name = "deleted_messages", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "message_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeletedMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;
}
