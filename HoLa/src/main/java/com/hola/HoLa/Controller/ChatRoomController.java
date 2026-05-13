package com.hola.HoLa.Controller;

import com.hola.HoLa.dto.ChatRoomDTO;
import com.hola.HoLa.dto.PrivateRoomRequest;
import com.hola.HoLa.dto.ResponseApi;
import com.hola.HoLa.model.ChatRoom;
import com.hola.HoLa.service.ChatRoomService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat-rooms")
public class ChatRoomController {
    @Autowired
    private ChatRoomService chatRoomService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<ResponseApi<List<ChatRoomDTO>>> getRoomsByUser(@PathVariable Long userId) {
        try {
            List<ChatRoomDTO> rooms = chatRoomService.getRoomsByUserId(userId);
            return ResponseEntity.ok(new ResponseApi<>(200, "Success", rooms));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ResponseApi<>(400, e.getMessage(), null));
        }
    }

    @PostMapping("/private")
    public ResponseEntity<ResponseApi<ChatRoomDTO>> getOrCreatePrivateRoom(@RequestBody PrivateRoomRequest request) {
        try {
            ChatRoom room = chatRoomService.getOrCreatePrivateRoom(request.getUserId(), request.getOtherUserId());
            return ResponseEntity.ok(new ResponseApi<>(200, "Success", chatRoomService.toDto(room, request.getUserId())));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ResponseApi<>(400, e.getMessage(), null));
        }
    }
}
