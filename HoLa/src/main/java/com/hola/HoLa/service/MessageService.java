package com.hola.HoLa.service;

import com.hola.HoLa.dto.MessageDTO;
import com.hola.HoLa.dto.PrivateMessageRequest;
import com.hola.HoLa.model.ChatRoom;
import com.hola.HoLa.model.Message;
import com.hola.HoLa.model.MessageType;
import com.hola.HoLa.model.User;
import com.hola.HoLa.repository.ChatRoomRepository;
import com.hola.HoLa.repository.MessageRepository;
import com.hola.HoLa.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import java.util.List;
import java.util.Collections;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MessageService {
    @Autowired
    private ChatRoomService chatRoomService;

    @Autowired
    private MessageRepository messageRepo;

    @Autowired
    private ChatRoomRepository chatRoomRepository;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public MessageDTO savePrivateMessage(PrivateMessageRequest request) {
        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new RuntimeException("Message content is required");
        }

        ChatRoom room = request.getRoomId() != null
                ? chatRoomService.getValidatedRoom(request.getRoomId(), request.getSenderId())
                : chatRoomService.getOrCreatePrivateRoom(request.getSenderId(), request.getReceiverId());

        User sender = userRepo.findById(request.getSenderId())
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        // Determine message type from request, default to TEXT
        MessageType type = MessageType.TEXT;
        if (request.getMessageType() != null) {
            try {
                type = MessageType.valueOf(request.getMessageType().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                // Invalid type, fallback to TEXT
            }
        }

        Message message = new Message();
        message.setRoom(room);
        message.setSender(sender);
        message.setContent(type == MessageType.IMAGE ? request.getContent() : request.getContent().trim());
        message.setMessageType(type);

        return toDto(messageRepo.save(message));
    }

    @Transactional(readOnly = true)
    public List<MessageDTO> getMessagesByRoomId(Long roomId, int page, int size) {
        if (roomId == null) {
            throw new RuntimeException("Room id is required");
        }

        if (!chatRoomRepository.existsById(roomId)) {
            throw new RuntimeException("Chat room not found");
        }

        // Fetch paginated messages ordered by created_at DESC
        Page<Message> messagePage = messageRepo.findByRoomIdOrderByCreatedAtDesc(roomId, PageRequest.of(page, size));

        // Map to DTO
        List<MessageDTO> dtoList = messagePage.stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        // Reverse the list so it is ordered by ASC for the frontend
        Collections.reverse(dtoList);

        return dtoList;
    }

    @Transactional
    public MessageDTO saveSystemMessage(Long roomId, String content) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Chat room not found"));
        Message message = new Message();
        message.setRoom(room);
        message.setSender(null); // System message không có sender
        message.setContent(content);
        message.setMessageType(MessageType.SYSTEM);
        
        MessageDTO dto = toDto(messageRepo.save(message));
        
        // Broadcast tin nhắn hệ thống realtime tới toàn bộ thành viên đang ở trong phòng chat qua WebSocket
        messagingTemplate.convertAndSend("/topic/room/" + roomId, dto);
        
        return dto;
    }

    public MessageDTO toDto(Message message) {
        MessageDTO dto = new MessageDTO();
        dto.setId(message.getId());
        dto.setRoomId(message.getRoom().getId());
        dto.setContent(message.getContent());
        dto.setMessageType(message.getMessageType().name());
        // sender có thể null với SYSTEM messages
        if (message.getSender() != null) {
            dto.setSenderId(message.getSender().getId());
            dto.setSenderName(message.getSender().getUserName());
            dto.setSenderAvatarUrl(message.getSender().getAvatarUrl());
        }
        dto.setCreatedAt(message.getCreatedAt());
        return dto;
    }

    @Transactional(readOnly = true)
    public List<String> getImagesByRoomId(Long roomId, int page, int size) {
        if (roomId == null) {
            throw new RuntimeException("Room id is required");
        }
        if (!chatRoomRepository.existsById(roomId)) {
            throw new RuntimeException("Chat room not found");
        }

        Page<Message> messagePage = messageRepo.findByRoomIdAndMessageTypeOrderByCreatedAtDesc(
                roomId, MessageType.IMAGE, PageRequest.of(page, size));

        List<String> allUrls = new java.util.ArrayList<>();
        for (Message msg : messagePage.getContent()) {
            String content = msg.getContent();
            if (content != null && content.startsWith("[")) {
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    List<String> urls = mapper.readValue(content, mapper.getTypeFactory().constructCollectionType(List.class, String.class));
                    allUrls.addAll(urls);
                } catch (Exception e) {
                    allUrls.add(content);
                }
            } else if (content != null) {
                allUrls.add(content);
            }
        }
        return allUrls;
    }
}
