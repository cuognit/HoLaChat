package com.hola.HoLa.service;

import com.hola.HoLa.dto.RequestLogin;
import com.hola.HoLa.dto.RequestRegister;
import com.hola.HoLa.dto.RequestVerifiedOtp;
import com.hola.HoLa.dto.UserDTO;
import com.hola.HoLa.model.RefreshToken;
import com.hola.HoLa.model.User;
import com.hola.HoLa.repository.RefreshTokenRepository;
import com.hola.HoLa.repository.UserRepository;
import com.hola.HoLa.security.JwtUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

   @Autowired
   private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RedissonClient redissonClient;

    @Autowired
    private JwtUtils jwtUtils;

    public void register(RequestRegister dto) {
        User userExist = userRepository.findByEmail(dto.getEmail()).orElse(null);
        if (userExist == null) {
            User user = new User();
            user.setUserName(dto.getUserName());
            user.setEmail(dto.getEmail());
            user.setPassWord(passwordEncoder.encode(dto.getPassWord()));
            user.setIsVerified(false);
            userRepository.save(user);
        } else if (userExist.getIsVerified()) {
            throw new RuntimeException("Email này đã có người sử dụng!");
        } else {
            userExist.setUserName(dto.getUserName());
            userExist.setEmail(dto.getEmail());
            userExist.setPassWord(passwordEncoder.encode(dto.getPassWord()));
            userExist.setIsVerified(false);
            userRepository.save(userExist);
        }
    }

    public Map<String, String> login(RequestLogin dto) {
        User userExist = userRepository.findByEmail(dto.getEmail()).orElse(null);
        if (userExist == null || !userExist.getIsVerified()) {
            throw new RuntimeException("Email chưa được đăng ký!");
        } else if (!passwordEncoder.matches(dto.getPassWord(), userExist.getPassWord())) {
            throw new RuntimeException("Mật khẩu không đúng!");
        } else {
            String accessToken = JwtUtils.generateAccessToken(dto.getEmail());
            String refreshToken = JwtUtils.generateRefreshToken(dto.getEmail());
           
            
            //lưu refresh token vào database
            RefreshToken rc = new RefreshToken();
            rc.setUser(userExist);
            rc.setRefreshToken(refreshToken);
            rc.setRevoked(false);
            rc.setExpiryDate(LocalDateTime.now().plusDays(7));
            rc.setCreatedAt(LocalDateTime.now());
            refreshTokenRepository.save(rc);
            Map<String, String> map = new HashMap<>();
            map.put("accessToken", accessToken);
            map.put("refreshToken", refreshToken);
            return map;
        }
    }

    public void verifyOtp(RequestVerifiedOtp dto) {
        if (dto.getEmail() == null || dto.getOtp() == null) {
            throw new RuntimeException("Email or OTP is missing");
        }

        RBucket<String> bucket = redissonClient.getBucket("otp:" + dto.getEmail());
        String storedOtp = bucket.get();

        if (storedOtp == null) {
            throw new RuntimeException("OTP expired or not found");
        }

        if (!storedOtp.equals(dto.getOtp())) {
            throw new RuntimeException("Invalid OTP");
        }

        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getIsVerified()) {
            throw new RuntimeException("User already verified");
        }

        user.setIsVerified(true);
        userRepository.save(user);
        bucket.delete();
    }

    public Object getInf(String email) {
        UserDTO dto = new UserDTO();
        User userExist = userRepository.findByEmail(email).orElse(null);
        if (userExist == null) {
            throw new RuntimeException("User not found");
        }
        dto.setId(userExist.getId());
        dto.setUserName(userExist.getUserName());
        dto.setEmail(userExist.getEmail());
        dto.setAvatarUrl(userExist.getAvatarUrl());
        
        // Check real-time status from Redis
        RBucket<String> statusBucket = redissonClient.getBucket("user:status:" + email.toLowerCase());
        dto.setIsOnline("online".equals(statusBucket.get()));

        return dto;
    }

    public List<UserDTO> getAllUsers() {
        List<User> users = userRepository.findAll();
        return users.stream().map(user -> {
            UserDTO dto = new UserDTO();
            dto.setId(user.getId());
            dto.setUserName(user.getUserName());
            dto.setEmail(user.getEmail());
            dto.setAvatarUrl(user.getAvatarUrl());
            dto.setIsVerified(user.getIsVerified());
            
            // Get real-time status from Redis for each user
            RBucket<String> statusBucket = redissonClient.getBucket("user:status:" + user.getEmail().toLowerCase());
            dto.setIsOnline("online".equals(statusBucket.get()));
            
            return dto;
        }).toList();
    }

    public List<UserDTO> searchUsersByEmail(String keyword, String currentEmail) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }
        
        List<User> users = userRepository.findByEmailContainingIgnoreCaseAndEmailNot(keyword.trim(), currentEmail);
        return users.stream()
                .filter(User::getIsVerified) // Only return verified users
                .map(user -> {
                    UserDTO dto = new UserDTO();
                    dto.setId(user.getId());
                    dto.setUserName(user.getUserName());
                    dto.setEmail(user.getEmail());
                    dto.setAvatarUrl(user.getAvatarUrl());
                    dto.setIsVerified(user.getIsVerified());
                    
                    RBucket<String> statusBucket = redissonClient.getBucket("user:status:" + user.getEmail().toLowerCase());
                    dto.setIsOnline("online".equals(statusBucket.get()));
                    
                    return dto;
                }).toList();
    }

    @Transactional
    public void updateOnlineStatusByEmail(String email, boolean isOnline) {
        if (email == null || email.isBlank()) {
            return;
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsOnline(isOnline);
        userRepository.save(user);
    }
}
