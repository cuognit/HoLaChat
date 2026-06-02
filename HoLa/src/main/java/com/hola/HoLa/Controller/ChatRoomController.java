package com.hola.HoLa.Controller;

import com.hola.HoLa.dto.ChatRoomDTO;
import com.hola.HoLa.dto.CreateGroupRequest;
import com.hola.HoLa.dto.PrivateRoomRequest;
import com.hola.HoLa.dto.ResponseApi;
import com.hola.HoLa.model.ChatRoom;
import com.hola.HoLa.model.RoomMember;
import com.hola.HoLa.model.User;
import com.hola.HoLa.service.ChatRoomService;
import com.hola.HoLa.service.MessageService;
import com.hola.HoLa.service.RoomMemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/chat-rooms")
public class ChatRoomController {

    @Autowired
    private ChatRoomService chatRoomService;

    @Autowired
    private RoomMemberService roomMemberService;

    @Autowired
    private MessageService messageService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return chatRoomService.getUserByEmail(email);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ResponseApi<List<ChatRoomDTO>>> getRoomsByUser(@PathVariable Long userId) {
        List<ChatRoomDTO> rooms = chatRoomService.getRoomsByUserId(userId);
        return ResponseEntity.ok(new ResponseApi<>(200, "Success", rooms));
    }

    @PostMapping("/private")
    public ResponseEntity<ResponseApi<ChatRoomDTO>> getOrCreatePrivateRoom(@RequestBody PrivateRoomRequest request) {
        ChatRoom room = chatRoomService.getOrCreatePrivateRoom(request.getUserId(), request.getOtherUserId());
        return ResponseEntity.ok(new ResponseApi<>(200, "Success", chatRoomService.toDto(room, request.getUserId())));
    }

    @PostMapping("/group")
    public ResponseEntity<ResponseApi<ChatRoomDTO>> createGroupRoom(@RequestBody CreateGroupRequest request) {
        User creator = getCurrentUser();
        ChatRoom room = chatRoomService.createGroupRoom(creator.getId(), request);
        ChatRoomDTO dto = chatRoomService.toDto(room, creator.getId());
        // Broadcast phòng mới tới tất cả thành viên
        List<RoomMember> members = chatRoomService.getRoomMembersByRoomId(room.getId());
        for (RoomMember m : members) {
            Long mid = m.getUser().getId();
            messagingTemplate.convertAndSend("/topic/user/" + mid + "/rooms",
                    chatRoomService.toDto(room, mid));
        }
        return ResponseEntity.ok(new ResponseApi<>(200, "Tạo nhóm thành công", dto));
    }

    @PatchMapping("/{roomId}/name")
    public ResponseEntity<ResponseApi<ChatRoomDTO>> updateGroupName(
            @PathVariable Long roomId, @RequestParam String name) {
        User user = getCurrentUser();
        ChatRoom room = chatRoomService.updateGroupName(roomId, user.getId(), name);
        messageService.saveSystemMessage(roomId, "Tên nhóm đã được đổi thành " + name);
        List<RoomMember> members = chatRoomService.getRoomMembersByRoomId(roomId);
        for (RoomMember m : members) {
            Long mid = m.getUser().getId();
            messagingTemplate.convertAndSend("/topic/user/" + mid + "/rooms",
                    chatRoomService.toDto(room, mid));
        }
        return ResponseEntity.ok(new ResponseApi<>(200, "Đổi tên nhóm thành công",
                chatRoomService.toDto(room, user.getId())));
    }

    @PatchMapping("/{roomId}/avatar")
    public ResponseEntity<ResponseApi<ChatRoomDTO>> updateGroupAvatar(
            @PathVariable Long roomId, @RequestParam String avatarUrl) {
        User user = getCurrentUser();
        ChatRoom room = chatRoomService.updateGroupAvatar(roomId, user.getId(), avatarUrl);
        messageService.saveSystemMessage(roomId, user.getUserName() + " đã thay đổi ảnh đại diện nhóm");
        List<RoomMember> members = chatRoomService.getRoomMembersByRoomId(roomId);
        for (RoomMember m : members) {
            Long mid = m.getUser().getId();
            messagingTemplate.convertAndSend("/topic/user/" + mid + "/rooms",
                    chatRoomService.toDto(room, mid));
        }
        return ResponseEntity.ok(new ResponseApi<>(200, "Cập nhật ảnh nhóm thành công",
                chatRoomService.toDto(room, user.getId())));
    }

    @DeleteMapping("/{roomId}")
    public ResponseEntity<ResponseApi<Void>> dissolveRoom(@PathVariable Long roomId) {
        roomMemberService.dissolveRoom(roomId);
        return ResponseEntity.ok(new ResponseApi<>(200, "Đã giải tán nhóm", null));
    }

    @GetMapping("/{roomId}/invite-link")
    public ResponseEntity<ResponseApi<String>> getInviteLink(@PathVariable Long roomId) {
        User requester = getCurrentUser();
        String inviteLink = chatRoomService.getInviteLink(roomId, requester.getId());
        return ResponseEntity.ok(new ResponseApi<>(200, "Lấy link mời thành công", inviteLink));
    }

    @GetMapping("/join-info/{encodedRoomId}")
    public ResponseEntity<ResponseApi<ChatRoomDTO>> getJoinInfo(@PathVariable String encodedRoomId) {
        User user = getCurrentUser();
        ChatRoomDTO dto = chatRoomService.getJoinInfo(encodedRoomId, user.getId());
        return ResponseEntity.ok(new ResponseApi<>(200, "Lấy thông tin nhóm thành công", dto));
    }

    @PostMapping("/{roomId}/join")
    public ResponseEntity<ResponseApi<ChatRoomDTO>> joinGroup(@PathVariable Long roomId) {
        User user = getCurrentUser();
        ChatRoom room = chatRoomService.joinGroupRoom(user.getId(), roomId);
        ChatRoomDTO dto = chatRoomService.toDto(room, user.getId());
        
        // Broadcast sự kiện phòng mới tới chính user đó để update sidebar
        messagingTemplate.convertAndSend("/topic/user/" + user.getId() + "/rooms", dto);
        
        // Broadcast sự kiện member mới tới tất cả thành viên trong phòng chat
        try {
            RoomMember joinedRm = chatRoomService.getRoomMembersByRoomId(roomId).stream()
                    .filter(rm -> rm.getUser().getId().equals(user.getId()))
                    .findFirst().orElseThrow();
            messagingTemplate.convertAndSend("/topic/room/" + roomId + "/members",
                    new com.hola.HoLa.dto.GroupEvent("MEMBER_JOINED", roomMemberService.toDto(joinedRm)));
        } catch (Exception e) {
            // Log và bỏ qua nếu không broadcast được socket member
        }
                
        return ResponseEntity.ok(new ResponseApi<>(200, "Tham gia nhóm thành công", dto));
    }
}
