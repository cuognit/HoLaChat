package com.hola.HoLa.Controller;

import com.hola.HoLa.dto.RequestLogin;
import com.hola.HoLa.dto.RequestRegister;
import com.hola.HoLa.dto.RequestResetPassword;
import com.hola.HoLa.dto.RequestVerifiedOtp;
import com.hola.HoLa.dto.ResponseApi;
import com.hola.HoLa.dto.ProfileUpdateRequest;
import com.hola.HoLa.dto.UserDTO;
import com.hola.HoLa.model.User;
import com.hola.HoLa.model.RefreshToken;
import com.hola.HoLa.queue.OtpQueueProducer;
import com.hola.HoLa.repository.UserRepository;
import com.hola.HoLa.repository.RefreshTokenRepository;
import com.hola.HoLa.security.JwtUtils;
import com.hola.HoLa.service.MailService;
import com.hola.HoLa.service.UserService;
import com.hola.HoLa.service.CloudinaryService;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/auth")
public class UserController {
    @Autowired
    private UserService userService;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

//    [POST] /register
    @PostMapping("/register")
    public ResponseEntity<ResponseApi<String>> register(@RequestBody RequestRegister user){
        userService.register(user);
        ResponseApi<String> response = new ResponseApi<>(200, "Đăng ký thành công!", "Success Data");
        return ResponseEntity.ok(response);
    }

//    [POST] /login
    @PostMapping("/login")
    public ResponseEntity<ResponseApi<Object>> login(@RequestBody RequestLogin user){
        Map<String, String> tokens = userService.login(user);
        String refreshToken = tokens.get("refreshToken");
        String accessToken = tokens.get("accessToken");
        if(refreshToken == null || accessToken == null){
            throw new RuntimeException("Refresh token or Access token is null");
        }
        // lưu rc vào cookie
        ResponseCookie cookie = ResponseCookie.from("refresh_token", refreshToken)
            .httpOnly(true)
            .secure(false)
            .path("/")
            .maxAge(7 * 24 * 60 * 60)
            .sameSite("Lax").build();
        ResponseApi<Object> response = new ResponseApi<>(200, "Đăng nhập thành công!", accessToken );   
        return ResponseEntity.ok()
        .header("Set-Cookie", cookie.toString())
        .body(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<ResponseApi<String>> refresh(HttpServletRequest request, @CookieValue(name = "refresh_token", required = false) String refreshToken){
        if (refreshToken == null) {
            throw new RuntimeException("Refresh token not found in cookie!");
        }
        
        RefreshToken token = refreshTokenRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new RuntimeException("Refresh token not found!"));
        
        // 1. KIỂM TRA HẾT HẠN: Nếu thời gian hiện tại đã vượt quá expiryDate
        if (token.getExpiryDate().isBefore(java.time.LocalDateTime.now())) {
            // Xóa luôn khỏi database để dọn rác và bảo mật
            refreshTokenRepository.delete(token); 
            throw new RuntimeException("Refresh token has expired! Please login again.");
        }
        
        // 2. KIỂM TRA BỊ THU HỒI (Revoked):
        if (token.isRevoked()) {
            throw new RuntimeException("Refresh token has been revoked!");
        }
        
        String newAccessToken = JwtUtils.generateAccessToken(token.getUser().getEmail());
        ResponseApi<String> response = new ResponseApi<>(200, "Refresh token successfully!", newAccessToken );   
        return ResponseEntity.ok().body(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<ResponseApi<String>> logout(HttpServletRequest request,@CookieValue(name = "refresh_token", required = false) String refreshToken){
        if (refreshToken == null) {
            throw new RuntimeException("Refresh token not found in cookie!");
        }
        refreshTokenRepository.deleteByRefreshToken(refreshToken);
        ResponseCookie cookie = ResponseCookie.from("refresh_token", "")
            .httpOnly(true)
            .secure(false)
            .path("/")
            .maxAge(0)
            .sameSite("Lax").build();
        ResponseApi<String> response = new ResponseApi<>(200, "Logout successfully!", null );   
        return ResponseEntity.ok()
        .header("Set-Cookie", cookie.toString())
        .body(response);
    }

    @Autowired
    private OtpQueueProducer producer;
    @Autowired
    RedissonClient redissonClient;
    @Autowired
    private UserRepository userRepository;

//   [POST] /otp
    @PostMapping("/otp")
    public ResponseEntity<ResponseApi<String>> testOtp(@RequestBody RequestRegister user) {
        User userExist = userRepository.findByEmail(user.getEmail()).orElseThrow(()->new RuntimeException("User not found!"));
        if(userExist.getIsVerified()==false) {
        String email = user.getEmail();
        RBucket<Long> cooldownBucket = redissonClient.getBucket("otp:cooldown:" + email);

        if (cooldownBucket.isExists()) {
            throw new RuntimeException("Please wait before requesting another OTP");
        }
        producer.sendOtpJob(email);
        cooldownBucket.set(System.currentTimeMillis(), 2, TimeUnit.MINUTES);
            ResponseApi<String> response = new ResponseApi<>(200, "Đã gửi", "Success Data");
            return ResponseEntity.ok(response);
        }
        else  {
            throw new RuntimeException("User is already verified !");
        }
    }

    // [POST] /resend-otp
    @PostMapping("/resend-otp")
    public ResponseEntity<ResponseApi<String>> resendOtp(@RequestBody RequestRegister user) {
        String email = user.getEmail();
        RBucket<Long> cooldownBucket = redissonClient.getBucket("otp:cooldown:" + email);
        if (cooldownBucket.isExists()) {
            throw new RuntimeException("Please wait before requesting another OTP");
        }
        producer.sendOtpJob(email);
        cooldownBucket.set(System.currentTimeMillis(), 2, TimeUnit.MINUTES);
            ResponseApi<String> response = new ResponseApi<>(200, "Đã gửi", "Success Data");
            return ResponseEntity.ok(response);
    }

//  [POST] /verify-otp
    @PostMapping("/verify-otp")
    public ResponseEntity<ResponseApi<String>> verify(@RequestBody RequestVerifiedOtp user) {
        userService.verifyOtp(user);
        ResponseApi<String> response = new ResponseApi<>(200, "Đăng ký thành công!", "Success Data");
        return ResponseEntity.ok(response);
    }

//  [POST] /forgot-password
    @PostMapping("/forgot-password")
    public ResponseEntity<ResponseApi<String>> forgotPassword(@RequestBody RequestRegister user) {
        userService.forgotPassword(user.getEmail());
        ResponseApi<String> response = new ResponseApi<>(200, "Mã OTP đã được gửi đến email của bạn.", null);
        return ResponseEntity.ok(response);
    }

//  [POST] /reset-password
    @PostMapping("/reset-password")
    public ResponseEntity<ResponseApi<String>> resetPassword(@RequestBody RequestResetPassword dto) {
        userService.resetPassword(dto);
        ResponseApi<String> response = new ResponseApi<>(200, "Đặt lại mật khẩu thành công!", null);
        return ResponseEntity.ok(response);
    }

//  [POST] /verify-reset-otp
    @PostMapping("/verify-reset-otp")
    public ResponseEntity<ResponseApi<String>> verifyResetOtp(@RequestBody RequestVerifiedOtp dto) {
        userService.verifyResetOtp(dto);
        ResponseApi<String> response = new ResponseApi<>(200, "Mã OTP hợp lệ!", null);
        return ResponseEntity.ok(response);
    }

//   [GET] /user
    @GetMapping("/user")
    public ResponseEntity getUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Object data = userService.getInf(email);
        ResponseApi<Object> response = new ResponseApi<>(200, "Success", data);
        return ResponseEntity.ok(response);
    }

    // [GET] /userChat
    @GetMapping("/userChat")
    public ResponseEntity getUserChat() {
        Object data = userService.getAllUsers();
        ResponseApi<Object> response = new ResponseApi<>(200, "Success", data);
        return ResponseEntity.ok(response);
    }

    // [GET] /search
    @GetMapping("/search")
    public ResponseEntity searchUsers(@RequestParam String email) {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        Object data = userService.searchUsersByEmail(email, currentEmail);
        ResponseApi<Object> response = new ResponseApi<>(200, "Success", data);
        return ResponseEntity.ok(response);
    }

    @Autowired
    private CloudinaryService cloudinaryService;

    @PutMapping("/profile/update")
    public ResponseEntity<ResponseApi<UserDTO>> updateProfile(@RequestBody ProfileUpdateRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        UserDTO updatedUser = userService.updateProfile(email, request);
        return ResponseEntity.ok(new ResponseApi<>(200, "Cập nhật thông tin cá nhân thành công!", updatedUser));
    }

    @PutMapping("/profile/avatar")
    public ResponseEntity<ResponseApi<UserDTO>> updateAvatarUrl(@RequestParam("avatarUrl") String avatarUrl) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        UserDTO updatedUser = userService.updateAvatar(email, avatarUrl);
        return ResponseEntity.ok(new ResponseApi<>(200, "Cập nhật ảnh đại diện thành công!", updatedUser));
    }

    @PutMapping("/profile/cover")
    public ResponseEntity<ResponseApi<UserDTO>> updateCoverUrl(@RequestParam("coverUrl") String coverUrl) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        UserDTO updatedUser = userService.updateCover(email, coverUrl);
        return ResponseEntity.ok(new ResponseApi<>(200, "Cập nhật ảnh bìa thành công!", updatedUser));
    }

    // [GET] /api/auth/user/{id} - Lấy chi tiết thông tin bạn bè
    @GetMapping("/user/{id}")
    public ResponseEntity getUserById(@PathVariable Long id) {
        UserDTO data = userService.getUserById(id);
        return ResponseEntity.ok(new ResponseApi<>(200, "Lấy thông tin thành công!", data));
    }
}
