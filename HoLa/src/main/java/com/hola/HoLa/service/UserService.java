package com.hola.HoLa.service;

import com.hola.HoLa.dto.RequestRegister;
import com.hola.HoLa.dto.RequestVerifiedOtp;
import com.hola.HoLa.model.User;
import com.hola.HoLa.repository.UserRepository;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpService otpService;

    @Autowired
    PasswordEncoder passwordEncoder;
    @Autowired
    private RedissonClient redissonClient;
    public void register(RequestRegister dto){
        User userExist = userRepository.findByEmail(dto.getEmail())
                .orElse(null);
        if(userExist == null){
            User user = new User();
            user.setUserName(dto.getUserName());
            user.setEmail(dto.getEmail());
            user.setPassWord(passwordEncoder.encode(dto.getPassWord()));
            user.setIsVerified(false);
            userRepository.save(user);
        }else
        if(userExist.getIsVerified()==true){
            throw new RuntimeException("Email này đã được sử dụng!");
        }
        else if(userExist.getIsVerified()==false){
            userExist.setUserName(dto.getUserName());
            userExist.setEmail(dto.getEmail());
            userExist.setPassWord(passwordEncoder.encode(dto.getPassWord()));
            userExist.setIsVerified(false);
            userRepository.save(userExist);
        }

    }

    public void verifyOtp(RequestVerifiedOtp dto) {


        // 1. validate input
        if (dto.getEmail() == null || dto.getOtp() == null) {
            throw new RuntimeException("Email or OTP is missing");
        }

        // 2. lấy OTP từ Redis
        RBucket<String> bucket = redissonClient.getBucket("otp:" + dto.getEmail());
        String storedOtp = bucket.get();

        // 3. check OTP tồn tại
        if (storedOtp == null) {
            throw new RuntimeException( "OTP expired or not found");
        }

        // 4. so sánh OTP
        if (!storedOtp.equals(dto.getOtp())) {
            throw new RuntimeException( "Invalid OTP");
        }

        // 5. tìm user
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 6. check đã verify chưa
        if (user.getIsVerified()) {
            throw new RuntimeException( "User already verified");
        }

        // 7. update trạng thái
        user.setIsVerified(true);
        userRepository.save(user);

        // 8. xoá OTP (tránh reuse)
        bucket.delete();


    }
}
