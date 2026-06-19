package com.hola.HoLa.scheduler;

import com.hola.HoLa.repository.RefreshTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
/**
 * Lớp cấu hình / tiện ích / bảo mật: TokenCleanupScheduler.
 */
public class TokenCleanupScheduler {
    private static final Logger log = LoggerFactory.getLogger(TokenCleanupScheduler.class);

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    // Tự động quét dọn vào 2 giờ sáng mỗi ngày (Cron: giây phút giờ ngày tháng thứ)
    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanExpiredTokens() {
        log.info("Starting scheduled cleanup of expired refresh tokens...");
        try {
            refreshTokenRepository.deleteByExpiryDateBefore(LocalDateTime.now());
            log.info("Expired refresh tokens cleaned up successfully from database.");
        } catch (Exception e) {
            log.error("Failed to clean up expired refresh tokens", e);
        }
    }
}