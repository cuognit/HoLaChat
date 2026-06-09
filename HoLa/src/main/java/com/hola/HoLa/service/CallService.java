package com.hola.HoLa.service;

import com.hola.HoLa.dto.ActiveCallResponse;
import com.hola.HoLa.dto.CallEventDTO;
import com.hola.HoLa.dto.CallRequest;
import com.hola.HoLa.dto.CallResponse;
import com.hola.HoLa.dto.UserDTO;
import com.hola.HoLa.model.*;
import com.hola.HoLa.repository.CallSessionRepository;
import com.hola.HoLa.repository.ChatRoomRepository;
import com.hola.HoLa.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class CallService {

    @Autowired
    private CallSessionRepository callSessionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChatRoomRepository chatRoomRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private WebSocketPresenceService webSocketPresenceService;

    @Autowired
    private MessageService messageService;

    @Autowired
    private PushNotificationService pushNotificationService;

    @Autowired
    private com.hola.HoLa.service.ChatRoomService chatRoomService;

    @Autowired
    private com.hola.HoLa.repository.RoomMemberRepository roomMemberRepository;

    @Value("${livekit.api-key}")
    private String livekitApiKey;

    @Value("${livekit.api-secret}")
    private String livekitApiSecret;

    @Transactional
    public CallResponse initiateCall(Long callerId, CallRequest request) {
        if (callSessionRepository.hasActiveCall(callerId)) {
            throw new RuntimeException("Bạn đang trong một cuộc gọi khác");
        }
        if (callSessionRepository.hasActiveCall(request.getCalleeId())) {
            throw new RuntimeException("Người dùng này đang bận trong một cuộc gọi khác");
        }
        
        User caller = userRepository.findById(callerId).orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));
        User callee = userRepository.findById(request.getCalleeId()).orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));
        ChatRoom room = chatRoomRepository.findById(request.getRoomId()).orElseThrow(() -> new RuntimeException("Phòng chat không tồn tại"));

        String livekitRoomName = "room_call_" + UUID.randomUUID().toString();

        CallSession session = new CallSession();
        session.setRoom(room);
        session.setCaller(caller);
        session.setCallee(callee);
        session.setStatus(CallStatus.RINGING);
        session.setRoomName(livekitRoomName);
        
        session = callSessionRepository.save(session);

        String token = generateToken(livekitRoomName, caller.getId().toString(), caller.getUserName());

        CallEventDTO event = CallEventDTO.builder()
                .type("CALL_REQUEST")
                .sessionId(session.getId())
                .roomId(room.getId())
                .roomName(livekitRoomName)
                .callerInfo(mapUserToDTO(caller))
                .build();
                
        messagingTemplate.convertAndSend("/topic/user/" + callee.getId() + "/call", event);
        
        // Push notification cho cuộc gọi đến
        String title = caller.getUserName() + " đang gọi cho bạn";
        String body = "Nhấn để trả lời cuộc gọi thoại";
        pushNotificationService.sendNotificationToUser(callee.getId(), title, body);

        return CallResponse.builder()
                .sessionId(session.getId())
                .status(CallStatus.RINGING)
                .livekitToken(token)
                .roomName(livekitRoomName)
                .build();
    }

    @Transactional
    public CallResponse acceptCall(Long calleeId, Long sessionId) {
        CallSession session = callSessionRepository.findById(sessionId).orElseThrow(() -> new RuntimeException("Cuộc gọi không tồn tại"));
        
        if (!session.getCallee().getId().equals(calleeId)) {
            throw new RuntimeException("Không có quyền chấp nhận cuộc gọi này");
        }

        if (session.getStatus() != CallStatus.RINGING) {
            throw new RuntimeException("Cuộc gọi không ở trạng thái đang đổ chuông");
        }

        if (!webSocketPresenceService.isUserOnline(session.getCaller().getEmail())) {
            session.setStatus(CallStatus.CANCELLED);
            callSessionRepository.save(session);
            createCallMessage(session, "CANCELLED");
            throw new RuntimeException("Người gọi đã ngắt kết nối");
        }

        int updated = callSessionRepository.updateStatusAndStartedAtAtomic(sessionId, CallStatus.ACTIVE, CallStatus.RINGING, Instant.now());
        if (updated == 0) {
            throw new RuntimeException("Cuộc gọi đã bị huỷ hoặc kết thúc");
        }

        String calleeToken = generateToken(session.getRoomName(), session.getCallee().getId().toString(), session.getCallee().getUserName());

        CallEventDTO event = CallEventDTO.builder()
                .type("CALL_ACCEPTED")
                .sessionId(sessionId)
                .build();
                
        messagingTemplate.convertAndSend("/topic/user/" + session.getCaller().getId() + "/call", event);

        return CallResponse.builder()
                .sessionId(sessionId)
                .status(CallStatus.ACTIVE)
                .livekitToken(calleeToken)
                .roomName(session.getRoomName())
                .callerInfo(mapUserToDTO(session.getCaller()))
                .build();
    }

    @Transactional
    public void rejectCall(Long calleeId, Long sessionId) {
        endCallSession(sessionId, CallStatus.REJECTED, calleeId, "CALL_REJECTED", false);
    }

    @Transactional
    public void cancelCall(Long callerId, Long sessionId) {
        endCallSession(sessionId, CallStatus.CANCELLED, callerId, "CALL_CANCELLED", true);
    }

    @Transactional
    public void endCall(Long userId, Long sessionId) {
        endCallSession(sessionId, CallStatus.ENDED, userId, "CALL_ENDED", null);
    }

    private void endCallSession(Long sessionId, CallStatus newStatus, Long actionUserId, String eventType, Boolean isCaller) {
        CallSession session = callSessionRepository.findById(sessionId).orElseThrow(() -> new RuntimeException("Cuộc gọi không tồn tại"));
        
        if (isCaller != null) {
            Long expectedId = isCaller ? session.getCaller().getId() : session.getCallee().getId();
            if (!expectedId.equals(actionUserId)) {
                throw new RuntimeException("Không có quyền thực hiện hành động này");
            }
        }

        CallStatus oldStatus = session.getStatus();
        if (oldStatus == CallStatus.ENDED || oldStatus == CallStatus.CANCELLED || oldStatus == CallStatus.REJECTED || oldStatus == CallStatus.MISSED) {
            return;
        }

        int updated = callSessionRepository.updateStatusAtomic(sessionId, newStatus, oldStatus);
        if (updated == 0) {
            return; // Một thread khác đã kết thúc cuộc gọi này trước
        }

        session.setStatus(newStatus);
        session.setEndedAt(Instant.now());
        if (newStatus == CallStatus.ENDED && session.getStartedAt() != null) {
            session.setDuration(java.time.Duration.between(session.getStartedAt(), session.getEndedAt()).getSeconds());
        } else {
            session.setDuration(0L);
        }
        
        callSessionRepository.save(session);
        
        createCallMessage(session, newStatus.name());

        Long notifyTarget = session.getCaller().getId().equals(actionUserId) ? session.getCallee().getId() : session.getCaller().getId();
        
        CallEventDTO event = CallEventDTO.builder()
                .type(eventType)
                .sessionId(sessionId)
                .build();
                
        messagingTemplate.convertAndSend("/topic/user/" + notifyTarget + "/call", event);
    }

    @Transactional
    public ActiveCallResponse getActiveCall(Long userId) {
        List<CallSession> activeSessions = callSessionRepository.findActiveSessionsForUser(userId);
        if (activeSessions.isEmpty()) return null;
        
        CallSession session = activeSessions.get(0);
        boolean isCaller = session.getCaller().getId().equals(userId);
        User otherParty = isCaller ? session.getCallee() : session.getCaller();
        
        String token = generateToken(session.getRoomName(), userId.toString(), 
                isCaller ? session.getCaller().getUserName() : session.getCallee().getUserName());

        return ActiveCallResponse.builder()
                .sessionId(session.getId())
                .status(session.getStatus())
                .roomName(session.getRoomName())
                .livekitToken(token)
                .isCaller(isCaller)
                .otherPartyInfo(mapUserToDTO(otherParty))
                .build();
    }

    @Scheduled(fixedRate = 10_000)
    @Transactional
    public void processMissedCalls() {
        Instant threshold = Instant.now().minusSeconds(30);
        List<CallSession> expired = callSessionRepository.findRingingOlderThan(threshold);
        for (CallSession s : expired) {
            int updated = callSessionRepository.updateStatusAtomic(s.getId(), CallStatus.MISSED, CallStatus.RINGING);
            if (updated > 0) {
                s.setStatus(CallStatus.MISSED);
                s.setDuration(0L);
                createCallMessage(s, "MISSED");
                
                CallEventDTO event = CallEventDTO.builder()
                        .type("CALL_MISSED")
                        .sessionId(s.getId())
                        .build();
                messagingTemplate.convertAndSend("/topic/user/" + s.getCaller().getId() + "/call", event);
                messagingTemplate.convertAndSend("/topic/user/" + s.getCallee().getId() + "/call", event);
            }
        }
    }

    private void createCallMessage(CallSession session, String callStatus) {
        String content = String.format("{\"callStatus\": \"%s\", \"duration\": %d}", callStatus, session.getDuration() != null ? session.getDuration() : 0);
        
        com.hola.HoLa.dto.PrivateMessageRequest req = new com.hola.HoLa.dto.PrivateMessageRequest();
        req.setRoomId(session.getRoom().getId());
        req.setSenderId(session.getCaller().getId());
        req.setContent(content);
        req.setMessageType("CALL");
        
        com.hola.HoLa.dto.MessageDTO savedMsg = messageService.savePrivateMessage(req);
        
        // Broadcast tin nhắn vào room realtime
        messagingTemplate.convertAndSend("/topic/room/" + session.getRoom().getId(), savedMsg);

        // Broadcast cập nhật room info tới từng member để cập nhật sidebar
        java.util.List<com.hola.HoLa.model.RoomMember> members = roomMemberRepository.findByRoomId(session.getRoom().getId());
        for (com.hola.HoLa.model.RoomMember member : members) {
            Long memberId = member.getUser().getId();
            com.hola.HoLa.dto.ChatRoomDTO roomUpdate = chatRoomService.toDto(member.getRoom(), memberId);
            messagingTemplate.convertAndSend("/topic/user/" + memberId + "/rooms", roomUpdate);
        }
    }

    private String generateToken(String roomName, String identity, String name) {
        long nowMillis = System.currentTimeMillis();
        long expMillis = nowMillis + (3600 * 1000); // 1 giờ
        
        javax.crypto.SecretKey key = io.jsonwebtoken.security.Keys.hmacShaKeyFor(livekitApiSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        
        java.util.Map<String, Object> videoGrants = new java.util.HashMap<>();
        videoGrants.put("roomJoin", true);
        videoGrants.put("room", roomName);

        return io.jsonwebtoken.Jwts.builder()
                .issuer(livekitApiKey)
                .subject(identity)
                .claim("name", name)
                .claim("video", videoGrants)
                .issuedAt(new java.util.Date(nowMillis))
                .notBefore(new java.util.Date(nowMillis))
                .expiration(new java.util.Date(expMillis))
                .signWith(key)
                .compact();
    }

    private UserDTO mapUserToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUserName(user.getUserName());
        dto.setAvatarUrl(user.getAvatarUrl());
        return dto;
    }
}
