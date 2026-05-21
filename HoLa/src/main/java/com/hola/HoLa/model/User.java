package com.hola.HoLa.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor 
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, length = 100)
    private String userName;

    @Column(nullable = false)
    private String passWord;

    private String avatarUrl;
    private String coverUrl;
    private String gender;
    private LocalDate birthday;
    private Boolean isOnline = false;
    private Boolean isVerified = false;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
