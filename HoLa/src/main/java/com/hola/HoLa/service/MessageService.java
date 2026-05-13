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

    @Transactional
    public MessageDTO savePrivateMessage(PrivateMessageRequest request) {
        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new RuntimeException("Message content is required");
        }

        ChatRoom room = request.getRoomId() != null
                ? chatRoomService.getValidatedPrivateRoom(request.getRoomId(), request.getSenderId(), request.getReceiverId())
                : chatRoomService.getOrCreatePrivateRoom(request.getSenderId(), request.getReceiverId());

        User sender = userRepo.findById(request.getSenderId())
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        Message message = new Message();
        message.setRoom(room);
        message.setSender(sender);
        message.setContent(request.getContent().trim());
        message.setMessageType(MessageType.TEXT);

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

    private MessageDTO toDto(Message message) {
        MessageDTO dto = new MessageDTO();
        dto.setId(message.getId());
        dto.setRoomId(message.getRoom().getId());
        dto.setContent(message.getContent());
        dto.setMessageType(message.getMessageType().name());
        dto.setSenderId(message.getSender().getId());
        dto.setSenderName(message.getSender().getUserName());
        dto.setCreatedAt(message.getCreatedAt());
        return dto;
    }
}
