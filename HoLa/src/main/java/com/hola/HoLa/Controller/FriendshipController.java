package com.hola.HoLa.Controller;

import com.hola.HoLa.dto.ChatRoomDTO;
import com.hola.HoLa.dto.ResponseApi;
import com.hola.HoLa.dto.UserDTO;
import com.hola.HoLa.model.User;
import com.hola.HoLa.repository.UserRepository;
import com.hola.HoLa.service.FriendshipService;
import com.hola.HoLa.service.PushNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friendships")
/**
 * Lớp Controller xử lý các HTTP request cho FriendshipController.
 */
public class FriendshipController {
    @Autowired
    private FriendshipService friendshipService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PushNotificationService pushNotificationService;

    /** Lấy user đang đăng nhập từ JWT token (không tin tham số từ client) */
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));
    }

    private Long getCurrentUserId() {
        return getCurrentUser().getId();
    }

    @PostMapping("/request")
    public ResponseEntity<ResponseApi<ChatRoomDTO>> sendFriendRequest(
            @RequestParam Long receiverId) {
        User sender = getCurrentUser();
        ChatRoomDTO dto = friendshipService.sendFriendRequest(sender.getId(), receiverId);
        
        // Push Notification
        pushNotificationService.sendNotificationToUser(receiverId, 
            "Yêu cầu kết bạn mới", 
            sender.getUserName() + " đã gửi cho bạn một lời mời kết bạn.");

        return ResponseEntity.ok(new ResponseApi<>(200, "Gửi lời mời kết bạn thành công!", dto));
    }

    @PostMapping("/accept")
    public ResponseEntity<ResponseApi<String>> acceptFriendRequest(
            @RequestParam Long senderId) {
        User receiver = getCurrentUser();
        friendshipService.acceptFriendRequest(receiver.getId(), senderId);
        
        // Push Notification (gửi cho người đã gửi lời mời ban đầu)
        pushNotificationService.sendNotificationToUser(senderId, 
            "Kết bạn thành công", 
            receiver.getUserName() + " đã chấp nhận lời mời kết bạn của bạn.");

        return ResponseEntity.ok(new ResponseApi<>(200, "Đã đồng ý kết bạn!", "Success"));
    }

    @PostMapping("/decline")
    public ResponseEntity<ResponseApi<String>> declineFriendRequest(
            @RequestParam Long senderId) {
        Long receiverId = getCurrentUserId();
        friendshipService.declineFriendRequest(receiverId, senderId);
        return ResponseEntity.ok(new ResponseApi<>(200, "Đã từ chối lời mời kết bạn!", "Success"));
    }

    @GetMapping("/friends")
    public ResponseEntity<ResponseApi<List<UserDTO>>> getFriends() {
        Long userId = getCurrentUserId();
        List<UserDTO> friends = friendshipService.getFriends(userId);
        return ResponseEntity.ok(new ResponseApi<>(200, "Lấy danh sách bạn bè thành công!", friends));
    }

    @GetMapping("/status")
    public ResponseEntity<ResponseApi<String>> getFriendshipStatus(
            @RequestParam Long userId2) {
        Long userId1 = getCurrentUserId();
        String status = friendshipService.getFriendshipStatus(userId1, userId2);
        return ResponseEntity.ok(new ResponseApi<>(200, "Lấy trạng thái kết bạn thành công!", status));
    }

    @PostMapping("/cancel")
    public ResponseEntity<ResponseApi<String>> cancelFriendRequest(
            @RequestParam Long receiverId) {
        Long senderId = getCurrentUserId();
        friendshipService.cancelFriendRequest(senderId, receiverId);
        return ResponseEntity.ok(new ResponseApi<>(200, "Đã hủy yêu cầu kết bạn!", "Success"));
    }

    @PostMapping("/unfriend")
    public ResponseEntity<ResponseApi<String>> unfriend(
            @RequestParam Long friendId) {
        Long userId = getCurrentUserId();
        friendshipService.unfriend(userId, friendId);
        return ResponseEntity.ok(new ResponseApi<>(200, "Hủy kết bạn thành công!", "Success"));
    }
}
