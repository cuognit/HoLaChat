package com.hola.HoLa.service;

import com.hola.HoLa.dto.MessageDTO;
import com.hola.HoLa.dto.PrivateMessageRequest;
import com.hola.HoLa.model.ChatRoom;
import com.hola.HoLa.model.DeletedMessage;
import com.hola.HoLa.model.Message;
import com.hola.HoLa.model.MessageType;
import com.hola.HoLa.model.User;
import com.hola.HoLa.repository.ChatRoomRepository;
import com.hola.HoLa.repository.DeletedMessageRepository;
import com.hola.HoLa.repository.MessageRepository;
import com.hola.HoLa.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    private DeletedMessageRepository deletedMessageRepo;

    @Autowired
    private com.hola.HoLa.repository.MessageReactionRepository messageReactionRepo;

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
        if (request.getForwarded() != null) {
            message.setForwarded(request.getForwarded());
        }

        if (request.getReplyToId() != null) {
            messageRepo.findById(request.getReplyToId()).ifPresent(message::setReplyTo);
        }

        return toDto(messageRepo.save(message));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMessagesByRoomId(Long roomId, int page, int size) {
        return getMessagesByRoomId(roomId, page, size, null);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMessagesByRoomId(Long roomId, int page, int size, Long currentUserId) {
        if (roomId == null) {
            throw new RuntimeException("Room id is required");
        }

        if (!chatRoomRepository.existsById(roomId)) {
            throw new RuntimeException("Chat room not found");
        }

        // Fetch paginated messages ordered by created_at DESC
        Page<Message> messagePage = messageRepo.findByRoomIdOrderByCreatedAtDesc(roomId, PageRequest.of(page, size));

        // Lấy danh sách message IDs mà user đã xóa phía mình
        Set<Long> deletedIds = Set.of();
        if (currentUserId != null) {
            List<Long> pageMessageIds = messagePage.getContent().stream()
                    .map(Message::getId).collect(Collectors.toList());
            if (!pageMessageIds.isEmpty()) {
                deletedIds = deletedMessageRepo.findDeletedMessageIdsByUserIdAndMessageIdIn(currentUserId, pageMessageIds);
            }
        }

        final Set<Long> finalDeletedIds = deletedIds;

        // Map to DTO, bỏ qua tin nhắn đã xóa phía mình
        List<MessageDTO> dtoList = messagePage.stream()
                .filter(msg -> !finalDeletedIds.contains(msg.getId()))
                .map(this::toDto)
                .collect(Collectors.toList());

        // Reverse the list so it is ordered by ASC for the frontend
        Collections.reverse(dtoList);

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("messages", dtoList);
        response.put("hasMore", messagePage.hasNext());

        return response;
    }

    @Transactional
    public MessageDTO saveSystemMessage(Long roomId, String content) {
        return saveSystemMessageWithSender(roomId, content, null);
    }

    @Transactional
    public MessageDTO saveSystemMessageWithSender(Long roomId, String content, User sender) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Chat room not found"));
        Message message = new Message();
        message.setRoom(room);
        message.setSender(sender); // System message có thể có sender để định danh người tạo (ví dụ người thả cảm xúc)
        message.setContent(content);
        message.setMessageType(MessageType.SYSTEM);
        
        MessageDTO dto = toDto(messageRepo.save(message));
        
        // Broadcast tin nhắn hệ thống realtime tới toàn bộ thành viên đang ở trong phòng chat qua WebSocket
        messagingTemplate.convertAndSend("/topic/room/" + roomId, dto);
        
        return dto;
    }

    /**
     * Thu hồi tin nhắn: chỉ người gửi mới được thu hồi.
     * Không giới hạn thời gian.
     */
    @Transactional
    public MessageDTO recallMessage(Long messageId, Long userId) {
        Message message = messageRepo.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (message.getSender() == null || !message.getSender().getId().equals(userId)) {
            throw new RuntimeException("You can only recall your own messages");
        }

        if (Boolean.TRUE.equals(message.getRecalled())) {
            throw new RuntimeException("Message already recalled");
        }

        message.setRecalled(true);
        message.setContent("Tin nhắn đã được thu hồi");
        message.setMessageType(MessageType.TEXT); // Reset type về TEXT
        return toDto(messageRepo.save(message));
    }

    /**
     * Xóa tin nhắn phía tôi: chỉ ẩn khỏi giao diện của user hiện tại.
     */
    @Transactional
    public void deleteMessageForUser(Long messageId, Long userId) {
        Message message = messageRepo.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (deletedMessageRepo.existsByUserIdAndMessageId(userId, messageId)) {
            return; // Đã xóa rồi, bỏ qua
        }

        DeletedMessage deleted = new DeletedMessage();
        deleted.setUser(user);
        deleted.setMessage(message);
        deletedMessageRepo.save(deleted);
    }

    public MessageDTO toDto(Message message) {
        MessageDTO dto = new MessageDTO();
        dto.setId(message.getId());
        dto.setRoomId(message.getRoom().getId());
        dto.setContent(message.getContent());
        dto.setMessageType(message.getMessageType().name());
        dto.setRecalled(Boolean.TRUE.equals(message.getRecalled()));
        dto.setForwarded(Boolean.TRUE.equals(message.getForwarded()));
        // sender có thể null với SYSTEM messages
        if (message.getSender() != null) {
            dto.setSenderId(message.getSender().getId());
            dto.setSenderName(message.getSender().getUserName());
            dto.setSenderAvatarUrl(message.getSender().getAvatarUrl());
        }

        if (message.getReplyTo() != null) {
            Message replyTo = message.getReplyTo();
            dto.setReplyToId(replyTo.getId());
            dto.setReplyToMessageType(replyTo.getMessageType().name());
            
            if (Boolean.TRUE.equals(replyTo.getRecalled())) {
                dto.setReplyToContent("Tin nhắn đã bị thu hồi");
                dto.setReplyToSenderName(replyTo.getSender() != null ? replyTo.getSender().getUserName() : "Hệ thống");
            } else {
                dto.setReplyToContent(replyTo.getContent());
                dto.setReplyToSenderName(replyTo.getSender() != null ? replyTo.getSender().getUserName() : "Hệ thống");
            }
        }

        dto.setCreatedAt(message.getCreatedAt());

        // Load reactions
        java.util.List<com.hola.HoLa.model.MessageReaction> reactions = messageReactionRepo.findByMessageId(message.getId());
        java.util.List<com.hola.HoLa.dto.ReactionDTO> reactionDTOs = reactions.stream().map(r -> {
            com.hola.HoLa.dto.ReactionDTO rDto = new com.hola.HoLa.dto.ReactionDTO();
            rDto.setUserId(r.getUser().getId());
            rDto.setUserName(r.getUser().getUserName());
            rDto.setAvatarUrl(r.getUser().getAvatarUrl());
            rDto.setEmoji(r.getEmoji());
            return rDto;
        }).collect(Collectors.toList());
        dto.setReactions(reactionDTOs);

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
