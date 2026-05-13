package com.hola.HoLa.Controller;

import com.hola.HoLa.dto.RequestLogin;
import com.hola.HoLa.dto.RequestRegister;
import com.hola.HoLa.dto.RequestVerifiedOtp;
import com.hola.HoLa.dto.ResponseApi;
import com.hola.HoLa.model.User;
import com.hola.HoLa.model.RefreshToken;
import com.hola.HoLa.queue.OtpQueueProducer;
import com.hola.HoLa.repository.UserRepository;
import com.hola.HoLa.repository.RefreshTokenRepository;
import com.hola.HoLa.security.JwtUtils;
import com.hola.HoLa.service.MailService;
import com.hola.HoLa.service.UserService;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
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
        try{
            userService.register(user);
            ResponseApi<String> response = new ResponseApi<>(200, "Đăng ký thành công!", "Success Data");
            return ResponseEntity.ok(response);
        }
        catch (RuntimeException e){
            return ResponseEntity.badRequest().body(new ResponseApi(400,e.getMessage(),null));
        }

    }
//    [POST] /login
    @PostMapping("/login")
    public ResponseEntity<ResponseApi<Object>> login(@RequestBody RequestLogin user){
        try{

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
        catch (RuntimeException e){
            return ResponseEntity.badRequest().body(new ResponseApi(400,e.getMessage(),null));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<ResponseApi<String>> refresh(HttpServletRequest request, @CookieValue(name = "refresh_token", required = false) String refreshToken){
        try{         
            if (refreshToken == null) {
                throw new RuntimeException("Refresh token not found in cookie!");
            }
            RefreshToken token = refreshTokenRepository.findByRefreshToken(refreshToken).orElseThrow(()->new RuntimeException("Refresh token not found!"));
            String newAccessToken = JwtUtils.generateAccessToken(token.getUser().getEmail());
            ResponseApi<String> response = new ResponseApi<>(200, "Refresh token successfully!", newAccessToken );   
            return ResponseEntity.ok()
            .body(response);
        }
        catch (RuntimeException e){
            return ResponseEntity.badRequest().body(new ResponseApi(400,e.getMessage(),null));
        }
    }
    @PostMapping("/logout")
    public ResponseEntity<ResponseApi<String>> logout(HttpServletRequest request,@CookieValue(name = "refresh_token", required = false) String refreshToken){
        try{
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
        catch (RuntimeException e){
            return ResponseEntity.badRequest().body(new ResponseApi(400,e.getMessage(),null));
        }
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
        try{
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
        catch (RuntimeException e){
            return ResponseEntity.badRequest().body(new ResponseApi(400,e.getMessage(),null));
        }
    }
    // [POST] /resend-otp
    @PostMapping("/resend-otp")
    public ResponseEntity<ResponseApi<String>> resendOtp(@RequestBody RequestRegister user) {
        try{
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
        catch (RuntimeException e){
            return ResponseEntity.badRequest().body(new ResponseApi(400,e.getMessage(),null));
        }
    }
//  [POST] /verify-otp
    @PostMapping("/verify-otp")
    public ResponseEntity<ResponseApi<String>> verify(@RequestBody RequestVerifiedOtp user) {
        try {
            userService.verifyOtp(user);
            ResponseApi<String> response = new ResponseApi<>(200, "Đăng ký thành công!", "Success Data");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ResponseApi(400, e.getMessage(), null));
        }

    }
//   [GET] /user
    @GetMapping("/user")
    public ResponseEntity getUser() {
            try{
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                Object data = userService.getInf(email);
                ResponseApi<Object> response = new ResponseApi<>(200, "Success", data);
                return ResponseEntity.ok(response);
            }
            catch (RuntimeException e){
                return ResponseEntity.badRequest().body(new ResponseApi(401, e.getMessage(),null));
            }
    }
    // [GET] /userChat
    @GetMapping("/userChat")
    public ResponseEntity getUserChat() {
        try{
            
            Object data = userService.getAllUsers();
            ResponseApi<Object> response = new ResponseApi<>(200, "Success", data);
            return ResponseEntity.ok(response);

        }
        catch (RuntimeException e){
            return ResponseEntity.badRequest().body(new ResponseApi(401, e.getMessage(),null));
        }
    }

    // [GET] /search
    @GetMapping("/search")
    public ResponseEntity searchUsers(@RequestParam String email) {
        try {
            String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            Object data = userService.searchUsersByEmail(email, currentEmail);
            ResponseApi<Object> response = new ResponseApi<>(200, "Success", data);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ResponseApi(400, e.getMessage(), null));
        }
    }

}
