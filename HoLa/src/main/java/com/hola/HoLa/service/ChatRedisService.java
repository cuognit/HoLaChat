package com.hola.HoLa.service;

import java.time.Duration;
import java.util.Map;
import java.util.Set;
import org.redisson.api.RBucket;
import org.redisson.api.RMap;
import org.redisson.api.RSet;
import org.redisson.api.RedissonClient;
import org.redisson.codec.JsonJacksonCodec;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
/**
 * Lớp Service chứa logic nghiệp vụ cho ChatRedisService.
 */
public class ChatRedisService {

    @Autowired
    private RedissonClient redissonClient;

    private static final String UNREAD_MAP_PREFIX = "user:%d:unread_counts";
    private static final String ACTIVE_ROOM_PREFIX = "user:%d:activeRoom";
    private static final JsonJacksonCodec CODEC = new JsonJacksonCodec();

    // Unread Count Logic using Redis Hash
    public void incrementUnread(Long userId, Long roomId) {
        if (userId == null || roomId == null) return;
        RMap<Long, Integer> unreadMap = redissonClient.getMap(String.format(UNREAD_MAP_PREFIX, userId), CODEC);
        unreadMap.addAndGet(roomId, 1);
    }

    public void resetUnread(Long userId, Long roomId) {
        if (userId == null || roomId == null) return;
        RMap<Long, Integer> unreadMap = redissonClient.getMap(String.format(UNREAD_MAP_PREFIX, userId), CODEC);
        unreadMap.remove(roomId);
    }

    public Integer getUnreadCount(Long userId, Long roomId) {
        if (userId == null || roomId == null) return 0;
        RMap<Long, Integer> unreadMap = redissonClient.getMap(String.format(UNREAD_MAP_PREFIX, userId), CODEC);
        Integer count = unreadMap.get(roomId);
        return count != null ? count : 0;
    }

    public Map<Long, Integer> getAllUnreadCounts(Long userId) {
        if (userId == null) return Map.of();
        RMap<Long, Integer> unreadMap = redissonClient.getMap(String.format(UNREAD_MAP_PREFIX, userId), CODEC);
        return unreadMap.readAllMap();
    }

    // Active Room Logic using Redis Bucket
    public void setActiveRoom(Long userId, Long roomId) {
        if (userId == null || roomId == null) return;
        RBucket<Long> activeRoomBucket = redissonClient.getBucket(String.format(ACTIVE_ROOM_PREFIX, userId), CODEC);
        // Set with TTL of 60 seconds. Client needs to ping/refresh this if they stay in the room.
        // Or it will be cleared on disconnect anyway.
        activeRoomBucket.set(roomId, Duration.ofSeconds(60));
    }

    public void removeActiveRoom(Long userId) {
        if (userId == null) return;
        RBucket<Long> activeRoomBucket = redissonClient.getBucket(String.format(ACTIVE_ROOM_PREFIX, userId), CODEC);
        activeRoomBucket.delete();
    }

    public Long getActiveRoom(Long userId) {
        if (userId == null) return null;
        RBucket<Long> activeRoomBucket = redissonClient.getBucket(String.format(ACTIVE_ROOM_PREFIX, userId), CODEC);
        return activeRoomBucket.get();
    }

    // SeenBy Logic using Redis Set
    private static final String SEEN_BY_PREFIX = "room:%d:seenBy";

    public void addSeenBy(Long roomId, Long userId) {
        if (roomId == null || userId == null) return;
        RSet<Long> seenSet = redissonClient.getSet(String.format(SEEN_BY_PREFIX, roomId), CODEC);
        seenSet.add(userId);
        seenSet.expire(Duration.ofHours(24));
    }

    public Set<Long> getSeenBy(Long roomId) {
        if (roomId == null) return Set.of();
        RSet<Long> seenSet = redissonClient.getSet(String.format(SEEN_BY_PREFIX, roomId), CODEC);
        return seenSet.readAll();
    }

    public void clearSeenBy(Long roomId) {
        if (roomId == null) return;
        RSet<Long> seenSet = redissonClient.getSet(String.format(SEEN_BY_PREFIX, roomId), CODEC);
        seenSet.delete();
    }
}
