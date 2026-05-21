package com.hola.HoLa.service;

import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class OtpService {

    @Autowired
    private RedissonClient redissonClient;

    @Autowired
    private MailService mailService;

    public void sendOtp(String email) {

        String otp = String.valueOf((int)(Math.random() * 900000) + 100000);

        // lưu Redis (TTL 5 phút)
        RBucket<String> bucket = redissonClient.getBucket("otp:" + email);

        bucket.set(otp, 5, TimeUnit.MINUTES);


        mailService.send(email, otp);
    }

}
