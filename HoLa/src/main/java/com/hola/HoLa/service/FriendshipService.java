package com.hola.HoLa.service;

import com.hola.HoLa.dto.ChatRoomDTO;
import com.hola.HoLa.dto.UserDTO;
import com.hola.HoLa.model.*;
import com.hola.HoLa.repository.FriendshipRepository;
import com.hola.HoLa.repository.RoomMemberRepository;
import com.hola.HoLa.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class FriendshipService {
    @Autowired
    private FriendshipRepository friendshipRepository;

    @Autowired
    private RoomMemberRepository roomMemberRepository;
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChatRoomService chatRoomService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ChatRoomDTO sendFriendRequest(Long senderId, Long receiverId) {
        if (senderId.equals(receiverId)) {
            throw new RuntimeException("Không thể tự kết bạn với chính mình!");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Người gửi không tồn tại!"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Người nhận không tồn tại!"));

        Optional<Friendship> existing = friendshipRepository.findRelation(senderId, receiverId);
        if (existing.isPresent()) {
            Friendship f = existing.get();
            if (f.getStatus() == FriendshipStatus.ACCEPTED) {
                throw new RuntimeException("Hai bạn đã là bạn bè rồi!");
            } else if (f.getStatus() == FriendshipStatus.PENDING) {
                throw new RuntimeException("Yêu cầu kết bạn đang chờ xử lý!");
            } else {
                // Từng bị từ chối, nay kích hoạt lại yêu cầu mới
                f.setSender(sender);
                f.setReceiver(receiver);
                f.setStatus(FriendshipStatus.PENDING);
                Friendship saved = friendshipRepository.save(f);
                notifyFriendshipUpdate(saved);
                return friendshipToChatRoomDto(saved, senderId);
            }
        }

        Friendship friendship = new Friendship();
        friendship.setSender(sender);
        friendship.setReceiver(receiver);
        friendship.setStatus(FriendshipStatus.PENDING);
        Friendship saved = friendshipRepository.save(friendship);

        // Gửi WebSocket thông báo ngay tức thì cho cả 2 người
        notifyFriendshipUpdate(saved);
        return friendshipToChatRoomDto(saved, senderId);
    }

    @Transactional
    public void acceptFriendRequest(Long receiverId, Long senderId) {
        Friendship friendship = friendshipRepository.findBySenderIdAndReceiverId(senderId, receiverId)
                .orElseThrow(() -> new RuntimeException("Lời mời kết bạn không tồn tại!"));

        if (friendship.getStatus() != FriendshipStatus.PENDING) {
            throw new RuntimeException("Lời mời không hợp lệ!");
        }

        friendship.setStatus(FriendshipStatus.ACCEPTED);
        friendshipRepository.save(friendship);

        // 1. Khởi tạo/Lấy phòng chat riêng tư thật sự
        ChatRoom chatRoom = chatRoomService.getOrCreatePrivateRoom(senderId, receiverId);

        // 2. Phát lệnh xóa item lời mời kết bạn (ID âm) trên giao diện qua WebSocket
        ChatRoomDTO deleteItem = new ChatRoomDTO();
        deleteItem.setId(-friendship.getId());
        deleteItem.setFriendshipStatus("DELETED");
        messagingTemplate.convertAndSend("/topic/user/" + senderId + "/rooms", deleteItem);
        messagingTemplate.convertAndSend("/topic/user/" + receiverId + "/rooms", deleteItem);

        // 3. Đẩy phòng chat thật mới (ID dương) cho cả hai người
        ChatRoomDTO senderRoomDto = chatRoomService.toDto(chatRoom, senderId);
        ChatRoomDTO receiverRoomDto = chatRoomService.toDto(chatRoom, receiverId);
        
        messagingTemplate.convertAndSend("/topic/user/" + senderId + "/rooms", senderRoomDto);
        messagingTemplate.convertAndSend("/topic/user/" + receiverId + "/rooms", receiverRoomDto);
    }

    @Transactional
    public void declineFriendRequest(Long receiverId, Long senderId) {
        Friendship friendship = friendshipRepository.findBySenderIdAndReceiverId(senderId, receiverId)
                .orElseThrow(() -> new RuntimeException("Lời mời không tồn tại!"));

        if (friendship.getStatus() != FriendshipStatus.PENDING) {
            throw new RuntimeException("Lời mời không ở trạng thái chờ!");
        }

        // Xóa mối quan hệ PENDING trong cơ sở dữ liệu
        friendshipRepository.delete(friendship);

        // 1. Phát lệnh xóa item lời mời kết bạn (ID âm) ra khỏi tab "Lời mời" của UI
        ChatRoomDTO deleteItem = new ChatRoomDTO();
        deleteItem.setId(-friendship.getId());
        deleteItem.setFriendshipStatus("DELETED");
        messagingTemplate.convertAndSend("/topic/user/" + senderId + "/rooms", deleteItem);
        messagingTemplate.convertAndSend("/topic/user/" + receiverId + "/rooms", deleteItem);

        // 2. Nếu trước đó 2 người đã có phòng chat riêng tư thật (ID dương)
        // thì không được xóa phòng chat đó, mà chỉ cập nhật trạng thái kết bạn thành NONE
        roomMemberRepository.findPrivateRoom(senderId, receiverId).ifPresent(chatRoom -> {
            ChatRoomDTO forSender = chatRoomService.toDto(chatRoom, senderId);
            forSender.setFriendshipStatus("NONE");
            forSender.setFriendshipSenderId(null);

            ChatRoomDTO forReceiver = chatRoomService.toDto(chatRoom, receiverId);
            forReceiver.setFriendshipStatus("NONE");
            forReceiver.setFriendshipSenderId(null);

            messagingTemplate.convertAndSend("/topic/user/" + senderId + "/rooms", forSender);
            messagingTemplate.convertAndSend("/topic/user/" + receiverId + "/rooms", forReceiver);
        });
    }

    public List<UserDTO> getFriends(Long userId) {
       List<Friendship> list = friendshipRepository.findBySenderIdAndStatusOrReceiverIdAndStatus(
                userId, FriendshipStatus.ACCEPTED, 
                userId, FriendshipStatus.ACCEPTED
        );
        return list.stream().map(f -> {
            User target = f.getSender().getId().equals(userId) ? f.getReceiver() : f.getSender();
            UserDTO dto = new UserDTO();
            dto.setId(target.getId());
            dto.setUserName(target.getUserName());
            dto.setEmail(target.getEmail());
            dto.setAvatarUrl(target.getAvatarUrl());
            dto.setCoverUrl(target.getCoverUrl());
            dto.setGender(target.getGender());
            dto.setBirthday(target.getBirthday());
            dto.setIsOnline(target.getIsOnline());
            dto.setIsVerified(target.getIsVerified());
            return dto;
        }).collect(Collectors.toList());
    }

    public String getFriendshipStatus(Long u1, Long u2) {
        Optional<Friendship> relation = friendshipRepository.findRelation(u1, u2);
        if (relation.isEmpty()) return "NONE";
        Friendship f = relation.get();
        if (f.getStatus() == FriendshipStatus.ACCEPTED) return "ACCEPTED";
        if (f.getStatus() == FriendshipStatus.PENDING) {
            return f.getSender().getId().equals(u1) ? "SENT_PENDING" : "RECEIVED_PENDING";
        }
        return "NONE";
    }

    public void notifyFriendshipUpdate(Friendship friendship) {
        Long senderId = friendship.getSender().getId();
        Long receiverId = friendship.getReceiver().getId();

        ChatRoomDTO forSender = friendshipToChatRoomDto(friendship, senderId);
        ChatRoomDTO forReceiver = friendshipToChatRoomDto(friendship, receiverId);

        // 1. Đẩy thông tin lời mời (ID âm) thời gian thực lên top tab "Lời mời" của cả người gửi và nhận
        messagingTemplate.convertAndSend("/topic/user/" + senderId + "/rooms", forSender);
        messagingTemplate.convertAndSend("/topic/user/" + receiverId + "/rooms", forReceiver);

        // 2. LOGIC CỐT LÕI: Nếu trước đó 2 người đã có phòng chat riêng tư thật (ID dương)
        // ta phát thêm WebSocket để cập nhật trạng thái kết bạn PENDING cho phòng chat thật đó của cả 2 người!
        roomMemberRepository.findPrivateRoom(senderId, receiverId).ifPresent(chatRoom -> {
            ChatRoomDTO roomForSender = chatRoomService.toDto(chatRoom, senderId);
            roomForSender.setFriendshipStatus(friendship.getStatus().name());
            roomForSender.setFriendshipSenderId(friendship.getSender().getId());

            ChatRoomDTO roomForReceiver = chatRoomService.toDto(chatRoom, receiverId);
            roomForReceiver.setFriendshipStatus(friendship.getStatus().name());
            roomForReceiver.setFriendshipSenderId(friendship.getSender().getId());

            messagingTemplate.convertAndSend("/topic/user/" + senderId + "/rooms", roomForSender);
            messagingTemplate.convertAndSend("/topic/user/" + receiverId + "/rooms", roomForReceiver);
        });
    }

    public ChatRoomDTO friendshipToChatRoomDto(Friendship friendship, Long currentUserId) {
        ChatRoomDTO dto = new ChatRoomDTO();
        dto.setId(-friendship.getId()); // Đặt ID âm để phân biệt với chat room thường
        
        User targetUser = friendship.getSender().getId().equals(currentUserId) 
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
        
        if (friendship.getSender().getId().equals(currentUserId)) {
            dto.setLastMessage("Đang chờ chấp nhận");
            dto.setLastSenderId(currentUserId);
            dto.setUnreadCount(0);
        } else {
            dto.setLastMessage("Lời mời kết bạn");
            dto.setLastSenderId(friendship.getSender().getId());
            dto.setUnreadCount(1); // Nổi bật badge đỏ cho người nhận
        }
        
        dto.setLastMessageTime(friendship.getUpdatedAt());
        dto.setIsLastMessageSeen(false);
        
        return dto;
    }

    @Transactional
    public void cancelFriendRequest(Long senderId, Long receiverId) {
        Friendship friendship = friendshipRepository.findBySenderIdAndReceiverId(senderId, receiverId)
                .orElseThrow(() -> new RuntimeException("Lời mời kết bạn không tồn tại!"));

        if (friendship.getStatus() != FriendshipStatus.PENDING) {
            throw new RuntimeException("Lời mời không ở trạng thái chờ!");
        }

        // Xóa mối quan hệ PENDING
        friendshipRepository.delete(friendship);

        // Phát WebSocket lệnh xóa item lời mời (ID âm)
        ChatRoomDTO deleteItem = new ChatRoomDTO();
        deleteItem.setId(-friendship.getId());
        deleteItem.setFriendshipStatus("DELETED");
        messagingTemplate.convertAndSend("/topic/user/" + senderId + "/rooms", deleteItem);
        messagingTemplate.convertAndSend("/topic/user/" + receiverId + "/rooms", deleteItem);

        // Nếu đã có phòng chat thật, cập nhật trạng thái kết bạn thành NONE
        roomMemberRepository.findPrivateRoom(senderId, receiverId).ifPresent(chatRoom -> {
            ChatRoomDTO forSender = chatRoomService.toDto(chatRoom, senderId);
            forSender.setFriendshipStatus("NONE");
            forSender.setFriendshipSenderId(null);

            ChatRoomDTO forReceiver = chatRoomService.toDto(chatRoom, receiverId);
            forReceiver.setFriendshipStatus("NONE");
            forReceiver.setFriendshipSenderId(null);

            messagingTemplate.convertAndSend("/topic/user/" + senderId + "/rooms", forSender);
            messagingTemplate.convertAndSend("/topic/user/" + receiverId + "/rooms", forReceiver);
        });
    }

    @Transactional
    public void unfriend(Long userId, Long friendId) {
        Friendship friendship = friendshipRepository.findRelation(userId, friendId)
                .orElseThrow(() -> new RuntimeException("Mối quan hệ bạn bè không tồn tại!"));

        if (friendship.getStatus() != FriendshipStatus.ACCEPTED) {
            throw new RuntimeException("Hai người hiện không phải là bạn bè!");
        }

        // Xóa mối quan hệ bạn bè trong DB
        friendshipRepository.delete(friendship);

        // Chỉ gửi WebSocket nếu 2 người đã có phòng chat riêng thật sự (không tạo mới!)
        roomMemberRepository.findPrivateRoom(userId, friendId).ifPresent(chatRoom -> {
            ChatRoomDTO forUser1 = chatRoomService.toDto(chatRoom, userId);
            forUser1.setFriendshipStatus("NONE");
            forUser1.setFriendshipSenderId(null);

            ChatRoomDTO forUser2 = chatRoomService.toDto(chatRoom, friendId);
            forUser2.setFriendshipStatus("NONE");
            forUser2.setFriendshipSenderId(null);

            messagingTemplate.convertAndSend("/topic/user/" + userId + "/rooms", forUser1);
            messagingTemplate.convertAndSend("/topic/user/" + friendId + "/rooms", forUser2);
        });
    }
}