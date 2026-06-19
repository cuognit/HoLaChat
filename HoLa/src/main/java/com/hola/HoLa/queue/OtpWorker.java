package com.hola.HoLa.queue;

import com.hola.HoLa.service.MailService;
import com.hola.HoLa.service.OtpService;
import org.redisson.api.RQueue;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.redisson.api.RBlockingQueue;

@Component
/**
 * Lớp cấu hình / tiện ích / bảo mật: OtpWorker.
 */
public class OtpWorker {

    @Autowired
    private OtpService otpService;
    private final RedissonClient redissonClient;
    private ExecutorService executor;

    public OtpWorker(RedissonClient redissonClient) {
        this.redissonClient = redissonClient;
    }

    @PostConstruct
    public void start() {
        executor = Executors.newSingleThreadExecutor();

        executor.submit(() -> {
            RBlockingQueue<String> queue = redissonClient.getBlockingQueue("otpQueue");

            while (!Thread.currentThread().isInterrupted()) {
                try {
                    String job = queue.take();
                    processJob(job);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        });
    }

    @PreDestroy
    public void stop() {
        if (executor != null) {
            executor.shutdownNow();
        }
    }

    private void processJob(String job) {
        try {
            String email = job;
            
            otpService.sendOtp(email);

        } catch (Exception e) {
            System.err.println("Error processing job: " + job);
            e.printStackTrace();
        }
    }
}