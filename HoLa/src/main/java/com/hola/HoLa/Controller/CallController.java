package com.hola.HoLa.Controller;

import com.hola.HoLa.dto.ActiveCallResponse;
import com.hola.HoLa.dto.CallRequest;
import com.hola.HoLa.dto.CallResponse;
import com.hola.HoLa.model.User;
import com.hola.HoLa.repository.UserRepository;
import com.hola.HoLa.service.CallService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/calls")
/**
 * Lớp Controller xử lý các HTTP request cho CallController.
 */
public class CallController {

    @Autowired
    private CallService callService;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PostMapping
    public ResponseEntity<CallResponse> initiateCall(@RequestBody CallRequest request) {
        User user = getCurrentUser();
        CallResponse response = callService.initiateCall(user.getId(), request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{sessionId}/accept")
    public ResponseEntity<CallResponse> acceptCall(@PathVariable Long sessionId) {
        User user = getCurrentUser();
        CallResponse response = callService.acceptCall(user.getId(), sessionId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{sessionId}/reject")
    public ResponseEntity<Void> rejectCall(@PathVariable Long sessionId) {
        User user = getCurrentUser();
        callService.rejectCall(user.getId(), sessionId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{sessionId}/cancel")
    public ResponseEntity<Void> cancelCall(@PathVariable Long sessionId) {
        User user = getCurrentUser();
        callService.cancelCall(user.getId(), sessionId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{sessionId}/end")
    public ResponseEntity<Void> endCall(@PathVariable Long sessionId) {
        User user = getCurrentUser();
        callService.endCall(user.getId(), sessionId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{sessionId}/leave")
    public ResponseEntity<Void> leaveCall(@PathVariable Long sessionId) {
        User user = getCurrentUser();
        callService.leaveCall(user.getId(), sessionId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/room/{roomId}/active")
    public ResponseEntity<ActiveCallResponse> getActiveCallByRoom(@PathVariable Long roomId) {
        ActiveCallResponse response = callService.getActiveCallByRoom(roomId);
        if (response != null) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/active")
    public ResponseEntity<ActiveCallResponse> getActiveCall() {
        User user = getCurrentUser();
        ActiveCallResponse response = callService.getActiveCall(user.getId());
        if (response == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }
}
