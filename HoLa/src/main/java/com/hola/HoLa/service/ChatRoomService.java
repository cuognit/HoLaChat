package com.hola.HoLa.service;

import com.hola.HoLa.dto.ChatRoomDTO;
import com.hola.HoLa.model.ChatRoom;
import com.hola.HoLa.model.RoomMember;
import com.hola.HoLa.model.User;
import java.util.List;
import com.hola.HoLa.repository.ChatRoomRepository;
import com.hola.HoLa.repository.RoomMemberRepository;
import com.hola.HoLa.repository.UserRepository;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChatRoomService {
    @Autowired
    private ChatRoomRepository chatRoomRepository;

    @Autowired
    private RoomMemberRepository roomMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.hola.HoLa.repository.MessageRepository messageRepository;

    @Autowired
    private RedissonClient redissonClient;

    @Autowired
    private ChatRedisService chatRedisService;

    @Transactional
    public ChatRoom getOrCreatePrivateRoom(Long user1Id, Long user2Id) {
        validatePrivateChatUsers(user1Id, user2Id);

        return roomMemberRepository.findPrivateRoom(user1Id, user2Id)
                .orElseGet(() -> createPrivateRoom(user1Id, user2Id));
    }

    public ChatRoom getValidatedPrivateRoom(Long roomId, Long senderId, Long receiverId) {
        validatePrivateChatUsers(senderId, receiverId);

        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Chat room not found"));

        if (Boolean.TRUE.equals(room.getIsGroup())) {
            throw new RuntimeException("Room is not a private chat");
        }

        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, senderId)
                || !roomMemberRepository.existsByRoomIdAndUserId(roomId, receiverId)) {
            throw new RuntimeException("Users do not belong to this room");
        }

        return room;
    }

    @Transactional(readOnly = true)
    public List<ChatRoomDTO> getRoomsByUserId(Long userId) {
        if (userId == null) {
            throw new RuntimeException("User id is required");
        }

        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return roomMemberRepository.findRoomsByUserId(userId)
                .stream()
                .map(room -> toDto(room, userId))
                .toList();
    }

    private ChatRoom createPrivateRoom(Long user1Id, Long user2Id) {
        User user1 = userRepository.findById(user1Id)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User user2 = userRepository.findById(user2Id)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        ChatRoom room = new ChatRoom();
        room.setIsGroup(false);
        room.setRoomName(user1.getUserName() + " - " + user2.getUserName());
        ChatRoom savedRoom = chatRoomRepository.save(room);

        RoomMember member1 = new RoomMember();
        member1.setRoom(savedRoom);
        member1.setUser(user1);

        RoomMember member2 = new RoomMember();
        member2.setRoom(savedRoom);
        member2.setUser(user2);

        roomMemberRepository.save(member1);
        roomMemberRepository.save(member2);

        return savedRoom;
    }

    private void validatePrivateChatUsers(Long user1Id, Long user2Id) {
        if (user1Id == null || user2Id == null) {
            throw new RuntimeException("Both users are required");
        }
        if (user1Id.equals(user2Id)) {
            throw new RuntimeException("Private chat requires 2 different users");
        }
    }

    public ChatRoomDTO toDto(ChatRoom room, Long currentUserId) {
        ChatRoomDTO dto = new ChatRoomDTO();
        dto.setId(room.getId());
        dto.setRoomName(room.getRoomName());
        dto.setIsGroup(room.getIsGroup());
        dto.setAvatarUrl(room.getAvatarUrl());

        final Long[] targetIdArr = new Long[1];
        if (!Boolean.TRUE.equals(room.getIsGroup())) {
            roomMemberRepository.findFirstByRoomIdAndUserIdNot(room.getId(), currentUserId)
                    .map(RoomMember::getUser)
                    .ifPresent(targetUser -> {
                        targetIdArr[0] = targetUser.getId();
                        dto.setTargetUserId(targetUser.getId());
                        dto.setTargetUserName(targetUser.getUserName());
                        dto.setTargetAvatarUrl(targetUser.getAvatarUrl());

                        // Check real-time status from Redis
                        RBucket<String> statusBucket = redissonClient.getBucket("user:status:" + targetUser.getEmail().toLowerCase());
                        dto.setIsOnline("online".equals(statusBucket.get()));
                    });
        }

        // Add last message info
        messageRepository.findFirstByRoomIdOrderByCreatedAtDesc(room.getId())
                .ifPresent(lastMsg -> {
                    dto.setLastMessage(lastMsg.getContent());
                    dto.setLastMessageTime(lastMsg.getCreatedAt());
                    dto.setLastSenderId(lastMsg.getSender().getId());
                });

        // Set unread count from Redis
        dto.setUnreadCount(chatRedisService.getUnreadCount(currentUserId, room.getId()));

        if (dto.getLastSenderId() != null && dto.getLastSenderId().equals(currentUserId) && targetIdArr[0] != null) {
            int opponentUnread = chatRedisService.getUnreadCount(targetIdArr[0], room.getId());
            dto.setIsLastMessageSeen(opponentUnread == 0);
        } else {
            dto.setIsLastMessageSeen(false);
        }

        return dto;
    }
}
