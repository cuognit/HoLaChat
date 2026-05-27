package com.hola.HoLa.Controller;

import com.hola.HoLa.dto.AddMembersRequest;
import com.hola.HoLa.dto.ResponseApi;
import com.hola.HoLa.dto.RoomMemberDTO;
import com.hola.HoLa.dto.UpdateRoleRequest;
import com.hola.HoLa.model.MemberRole;
import com.hola.HoLa.service.RoomMemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class RoomMemberController {

    @Autowired
    private RoomMemberService roomMemberService;

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
