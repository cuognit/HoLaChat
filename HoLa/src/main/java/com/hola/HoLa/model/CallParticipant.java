package com.hola.HoLa.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Lớp đại diện cho người tham gia vào một cuộc gọi.
 * Ánh xạ với bảng "call_participants" trong cơ sở dữ liệu.
 */
@Entity
@Table(name = "call_participants")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CallParticipant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "call_session_id", nullable = false)
    private CallSession callSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt;

    @Column(name = "left_at")
    private Instant leftAt;
}
