package com.hola.HoLa.service;

import com.hola.HoLa.dto.ChatRoomDTO;
import com.hola.HoLa.dto.MessageDTO;
import com.hola.HoLa.model.ChatRoom;
import com.hola.HoLa.model.Message;
import com.hola.HoLa.model.MessageReaction;
import com.hola.HoLa.model.RoomMember;
import com.hola.HoLa.model.User;
import com.hola.HoLa.repository.MessageReactionRepository;
import com.hola.HoLa.repository.MessageRepository;
import com.hola.HoLa.repository.RoomMemberRepository;
import com.hola.HoLa.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
/**
 * Lớp Service chứa logic nghiệp vụ cho MessageReactionService.
 */
public class MessageReactionService {

    @Autowired
    private MessageReactionRepository messageReactionRepo;

    @Autowired
    private MessageRepository messageRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private RoomMemberRepository roomMemberRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private MessageService messageService;

    @Autowired
    private ChatRoomService chatRoomService;

    @Autowired
    private ChatRedisService chatRedisService;

    @Transactional
    public MessageDTO toggleReaction(Long messageId, Long userId, String emoji) {
        Message message = messageRepo.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Tin nhắn không tồn tại"));

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        Long roomId = message.getRoom().getId();

        // Kiểm tra quyền
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)) {
            throw new RuntimeException("Bạn không thuộc phòng chat này");
        }

        Optional<MessageReaction> existingOpt = messageReactionRepo.findByMessageIdAndUserId(messageId, userId);
        boolean isRemoving = (emoji == null || emoji.trim().isEmpty() || (existingOpt.isPresent() && existingOpt.get().getEmoji().equals(emoji)));

        if (isRemoving) {
            existingOpt.ifPresent(messageReactionRepo::delete);
        } else {
            if (existingOpt.isPresent()) {
                MessageReaction reaction = existingOpt.get();
                reaction.setEmoji(emoji);
                messageReactionRepo.save(reaction);
            } else {
                MessageReaction reaction = new MessageReaction();
                reaction.setMessage(message);
                reaction.setUser(user);
                reaction.setEmoji(emoji);
                messageReactionRepo.save(reaction);
            }
        }

        // Flush and refresh
        messageReactionRepo.flush();

        // Get updated MessageDTO
        MessageDTO updatedMessageDto = messageService.toDto(message);

        // Broadcast to the chat room
        // Ta có thể dùng DTO hoặc bọc trong 1 Event, ở đây ta dùng DTO
        // UI có thể listen topic này và kiểm tra properties để biết loại event (tin nhắn mới hay cập nhật)
        // Tuy nhiên do endpoint nhắn tin mới trả MessageDTO trực tiếp, ta sẽ gửi MessageDTO
        // Ở Frontend cần bắt Event cập nhật nếu message ID đã tồn tại
        java.util.Map<String, Object> event = new java.util.HashMap<>();
        event.put("type", "MESSAGE_REACTION_UPDATE");
        event.put("data", updatedMessageDto);
        messagingTemplate.convertAndSend("/topic/room/" + roomId, event);

        // Chỉ lưu tin nhắn hệ thống và thông báo khi thêm cảm xúc (không phải khi gỡ)
        // VÀ chỉ khi thả cảm xúc vào tin nhắn của NGƯỜI KHÁC (không tự thả cho chính mình)
        if (!isRemoving && message.getSender() != null && !message.getSender().getId().equals(userId)) {
            // Lấy danh sách thành viên trong phòng
            List<RoomMember> members = chatRoomService.getRoomMembersByRoomId(roomId);

            // Tạo và lưu tin nhắn hệ thống vào DB (sẽ tự động broadcast vào phòng chat)
            String senderName = message.getSender().getUserName();
            Long receiverId = message.getSender().getId();
            String notifText = "[REACT_FOR:" + receiverId + "]" + user.getUserName() + " đã bày tỏ cảm xúc " + emoji + " đối với tin nhắn của " + senderName;
            messageService.saveSystemMessageWithSender(roomId, notifText, user);

            // Xây dựng Notification Room update cho Sidebar cho tất cả thành viên
            ChatRoom room = message.getRoom();
            for (RoomMember m : members) {
                Long mid = m.getUser().getId();
                
                // Cập nhật unread count CHỈ cho người nhận thông báo (người được thả cảm xúc)
                if (mid.equals(receiverId)) {
                    Long activeRoomId = chatRedisService.getActiveRoom(mid);
                    if (activeRoomId == null || !activeRoomId.equals(roomId)) {
                        chatRedisService.incrementUnread(mid, roomId);
                    }
                }
                
                // Lấy DTO mới nhất (đã có tin nhắn hệ thống mới lưu) và gửi qua WebSocket
                ChatRoomDTO notificationDto = chatRoomService.toDto(room, mid);
                messagingTemplate.convertAndSend("/topic/user/" + mid + "/rooms", notificationDto);
            }
        }

        return updatedMessageDto;
    }
}
