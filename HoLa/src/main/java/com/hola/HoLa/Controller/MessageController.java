package com.hola.HoLa.Controller;

import com.hola.HoLa.dto.MessageDTO;
import com.hola.HoLa.dto.PrivateMessageRequest;
import com.hola.HoLa.dto.ChatRoomDTO;
import com.hola.HoLa.dto.RoomActionRequest;
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

        for (RoomMember member : members) {
            Long memberId = member.getUser().getId();
            if (!memberId.equals(request.getSenderId())) {
                Long activeRoomId = chatRedisService.getActiveRoom(memberId);
                if (!saved.getRoomId().equals(activeRoomId)) {
                    chatRedisService.incrementUnread(memberId, saved.getRoomId());
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
