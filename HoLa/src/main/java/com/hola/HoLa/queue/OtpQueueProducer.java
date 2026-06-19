package com.hola.HoLa.queue;

import org.redisson.api.RQueue;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.redisson.api.RBlockingQueue;
import org.redisson.api.RedissonClient;

@Service
/**
 * Lớp cấu hình / tiện ích / bảo mật: OtpQueueProducer.
 */
public class OtpQueueProducer {

    @Autowired
    private RedissonClient redissonClient;

    public void sendOtpJob(String email) {
        RQueue<String> queue = redissonClient.getQueue("otpQueue");

        // format: email|otp
        queue.add(email);
    }
}

