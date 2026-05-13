package com.hola.HoLa.Controller;

import com.hola.HoLa.dto.MessageDTO;
import com.hola.HoLa.dto.PrivateMessageRequest;
import com.hola.HoLa.dto.ChatRoomDTO;
import com.hola.HoLa.dto.RoomActionRequest;
import com.hola.HoLa.service.MessageService;
import com.hola.HoLa.service.ChatRoomService;
import com.hola.HoLa.service.ChatRedisService;
import com.hola.HoLa.repository.RoomMemberRepository;
import com.hola.HoLa.model.RoomMember;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

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

    @MessageMapping("/chat")
    @SendToUser(value = "/queue/chat", broadcast = false)
    @Transactional
    public MessageDTO sendMessage(PrivateMessageRequest request) {
        boolean isFirstMessage = request.getRoomId() == null;
        MessageDTO saved = messageService.savePrivateMessage(request);

        // Broadcast the message to the room topic
        messagingTemplate.convertAndSend("/topic/room/" + saved.getRoomId(), saved);

        // First pass: increment unread counts for all members who are not actively in the room
        List<RoomMember> members = roomMemberRepository.findByRoomId(saved.getRoomId());
        for (RoomMember member : members) {
            Long memberId = member.getUser().getId();
            if (!memberId.equals(request.getSenderId())) {
                Long activeRoomId = chatRedisService.getActiveRoom(memberId);
                if (!saved.getRoomId().equals(activeRoomId)) {
                    chatRedisService.incrementUnread(memberId, saved.getRoomId());
                } else {
                    // Member is active in the room, instantly mark as seen
                    RoomActionRequest seenReq = new RoomActionRequest();
                    seenReq.setRoomId(saved.getRoomId());
                    seenReq.setUserId(memberId);
                    messagingTemplate.convertAndSend("/topic/room/" + saved.getRoomId() + "/seen", seenReq);
                }
            }
        }

        // Second pass: broadcast updated room info to each member's personal topic
        for (RoomMember member : members) {
            Long memberId = member.getUser().getId();
            ChatRoomDTO roomUpdate = chatRoomService.toDto(member.getRoom(), memberId);
            messagingTemplate.convertAndSend("/topic/user/" + memberId + "/rooms", roomUpdate);
        }

        return isFirstMessage ? saved : null;
    }

    @MessageMapping("/room/enter")
    public void enterRoom(RoomActionRequest request) {
        if (request.getUserId() != null && request.getRoomId() != null) {
            chatRedisService.setActiveRoom(request.getUserId(), request.getRoomId());
            chatRedisService.resetUnread(request.getUserId(), request.getRoomId());
            messagingTemplate.convertAndSend("/topic/room/" + request.getRoomId() + "/seen", request);
        }
    }

    @MessageMapping("/room/leave")
    public void leaveRoom(RoomActionRequest request) {
        if (request.getUserId() != null) {
            chatRedisService.removeActiveRoom(request.getUserId());
        }
    }
}
