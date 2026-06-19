package com.hola.HoLa.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.hola.HoLa.model.RefreshToken;

import jakarta.transaction.Transactional;

@Repository
/**
 * Lớp Repository cho RefreshTokenRepository.
 * Chịu trách nhiệm giao tiếp với cơ sở dữ liệu.
 */
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long>{    
    public Optional<RefreshToken> findByUserEmail(String email);
    public Optional<RefreshToken> findByRefreshToken(String refreshToken);
    @Transactional
    public void deleteByRefreshToken(String refreshToken);
    @org.springframework.transaction.annotation.Transactional
    public void deleteByExpiryDateBefore(java.time.LocalDateTime now);
}
