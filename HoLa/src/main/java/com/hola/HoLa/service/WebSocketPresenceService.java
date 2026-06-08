package com.hola.HoLa.service;

import java.util.HashMap;
import java.util.Map;
import com.hola.HoLa.repository.UserRepository;
import org.redisson.api.RAtomicLong;
import org.redisson.api.RBucket;
import org.redisson.api.RMap;
import org.redisson.api.RedissonClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Service
public class WebSocketPresenceService {
    private static final Logger log = LoggerFactory.getLogger(WebSocketPresenceService.class);
    
    @Autowired
    private RedissonClient redissonClient;

    @Autowired
    private UserService userService;

    @Autowired
    private ChatRedisService chatRedisService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private static final String SESSION_USER_MAP = "ws:session:users";
    private static final String USER_SESSION_COUNT_PREFIX = "ws:user:sessions:";
    private static final String USER_ONLINE_STATUS_PREFIX = "user:status:";

    /**
     * Trực tiếp gọi từ Interceptor để đảm bảo Authentication đã xong
     */
    public void processConnect(String email, String sessionId) {
        if (email == null || sessionId == null) return;
        
        email = email.toLowerCase();
        log.info("Processing Connect for: {} (Session: {})", email, sessionId);
        
        // Save session to user mapping
        RMap<String, String> sessionUsers = redissonClient.getMap(SESSION_USER_MAP);
        String existingEmail = sessionUsers.putIfAbsent(sessionId, email);

        if (existingEmail != null) {
            log.info("Session {} already exists for user {}, skipping increment", sessionId, existingEmail);
            return;
        }

        // Increment user session count atomically
        RAtomicLong counter = redissonClient.getAtomicLong(USER_SESSION_COUNT_PREFIX + email);
        long activeSessions = counter.incrementAndGet();
        log.info("User {} now has {} active sessions", email, activeSessions);

        // If it's the first session, set online status in Redis and update DB
        // Also update if status is not "online" in Redis just in case
        RBucket<String> statusBucket = redissonClient.getBucket(USER_ONLINE_STATUS_PREFIX + email);
        boolean wasAlreadyOnline = "online".equals(statusBucket.get());

        if (activeSessions == 1 || !wasAlreadyOnline) {
            log.info("User {} is now ONLINE (activeSessions: {}, wasAlreadyOnline: {})", email, activeSessions, wasAlreadyOnline);
            statusBucket.set("online");
            
            userService.updateOnlineStatusByEmail(email, true);
            broadcastStatus(email, true);
        }
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        log.info("WebSocket Disconnect Event - SessionId: {}", sessionId);
        
        if (sessionId == null) {
            return;
        }

        RMap<String, String> sessionUsers = redissonClient.getMap(SESSION_USER_MAP);
        String email = sessionUsers.remove(sessionId);
        
        if (email == null) {
            log.warn("Disconnect session {} not found in mapping", sessionId);
            return;
        }

        email = email.toLowerCase();
        RAtomicLong counter = redissonClient.getAtomicLong(USER_SESSION_COUNT_PREFIX + email);
        long activeSessions = counter.decrementAndGet();
        log.info("User {} now has {} active sessions remaining", email, activeSessions);

        // If no more active sessions, set offline status
        if (activeSessions <= 0) {
            log.info("User {} is now OFFLINE", email);
            if (activeSessions < 0) {
                log.warn("Counter for {} was negative: {}, resetting to 0", email, activeSessions);
                counter.set(0);
            }
            
            RBucket<String> statusBucket = redissonClient.getBucket(USER_ONLINE_STATUS_PREFIX + email);
            statusBucket.delete();
            
            userService.updateOnlineStatusByEmail(email, false);
            broadcastStatus(email, false);
        }

        // Clean up active room for the user
        userRepository.findByEmail(email).ifPresent(user -> {
            chatRedisService.removeActiveRoom(user.getId());
        });
    }

    private void broadcastStatus(String email, boolean isOnline) {
        userRepository.findByEmail(email).ifPresent(user -> {
            log.info("Broadcasting status change for {}: {}", email, isOnline ? "ONLINE" : "OFFLINE");
            Map<String, Object> statusUpdate = new HashMap<>();
            statusUpdate.put("userId", user.getId());
            statusUpdate.put("email", email);
            statusUpdate.put("isOnline", isOnline);
            if (user.getLastActiveAt() != null) {
                statusUpdate.put("lastActiveAt", user.getLastActiveAt().toString());
            }
            messagingTemplate.convertAndSend("/topic/user-status", statusUpdate);
        });
    }

    /**
     * Clear all session-related data on startup to avoid stale "online" statuses.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void clearStaleSessions() {
        log.info("Clearing stale WebSocket sessions from Redis...");
        try {
            // Delete specific map
            redissonClient.getMap(SESSION_USER_MAP).delete();
            
            // Delete patterns
            redissonClient.getKeys().deleteByPattern(USER_SESSION_COUNT_PREFIX + "*");
            redissonClient.getKeys().deleteByPattern(USER_ONLINE_STATUS_PREFIX + "*");
            redissonClient.getKeys().deleteByPattern("user:*:activeRoom");
            
            // Reset all users to offline in DB on startup
            log.info("Resetting all users to offline in database...");
            userRepository.updateAllUserStatus(false);
        } catch (Exception e) {
            log.error("Failed to clear stale sessions", e);
        }
    }

    public boolean isUserOnline(String email) {
        if (email == null) return false;
        RBucket<String> statusBucket = redissonClient.getBucket(USER_ONLINE_STATUS_PREFIX + email.toLowerCase());
        return "online".equals(statusBucket.get());
    }
}
