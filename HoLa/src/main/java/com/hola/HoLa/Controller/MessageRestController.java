package com.hola.HoLa.Controller;

import com.hola.HoLa.dto.MessageDTO;
import com.hola.HoLa.dto.ResponseApi;
import com.hola.HoLa.service.CloudinaryService;
import com.hola.HoLa.service.MessageService;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/messages")
public class MessageRestController {
    @Autowired
    private MessageService messageService;

    @Autowired
    private CloudinaryService cloudinaryService;

    @GetMapping("/room/{roomId}")
    public ResponseEntity<ResponseApi<Map<String, Object>>> getMessagesByRoom(
            @PathVariable Long roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Map<String, Object> messages = messageService.getMessagesByRoomId(roomId, page, size);
        return ResponseEntity.ok(new ResponseApi<>(200, "Success", messages));
    }

    @PostMapping("/upload-images")
    public ResponseEntity<ResponseApi<List<String>>> uploadImages(
            @RequestParam("files") MultipartFile[] files) {
        if (files == null || files.length == 0) {
            return ResponseEntity.badRequest()
                    .body(new ResponseApi<>(400, "No files provided", null));
        }

        if (files.length > 10) {
            return ResponseEntity.badRequest()
                    .body(new ResponseApi<>(400, "Maximum 10 images allowed", null));
        }

        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            // Validate file size (5MB)
            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest()
                        .body(new ResponseApi<>(400, "File " + file.getOriginalFilename() + " exceeds 5MB limit", null));
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest()
                        .body(new ResponseApi<>(400, "File " + file.getOriginalFilename() + " is not an image", null));
            }

            try {
                String url = cloudinaryService.uploadFile(file, "chat-images");
                urls.add(url);
            } catch (IOException e) {
                return ResponseEntity.internalServerError()
                        .body(new ResponseApi<>(500, "Failed to upload " + file.getOriginalFilename(), null));
            }
        }

        return ResponseEntity.ok(new ResponseApi<>(200, "Upload successful", urls));
    }

    @GetMapping("/room/{roomId}/images")
    public ResponseEntity<ResponseApi<List<String>>> getImagesByRoom(
            @PathVariable Long roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        List<String> images = messageService.getImagesByRoomId(roomId, page, size);
        return ResponseEntity.ok(new ResponseApi<>(200, "Success", images));
    }

    @DeleteMapping("/{messageId}/delete-for-me")
    public ResponseEntity<ResponseApi<Void>> deleteMessageForMe(
            @PathVariable Long messageId,
            @RequestParam Long userId) {
        try {
            messageService.deleteMessageForUser(messageId, userId);
            return ResponseEntity.ok(new ResponseApi<>(200, "Deleted for user", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ResponseApi<>(400, e.getMessage(), null));
        }
    }

    @GetMapping("/room/{roomId}/filtered")
    public ResponseEntity<ResponseApi<Map<String, Object>>> getMessagesByRoomFiltered(
            @PathVariable Long roomId,
            @RequestParam Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Map<String, Object> messages = messageService.getMessagesByRoomId(roomId, page, size, userId);
        return ResponseEntity.ok(new ResponseApi<>(200, "Success", messages));
    }
}
