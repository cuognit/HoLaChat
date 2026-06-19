package com.hola.HoLa.Controller;

import com.hola.HoLa.dto.AddMembersRequest;
import com.hola.HoLa.dto.ResponseApi;
import com.hola.HoLa.dto.RoomMemberDTO;
import com.hola.HoLa.dto.UpdateRoleRequest;
import com.hola.HoLa.model.MemberRole;
import com.hola.HoLa.service.RoomMemberService;
import com.hola.HoLa.model.User;
import com.hola.HoLa.model.ChatRoom;
import com.hola.HoLa.repository.UserRepository;
import com.hola.HoLa.repository.ChatRoomRepository;
import com.hola.HoLa.service.PushNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/rooms")
/**
 * Lớp Controller xử lý các HTTP request cho RoomMemberController.
 */
public class RoomMemberController {

    @Autowired
    private RoomMemberService roomMemberService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChatRoomRepository chatRoomRepository;

    @Autowired
    private PushNotificationService pushNotificationService;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));
    }

    @GetMapping("/{roomId}/members")
    public ResponseEntity<ResponseApi<List<RoomMemberDTO>>> getMembers(@PathVariable Long roomId) {
        List<RoomMemberDTO> members = roomMemberService.getMembers(roomId);
        return ResponseEntity.ok(new ResponseApi<>(200, "Success", members));
    }

    @PostMapping("/{roomId}/members")
    public ResponseEntity<ResponseApi<List<RoomMemberDTO>>> addMembers(
            @PathVariable Long roomId,
            @RequestBody AddMembersRequest request) {
        List<RoomMemberDTO> added = roomMemberService.addMembers(roomId, request.getMemberIds());
        
        User inviter = getCurrentUser();
        ChatRoom room = chatRoomRepository.findById(roomId).orElse(null);
        String roomName = (room != null && room.getRoomName() != null) ? room.getRoomName() : "một nhóm";
        
        for (Long memberId : request.getMemberIds()) {
            pushNotificationService.sendNotificationToUser(memberId, 
                "Bạn đã được thêm vào nhóm", 
                inviter.getUserName() + " đã thêm bạn vào nhóm '" + roomName + "'.");
        }

        return ResponseEntity.ok(new ResponseApi<>(200, "Thêm thành viên thành công", added));
    }

    @DeleteMapping("/{roomId}/members/{targetUserId}")
    public ResponseEntity<ResponseApi<Void>> removeMember(
            @PathVariable Long roomId,
            @PathVariable Long targetUserId) {
        roomMemberService.removeMember(roomId, targetUserId);
        return ResponseEntity.ok(new ResponseApi<>(200, "Thành công", null));
    }

    @PatchMapping("/{roomId}/members/{targetUserId}/role")
    public ResponseEntity<ResponseApi<RoomMemberDTO>> updateRole(
            @PathVariable Long roomId,
            @PathVariable Long targetUserId,
            @RequestBody UpdateRoleRequest request) {
        RoomMemberDTO dto = roomMemberService.updateRole(roomId, targetUserId, request.getRole());
        return ResponseEntity.ok(new ResponseApi<>(200, "Cập nhật quyền thành công", dto));
    }
}
