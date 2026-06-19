package com.hola.HoLa.service;

import com.hola.HoLa.constant.GroupConstants;
import com.hola.HoLa.dto.GroupEvent;
import com.hola.HoLa.dto.RoomMemberDTO;
import com.hola.HoLa.model.ChatRoom;
import com.hola.HoLa.model.MemberRole;
import com.hola.HoLa.model.RoomMember;
import com.hola.HoLa.model.User;
import com.hola.HoLa.repository.ChatRoomRepository;
import com.hola.HoLa.repository.MessageRepository;
import com.hola.HoLa.repository.RoomMemberRepository;
import com.hola.HoLa.repository.UserRepository;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.redisson.client.codec.StringCodec;
import org.redisson.codec.JsonJacksonCodec;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
/**
 * Lớp Service chứa logic nghiệp vụ cho RoomMemberService.
 */
public class RoomMemberService {

    @Autowired
    private RoomMemberRepository roomMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChatRoomRepository chatRoomRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private RedissonClient redissonClient;

    @Autowired
    @Lazy
    private ChatRoomService chatRoomService;

    @Autowired
    @Lazy
    private MessageService messageService;

    private static final JsonJacksonCodec CODEC = new JsonJacksonCodec();

    // ===== PUBLIC API =====

    @Transactional(readOnly = true)
    public List<RoomMemberDTO> getMembers(Long roomId) {
        Long currentUserId = getCurrentUserId();
        assertIsMember(roomId, currentUserId);
        return roomMemberRepository.findByRoomIdOrderByJoinedAtAsc(roomId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public List<RoomMemberDTO> addMembers(Long roomId, List<Long> memberIds) {
        Long currentUserId = getCurrentUserId();
        assertIsAdmin(roomId, currentUserId);

        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Phòng không tồn tại"));

        if (!Boolean.TRUE.equals(room.getIsGroup())) {
            throw new RuntimeException("Không thể thêm thành viên vào chat riêng tư");
        }

        int currentCount = roomMemberRepository.countByRoomId(roomId);
        if (currentCount >= GroupConstants.MAX_GROUP_MEMBERS) {
            throw new RuntimeException("Phòng đã đạt giới hạn " + GroupConstants.MAX_GROUP_MEMBERS + " thành viên");
        }

        // Deduplicate và loại bỏ đã tồn tại
        Set<Long> uniqueIds = new LinkedHashSet<>(memberIds);
        uniqueIds.remove(currentUserId);
        Set<Long> existingIds = roomMemberRepository.findByRoomIdOrderByJoinedAtAsc(roomId)
                .stream().map(rm -> rm.getUser().getId()).collect(Collectors.toSet());
        uniqueIds.removeAll(existingIds);

        int canAdd = GroupConstants.MAX_GROUP_MEMBERS - currentCount;
        List<Long> toAddIds = uniqueIds.stream().limit(canAdd).collect(Collectors.toList());

        List<RoomMember> newMembers = new ArrayList<>();
        for (Long uid : toAddIds) {
            User user = userRepository.findById(uid)
                    .orElseThrow(() -> new RuntimeException("User " + uid + " không tồn tại"));
            RoomMember rm = new RoomMember();
            rm.setRoom(room);
            rm.setUser(user);
            rm.setRole(MemberRole.MEMBER);
            newMembers.add(roomMemberRepository.save(rm));

            // System message
            messageService.saveSystemMessage(roomId, user.getUserName() + " đã tham gia nhóm");

            // Broadcast: room mới xuất hiện trong sidebar của thành viên mới
            com.hola.HoLa.dto.ChatRoomDTO roomDto = chatRoomService.toDto(room, uid);
            roomDto.setCurrentUserRole(com.hola.HoLa.model.MemberRole.MEMBER);
            roomDto.setLastMessage(user.getUserName() + " đã tham gia nhóm");
            roomDto.setLastMessageType("SYSTEM");
            messagingTemplate.convertAndSend("/topic/user/" + uid + "/rooms", roomDto);
        }

        // Broadcast member list update cho tất cả thành viên trong phòng
        List<RoomMemberDTO> newDtos = newMembers.stream().map(this::toDto).collect(Collectors.toList());
        for (RoomMemberDTO dto : newDtos) {
            messagingTemplate.convertAndSend("/topic/room/" + roomId + "/members",
                    new GroupEvent("MEMBER_JOINED", dto));
        }
        return newDtos;
    }

    @Transactional
    public void removeMember(Long roomId, Long targetUserId) {
        Long currentUserId = getCurrentUserId();
        boolean isSelf = currentUserId.equals(targetUserId);

        if (!isSelf) {
            assertIsAdmin(roomId, currentUserId);
        }

        // Pessimistic lock để tránh race condition khi transfer ADMIN
        RoomMember target = roomMemberRepository.findByRoomIdAndUserIdForUpdate(roomId, targetUserId)
                .orElseThrow(() -> new RuntimeException("Thành viên không tồn tại trong phòng"));

        ChatRoom room = target.getRoom();
        String targetName = target.getUser().getUserName();
        boolean wasAdmin = MemberRole.ADMIN.equals(target.getRole());

        // Xử lý chuyển quyền nếu cần
        if (wasAdmin) {
            long adminCount = roomMemberRepository.findByRoomIdOrderByJoinedAtAsc(roomId)
                    .stream().filter(rm -> MemberRole.ADMIN.equals(rm.getRole())).count();
            if (adminCount <= 1) {
                // Chỉ còn 1 admin -> tìm member khác để chuyển quyền
                Optional<RoomMember> nextAdmin = roomMemberRepository.findByRoomIdOrderByJoinedAtAsc(roomId)
                        .stream()
                        .filter(rm -> !rm.getUser().getId().equals(targetUserId)
                                && MemberRole.MEMBER.equals(rm.getRole()))
                        .findFirst();

                if (nextAdmin.isPresent()) {
                    // Deterministic admin transfer: oldest member by joinedAt
                    nextAdmin.get().setRole(MemberRole.ADMIN);
                    roomMemberRepository.save(nextAdmin.get());
                    messageService.saveSystemMessage(roomId,
                            nextAdmin.get().getUser().getUserName() + " đã trở thành quản trị viên");
                    messagingTemplate.convertAndSend("/topic/room/" + roomId + "/members",
                            new GroupEvent("ROLE_CHANGED", toDto(nextAdmin.get())));
                } else {
                    // Không còn ai -> dissolve phòng
                    dissolveRoomInternal(roomId, room);
                    return;
                }
            }
        }

        roomMemberRepository.delete(target);

        // System message
        String systemMsg = isSelf
                ? targetName + " đã rời nhóm"
                : targetName + " đã bị xóa khỏi nhóm";
        messageService.saveSystemMessage(roomId, systemMsg);

        // Broadcast riêng cho thành viên bị xóa/rời nhóm
        messagingTemplate.convertAndSend("/topic/user/" + targetUserId + "/rooms",
                new GroupEvent("ROOM_KICKED", roomId));

        // Broadcast danh sách member update tới những người còn lại trong phòng
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/members",
                new GroupEvent("MEMBER_LEFT", targetUserId));
    }

    @Transactional
    public RoomMemberDTO updateRole(Long roomId, Long targetUserId, MemberRole newRole) {
        Long currentUserId = getCurrentUserId();
        assertIsAdmin(roomId, currentUserId);

        if (currentUserId.equals(targetUserId)) {
            throw new RuntimeException("Không thể tự thay đổi quyền của bản thân");
        }

        RoomMember target = roomMemberRepository.findByRoomIdAndUserId(roomId, targetUserId)
                .orElseThrow(() -> new RuntimeException("Thành viên không tồn tại trong phòng"));

        target.setRole(newRole);
        roomMemberRepository.save(target);

        String systemMsg = MemberRole.ADMIN.equals(newRole)
                ? target.getUser().getUserName() + " đã trở thành quản trị viên"
                : target.getUser().getUserName() + " không còn là quản trị viên";
        messageService.saveSystemMessage(roomId, systemMsg);

        RoomMemberDTO dto = toDto(target);
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/members",
                new GroupEvent("ROLE_CHANGED", dto));
        return dto;
    }

