package com.hola.HoLa.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.hola.HoLa.model.RefreshToken;

import jakarta.transaction.Transactional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long>{    
    public Optional<RefreshToken> findByUserEmail(String email);
    public Optional<RefreshToken> findByRefreshToken(String refreshToken);
    @Transactional
    public void deleteByRefreshToken(String refreshToken);
}
