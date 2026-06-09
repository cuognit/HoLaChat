package com.hola.HoLa.service;

import com.hola.HoLa.constant.GroupConstants;
import com.hola.HoLa.dto.ChatRoomDTO;
import com.hola.HoLa.dto.CreateGroupRequest;
import com.hola.HoLa.model.ChatRoom;
import com.hola.HoLa.model.MemberRole;
import com.hola.HoLa.model.RoomMember;
import com.hola.HoLa.model.User;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import com.hola.HoLa.repository.ChatRoomRepository;
import com.hola.HoLa.repository.DeletedMessageRepository;
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
    private DeletedMessageRepository deletedMessageRepository;

    @Autowired
    private RedissonClient redissonClient;

    @Autowired
    private ChatRedisService chatRedisService;

    @Autowired
    private com.hola.HoLa.repository.FriendshipRepository friendshipRepository;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private MessageService messageService;

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url}")
    private String frontendUrl;

    @Transactional
    public ChatRoom getOrCreatePrivateRoom(Long user1Id, Long user2Id) {
        validatePrivateChatUsers(user1Id, user2Id);

        return roomMemberRepository.findPrivateRoom(user1Id, user2Id)
                .orElseGet(() -> createPrivateRoom(user1Id, user2Id));
    }

    public ChatRoom getValidatedRoom(Long roomId, Long senderId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Chat room not found"));

        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, senderId)) {
            throw new RuntimeException("User does not belong to this room");
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
        // 1. Lấy danh sách các phòng chat thực tế đã kích hoạt
        List<ChatRoomDTO> activeRooms = roomMemberRepository.findRoomsByUserId(userId)
                .stream()
                .map(room -> toDto(room, userId))
                .collect(Collectors.toList());
            // 2. Lấy các lời mời kết bạn PENDING liên quan đến người dùng này
        List<com.hola.HoLa.model.Friendship> pendingFriendships = friendshipRepository.findPendingRequests(userId);

        List<ChatRoomDTO> friendshipDtos = pendingFriendships.stream()
                .map(friendship -> {
                    ChatRoomDTO dto = new ChatRoomDTO();
                    // Đặt ID là số âm từ ID của Friendship để phân biệt rõ ràng với ID thực của ChatRoom
                    dto.setId(-friendship.getId());

                    User targetUser = friendship.getSender().getId().equals(userId)
                            ? friendship.getReceiver()
                            : friendship.getSender();

                    dto.setRoomName(targetUser.getUserName());
                    dto.setIsGroup(false);
                    dto.setAvatarUrl(targetUser.getAvatarUrl());
                    dto.setTargetUserId(targetUser.getId());
                    dto.setTargetUserName(targetUser.getUserName());
                    dto.setTargetAvatarUrl(targetUser.getAvatarUrl());
                    dto.setIsOnline(targetUser.getIsOnline());

                    dto.setFriendshipStatus(friendship.getStatus().name());
                    dto.setFriendshipSenderId(friendship.getSender().getId());

                    if (friendship.getSender().getId().equals(userId)) {
                        dto.setLastMessage("Đang chờ chấp nhận");
                        dto.setLastSenderId(userId);
                        dto.setUnreadCount(0);
                    } else {
                        dto.setLastMessage("Lời mời kết bạn");
                        dto.setLastSenderId(friendship.getSender().getId());
                        dto.setUnreadCount(1); // Nổi bật thông báo lời mời mới
                    }

                    dto.setLastMessageTime(friendship.getUpdatedAt());
                    dto.setIsLastMessageSeen(false);

                    return dto;
                })
                .collect(Collectors.toList());

        // Gộp chung hai danh sách lại để đẩy lên giao diện
        activeRooms.addAll(friendshipDtos);
        return activeRooms;
    }

    @Transactional
    public ChatRoom createGroupRoom(Long creatorId, CreateGroupRequest request) {
        if (request.getRoomName() == null || request.getRoomName().isBlank()) {
            throw new RuntimeException("Tên nhóm không được để trống");
        }
        if (request.getMemberIds() == null || request.getMemberIds().isEmpty()) {
            throw new RuntimeException("Cần ít nhất " + GroupConstants.MIN_GROUP_SIZE + " thành viên");
        }
        // Deduplicate + loại bỏ creatorId nếu có trong list
        Set<Long> memberSet = new LinkedHashSet<>(request.getMemberIds());
        memberSet.remove(creatorId);
        if (1 + memberSet.size() < GroupConstants.MIN_GROUP_SIZE) {
            throw new RuntimeException("Nhóm cần ít nhất " + GroupConstants.MIN_GROUP_SIZE + " thành viên");
        }

        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new RuntimeException("Người tạo không tồn tại"));

        ChatRoom room = new ChatRoom();
        room.setIsGroup(true);
        room.setRoomName(request.getRoomName().trim());
        room.setAvatarUrl(request.getAvatarUrl());
        ChatRoom savedRoom = chatRoomRepository.save(room);

        // Creator -> ADMIN
        RoomMember creatorMember = new RoomMember();
        creatorMember.setRoom(savedRoom);
        creatorMember.setUser(creator);
        creatorMember.setRole(MemberRole.ADMIN);
        roomMemberRepository.save(creatorMember);

        // Members -> MEMBER
        for (Long memberId : memberSet) {
            User member = userRepository.findById(memberId)
                    .orElseThrow(() -> new RuntimeException("User " + memberId + " không tồn tại"));
            RoomMember rm = new RoomMember();
            rm.setRoom(savedRoom);
            rm.setUser(member);
            rm.setRole(MemberRole.MEMBER);
            roomMemberRepository.save(rm);
        }
        
        // Lưu tin nhắn hệ thống khởi tạo nhóm
        messageService.saveSystemMessage(savedRoom.getId(), creator.getUserName() + " đã tạo nhóm \"" + savedRoom.getRoomName() + "\"");
        
        return savedRoom;
    }

    @Transactional
    public ChatRoom updateGroupName(Long roomId, Long requesterId, String newName) {
        if (newName == null || newName.isBlank()) {
            throw new RuntimeException("Tên nhóm không được để trống");
        }
        assertIsMember(roomId, requesterId);
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Phòng không tồn tại"));
        if (!Boolean.TRUE.equals(room.getIsGroup())) {
            throw new RuntimeException("Không phải phòng nhóm");
        }
        room.setRoomName(newName.trim());
        return chatRoomRepository.save(room);
    }

    @Transactional
    public ChatRoom updateGroupAvatar(Long roomId, Long requesterId, String avatarUrl) {
        assertIsMember(roomId, requesterId);
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Phòng không tồn tại"));
        room.setAvatarUrl(avatarUrl);
        return chatRoomRepository.save(room);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));
    }

    public List<RoomMember> getRoomMembersByRoomId(Long roomId) {
        return roomMemberRepository.findByRoomId(roomId);
    }

    private void assertIsMember(Long roomId, Long userId) {
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)) {
            throw new RuntimeException("Bạn không thuộc phòng này");
        }
    }

    private void assertIsAdminOfRoom(Long roomId, Long userId) {
        if (!roomMemberRepository.isAdminOfRoom(roomId, userId)) {
            throw new RuntimeException("Bạn không có quyền thực hiện thao tác này");
        }
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

        if (Boolean.TRUE.equals(room.getIsGroup())) {
            // Group room: set member count + current user role
            dto.setMemberCount(roomMemberRepository.countByRoomId(room.getId()));
            roomMemberRepository.findByRoomIdAndUserId(room.getId(), currentUserId)
                    .ifPresent(rm -> dto.setCurrentUserRole(rm.getRole()));
        } else {
            // Private room: set target user info
            final Long[] targetIdArr = new Long[1];
            roomMemberRepository.findFirstByRoomIdAndUserIdNot(room.getId(), currentUserId)
                    .map(RoomMember::getUser)
                    .ifPresent(targetUser -> {
                        targetIdArr[0] = targetUser.getId();
                        dto.setTargetUserId(targetUser.getId());
                        dto.setTargetUserName(targetUser.getUserName());
                        dto.setTargetAvatarUrl(targetUser.getAvatarUrl());

                        RBucket<String> statusBucket = redissonClient.getBucket(
                                "user:status:" + targetUser.getEmail().toLowerCase());
                        dto.setIsOnline("online".equals(statusBucket.get()));
                        dto.setLastActiveAt(targetUser.getLastActiveAt());

                        friendshipRepository.findRelation(currentUserId, targetUser.getId())
                                .ifPresentOrElse(f -> {
                                    dto.setFriendshipStatus(f.getStatus().name());
                                    dto.setFriendshipSenderId(f.getSender().getId());
                                }, () -> {
                                    dto.setFriendshipStatus("NONE");
                                    dto.setFriendshipSenderId(null);
                                });
                    });

            if (dto.getLastSenderId() != null && dto.getLastSenderId().equals(currentUserId) && targetIdArr[0] != null) {
                int opponentUnread = chatRedisService.getUnreadCount(targetIdArr[0], room.getId());
                dto.setIsLastMessageSeen(opponentUnread == 0);
            } else {
                dto.setIsLastMessageSeen(false);
            }
        }

        // Last message (chung cho cả group và private)
        List<com.hola.HoLa.model.Message> latestMessages = messageRepository.findTop10ByRoomIdOrderByIdDesc(room.getId());
        if (!latestMessages.isEmpty()) {
            com.hola.HoLa.model.Message lastMsg = null;
            String cleanContent = null;
            
            for (com.hola.HoLa.model.Message msg : latestMessages) {
                if (msg.getMessageType() == com.hola.HoLa.model.MessageType.SYSTEM && msg.getContent() != null && msg.getContent().startsWith("[REACT_FOR:")) {
                    String content = msg.getContent();
                    int endIndex = content.indexOf("]");
                    if (endIndex != -1) {
                        try {
                            Long receiverId = Long.parseLong(content.substring(11, endIndex));
                            if (!receiverId.equals(currentUserId)) {
                                // Tin nhắn thả cảm xúc này không dành cho user hiện tại -> bỏ qua
                                continue;
                            }
                            // Dành cho user hiện tại -> giữ lại và làm sạch prefix
                            lastMsg = msg;
                            cleanContent = content.substring(endIndex + 1);
                            break;
                        } catch (Exception e) {
                            // Bỏ qua lỗi parse
                        }
                    }
                } else {
                    // Check if message is deleted for current user
                    if (deletedMessageRepository.existsByUserIdAndMessageId(currentUserId, msg.getId())) {
                        continue;
                    }

                    // Tin nhắn bình thường hoặc hệ thống không phải thả cảm xúc -> chọn luôn
                    lastMsg = msg;
                    cleanContent = msg.getContent();
                    break;
                }
            }
            
            if (lastMsg != null) {
                dto.setLastMessage(cleanContent);
                dto.setLastMessageTime(lastMsg.getCreatedAt());
                if (lastMsg.getSender() != null) {
                    dto.setLastSenderId(lastMsg.getSender().getId());
                    dto.setLastSenderName(lastMsg.getSender().getUserName());
                }
                dto.setLastMessageType(lastMsg.getMessageType() != null ? lastMsg.getMessageType().name() : null);
            }
        }

        dto.setUnreadCount(chatRedisService.getUnreadCount(currentUserId, room.getId()));

        return dto;
    }

    @Transactional(readOnly = true)
    public String getInviteLink(Long roomId, Long requesterId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Phòng chat không tồn tại"));
        
        if (!Boolean.TRUE.equals(room.getIsGroup())) {
            throw new RuntimeException("Chỉ nhóm chat mới có link mời");
        }
        
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, requesterId)) {
            throw new RuntimeException("Bạn không thuộc nhóm này để lấy link mời");
        }
        
        String encodedRoomId = java.util.Base64.getUrlEncoder().withoutPadding()
                .encodeToString(String.valueOf(roomId).getBytes(java.nio.charset.StandardCharsets.UTF_8));
                
        return frontendUrl + "/join/" + encodedRoomId;
    }

    @Transactional(readOnly = true)
    public ChatRoomDTO getJoinInfo(String encodedRoomId, Long currentUserId) {
        try {
            byte[] decodedBytes = java.util.Base64.getUrlDecoder().decode(encodedRoomId);
            Long roomId = Long.parseLong(new String(decodedBytes, java.nio.charset.StandardCharsets.UTF_8));
            
            ChatRoom room = chatRoomRepository.findById(roomId)
                    .orElseThrow(() -> new RuntimeException("Phòng chat không tồn tại hoặc link mời không hợp lệ"));
            
            if (!Boolean.TRUE.equals(room.getIsGroup())) {
                throw new RuntimeException("Link mời này không hợp lệ");
            }
            
            return toDto(room, currentUserId);
        } catch (Exception e) {
            throw new RuntimeException("Link mời không hợp lệ hoặc đã hết hạn");
        }
    }

    @Transactional
    public ChatRoom joinGroupRoom(Long userId, Long roomId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Nhóm chat không tồn tại"));
                
        if (!Boolean.TRUE.equals(room.getIsGroup())) {
            throw new RuntimeException("Không thể tham gia cuộc trò chuyện riêng tư bằng link");
        }
        
        if (roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)) {
            throw new RuntimeException("Bạn đã là thành viên của nhóm này rồi");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));
                
        RoomMember rm = new RoomMember();
        rm.setRoom(room);
        rm.setUser(user);
        rm.setRole(MemberRole.MEMBER);
        roomMemberRepository.save(rm);
        
        messageService.saveSystemMessage(roomId, user.getUserName() + " đã tham gia nhóm bằng link mời");
        
        return room;
    }
}
