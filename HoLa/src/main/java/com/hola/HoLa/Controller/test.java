package com.hola.HoLa.Controller;

import com.hola.HoLa.dto.RequestLogin;
import com.hola.HoLa.queue.OtpQueueProducer;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.TimeUnit;


@RestController
@CrossOrigin(origins = "http://localhost:5173")

@RequestMapping("/test")
public class test {

    @Autowired
    private OtpQueueProducer producer;
    @Autowired
    RedissonClient redissonClient;

    @GetMapping("/otp")
    public String testOtp() {
        String email= "cuonguyenmanh18@gmail.com";
        RBucket<Long> cooldownBucket = redissonClient.getBucket("otp:cooldown:" + email);

        if (cooldownBucket.isExists()) {
            throw new RuntimeException("Please wait before requesting another OTP");
        }
        producer.sendOtpJob(email);
        cooldownBucket.set(System.currentTimeMillis(), 2, TimeUnit.MINUTES);
        return "Sent!";
    }



}
