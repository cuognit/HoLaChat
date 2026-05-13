package com.hola.HoLa.Controller;

import com.hola.HoLa.dto.MessageDTO;
import com.hola.HoLa.dto.ResponseApi;
import com.hola.HoLa.service.MessageService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/messages")
public class MessageRestController {
    @Autowired
    private MessageService messageService;

    @GetMapping("/room/{roomId}")
    public ResponseEntity<ResponseApi<List<MessageDTO>>> getMessagesByRoom(
            @PathVariable Long roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            List<MessageDTO> messages = messageService.getMessagesByRoomId(roomId, page, size);
            return ResponseEntity.ok(new ResponseApi<>(200, "Success", messages));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ResponseApi<>(400, e.getMessage(), null));
        }
    }
}
