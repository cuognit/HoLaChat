package com.hola.HoLa.Controller;

import com.hola.HoLa.dto.RequestRegister;
import com.hola.HoLa.dto.RequestVerifiedOtp;
import com.hola.HoLa.dto.ResponseApi;
import com.hola.HoLa.model.User;
import com.hola.HoLa.queue.OtpQueueProducer;
import com.hola.HoLa.repository.UserRepository;
import com.hola.HoLa.service.MailService;
import com.hola.HoLa.service.UserService;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/auth")
public class UserController {
    @Autowired
    private UserService userService;

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
    @Autowired
    private OtpQueueProducer producer;
    @Autowired
    RedissonClient redissonClient;
    @Autowired
    private UserRepository userRepository;
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

    @PostMapping("/verify-otp")
    public ResponseEntity<ResponseApi<String>> verify(@RequestBody RequestVerifiedOtp user) {
        try {
            System.out.println(user.getEmail());
            userService.verifyOtp(user);
            ResponseApi<String> response = new ResponseApi<>(200, "Đăng ký thành công!", "Success Data");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ResponseApi(400, e.getMessage(), null));
        }

    }
}
