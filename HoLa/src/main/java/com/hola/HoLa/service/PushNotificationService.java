package com.hola.HoLa.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.MulticastMessage;
import com.google.firebase.messaging.Notification;
import com.hola.HoLa.model.DeviceToken;
import com.hola.HoLa.repository.DeviceTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PushNotificationService {

    @Autowired
    private DeviceTokenRepository deviceTokenRepository;

    /**
     * Send a notification to a specific user (to all their registered device tokens).
     */
    public void sendNotificationToUser(Long userId, String title, String body) {
        List<DeviceToken> tokens = deviceTokenRepository.findByUserId(userId);
        if (tokens == null || tokens.isEmpty()) {
            return; // No devices registered for this user
        }

        List<String> tokenStrings = tokens.stream()
                .map(DeviceToken::getToken)
                .collect(Collectors.toList());

        Notification notification = Notification.builder()
                .setTitle(title)
                .setBody(body)
                .build();

        MulticastMessage message = MulticastMessage.builder()
                .addAllTokens(tokenStrings)
                .setNotification(notification)
                .build();

        try {
            FirebaseMessaging.getInstance().sendEachForMulticast(message);
            System.out.println("Successfully sent push notification to user ID: " + userId);
        } catch (FirebaseMessagingException e) {
            System.err.println("Error sending push notification: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
