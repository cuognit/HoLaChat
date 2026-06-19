package com.hola.HoLa.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hola.HoLa.model.DeviceToken;

@Repository
/**
 * Lớp Repository cho DeviceTokenRepository.
 * Chịu trách nhiệm giao tiếp với cơ sở dữ liệu.
 */
public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {
    Optional<DeviceToken> findByToken(String token);
    void deleteByToken(String token);
    List<DeviceToken> findByUserId(Long userId);
}