    @Transactional
    public void dissolveRoom(Long roomId) {
        Long currentUserId = getCurrentUserId();
        assertIsAdmin(roomId, currentUserId);
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Phòng không tồn tại"));
        dissolveRoomInternal(roomId, room);
    }

    // ===== INTERNAL =====

    private void dissolveRoomInternal(Long roomId, ChatRoom room) {
        List<RoomMember> members = roomMemberRepository.findByRoomIdOrderByJoinedAtAsc(roomId);
        // Gửi event TRƯỚC khi xóa DB
        for (RoomMember member : members) {
            messagingTemplate.convertAndSend("/topic/user/" + member.getUser().getId() + "/rooms",
                    new GroupEvent("ROOM_DISSOLVED", roomId));
        }
        // Xóa theo thứ tự FK: messages -> room_members -> chat_rooms
        messageRepository.deleteAllByRoomId(roomId);
        roomMemberRepository.deleteAllByRoomId(roomId);
        chatRoomRepository.delete(room);
    }

    private void assertIsAdmin(Long roomId, Long userId) {
        if (!roomMemberRepository.isAdminOfRoom(roomId, userId)) {
            throw new RuntimeException("Bạn không có quyền thực hiện thao tác này");
        }
    }

    private void assertIsMember(Long roomId, Long userId) {
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)) {
            throw new RuntimeException("Bạn không thuộc phòng này");
        }
    }

    private Long getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"))
                .getId();
    }

    public RoomMemberDTO toDto(RoomMember member) {
        RoomMemberDTO dto = new RoomMemberDTO();
        dto.setId(member.getId());
        dto.setRoomId(member.getRoom().getId());
        dto.setUserId(member.getUser().getId());
        dto.setRole(member.getRole());
        dto.setUserName(member.getUser().getUserName());
        dto.setAvatarUrl(member.getUser().getAvatarUrl());
        dto.setJoinedAt(member.getJoinedAt());

        // Online status từ Redis
        try {
            RBucket<String> statusBucket = redissonClient.getBucket(
                    "user:status:" + member.getUser().getEmail().toLowerCase());
            dto.setIsOnline("online".equals(statusBucket.get()));
        } catch (Exception e) {
            dto.setIsOnline(false);
        }
        dto.setLastActiveAt(member.getUser().getLastActiveAt());
        return dto;
    }
}
