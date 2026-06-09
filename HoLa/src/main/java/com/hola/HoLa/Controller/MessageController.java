package com.hola.HoLa.Controller;

import com.hola.HoLa.dto.MessageDTO;
import com.hola.HoLa.dto.PrivateMessageRequest;
import com.hola.HoLa.dto.ChatRoomDTO;
import com.hola.HoLa.dto.RoomActionRequest;
import com.hola.HoLa.dto.TypingRequest;
import com.hola.HoLa.dto.SeenUserDTO;
import com.hola.HoLa.service.ChatRoomService;
import com.hola.HoLa.service.MessageService;
import com.hola.HoLa.service.ChatRedisService;
import com.hola.HoLa.repository.RoomMemberRepository;
import com.hola.HoLa.repository.UserRepository;
import com.hola.HoLa.model.RoomMember;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import com.hola.HoLa.dto.RecallMessageRequest;

@Controller
public class MessageController {
    @Autowired
    private MessageService messageService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatRoomService chatRoomService;

    @Autowired
    private ChatRedisService chatRedisService;

    @Autowired
    private RoomMemberRepository roomMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.hola.HoLa.repository.ChatRoomRepository chatRoomRepository;

    @Autowired
    private com.hola.HoLa.service.PushNotificationService pushNotificationService;

    @MessageMapping("/chat")
    @SendToUser(value = "/queue/chat", broadcast = false)
    @Transactional
    public MessageDTO sendMessage(PrivateMessageRequest request) {
        boolean isFirstMessage = request.getRoomId() == null;
        MessageDTO saved = messageService.savePrivateMessage(request);

        // Broadcast tin nhắn tới topic phòng
        messagingTemplate.convertAndSend("/topic/room/" + saved.getRoomId(), saved);

        // Tin nhắn mới → reset seenBy (chỉ xét các thành viên đang active trong phòng)
        chatRedisService.clearSeenBy(saved.getRoomId());

        List<RoomMember> members = roomMemberRepository.findByRoomId(saved.getRoomId());
        boolean anyoneSeenImmediately = false;

        com.hola.HoLa.model.User sender = userRepository.findById(request.getSenderId()).orElse(null);
        String senderName = (sender != null) ? sender.getUserName() : "Ai đó";
        
        com.hola.HoLa.model.ChatRoom room = chatRoomRepository.findById(saved.getRoomId()).orElse(null);

        for (RoomMember member : members) {
            Long memberId = member.getUser().getId();
            if (!memberId.equals(request.getSenderId())) {
                Long activeRoomId = chatRedisService.getActiveRoom(memberId);
                if (!saved.getRoomId().equals(activeRoomId)) {
                    chatRedisService.incrementUnread(memberId, saved.getRoomId());
                    
                    // Determine message content description
                    String messageContent = saved.getContent();
                    if ("IMAGE".equals(saved.getMessageType())) {
                        messageContent = "[Hình ảnh]";
                    } else if ("VIDEO".equals(saved.getMessageType())) {
                        messageContent = "[Video]";
                    } else if ("FILE".equals(saved.getMessageType())) {
                        messageContent = "[Tập tin]";
                    } else if (messageContent == null || messageContent.isEmpty()) {
                        messageContent = "đã gửi một tin nhắn";
                    }

                    // Push notification to user who is not active in the room
                    String title = senderName;
                    String body = messageContent;
                    
                    if (room != null && Boolean.TRUE.equals(room.getIsGroup())) {
                        title = room.getRoomName() != null ? room.getRoomName() : "Nhóm chat";
                        body = senderName + ": " + messageContent;
                    }
                    
                    pushNotificationService.sendNotificationToUser(memberId, title, body);
                    
                } else {
                    // Member đang active trong phòng → tự động seen ngay
                    chatRedisService.addSeenBy(saved.getRoomId(), memberId);
                    anyoneSeenImmediately = true;
                }
            }
        }

        // Nếu có ai đó seen ngay → broadcast seenBy list
        if (anyoneSeenImmediately) {
            broadcastSeenBy(saved.getRoomId());
        }

        // Broadcast cập nhật room info tới từng member
        for (RoomMember member : members) {
            Long memberId = member.getUser().getId();
            ChatRoomDTO roomUpdate = chatRoomService.toDto(member.getRoom(), memberId);
            messagingTemplate.convertAndSend("/topic/user/" + memberId + "/rooms", roomUpdate);
        }

        return isFirstMessage ? saved : null;
    }

    @MessageMapping("/room/enter")
    public void enterRoom(RoomActionRequest request) {
        if (request.getUserId() == null || request.getRoomId() == null) return;

        chatRedisService.setActiveRoom(request.getUserId(), request.getRoomId());
        chatRedisService.resetUnread(request.getUserId(), request.getRoomId());
        chatRedisService.addSeenBy(request.getRoomId(), request.getUserId());

        broadcastSeenBy(request.getRoomId());
    }

    @MessageMapping("/room/leave")
    public void leaveRoom(RoomActionRequest request) {
        if (request.getUserId() != null) {
            chatRedisService.removeActiveRoom(request.getUserId());
        }
    }

    @MessageMapping("/typing")
    public void typing(TypingRequest request) {
        if (request.getRoomId() == null || request.getUserId() == null) return;

        messagingTemplate.convertAndSend(
                "/topic/room/" + request.getRoomId() + "/typing",
                request
        );
    }

    @MessageMapping("/message/recall")
    @Transactional
    public void recallMessage(RecallMessageRequest request) {
        if (request.getMessageId() == null || request.getUserId() == null) return;

        try {
            MessageDTO recalled = messageService.recallMessage(request.getMessageId(), request.getUserId());

            // Broadcast event thu hồi tới tất cả thành viên trong phòng
            messagingTemplate.convertAndSend(
                "/topic/room/" + recalled.getRoomId() + "/recall",
                recalled
            );

            // Broadcast cập nhật room info (kèm lastMessage mới) tới từng member
            List<RoomMember> members = roomMemberRepository.findByRoomId(recalled.getRoomId());
            for (RoomMember member : members) {
                Long memberId = member.getUser().getId();
                ChatRoomDTO roomUpdate = chatRoomService.toDto(member.getRoom(), memberId);
                messagingTemplate.convertAndSend("/topic/user/" + memberId + "/rooms", roomUpdate);
            }
        } catch (RuntimeException e) {
            System.err.println("Recall failed: " + e.getMessage());
        }
    }

    /**
     * Lấy danh sách seenBy từ Redis, tra cứu user info, broadcast lên WebSocket topic
     */
    private void broadcastSeenBy(Long roomId) {
        Set<Long> seenUserIds = chatRedisService.getSeenBy(roomId);

        List<SeenUserDTO> seenByUsers = seenUserIds.stream()
                .map(uid -> userRepository.findById(uid).orElse(null))
                .filter(u -> u != null)
                .map(u -> new SeenUserDTO(u.getId(), u.getUserName(), u.getAvatarUrl()))
                .collect(Collectors.toList());

        RoomActionRequest broadcast = new RoomActionRequest();
        broadcast.setRoomId(roomId);
        broadcast.setSeenByUsers(seenByUsers);

        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/seen", broadcast);
    }
}
