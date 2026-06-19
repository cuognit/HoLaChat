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
/**
 * Lớp Service chứa logic nghiệp vụ cho PushNotificationService.
 */
public class PushNotificationService {

    @Autowired
    private DeviceTokenRepository deviceTokenRepository;

    /**
     * Send a notification to a specific user (to all their registered device tokens).
     */
    @org.springframework.transaction.annotation.Transactional
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
            com.google.firebase.messaging.BatchResponse response = FirebaseMessaging.getInstance().sendEachForMulticast(message);
            System.out.println("Successfully sent push notification to user ID: " + userId);
            
            // Cleanup invalid tokens
            if (response.getFailureCount() > 0) {
                List<com.google.firebase.messaging.SendResponse> responses = response.getResponses();
                for (int i = 0; i < responses.size(); i++) {
                    if (!responses.get(i).isSuccessful()) {
                        String errorCode = responses.get(i).getException().getMessagingErrorCode().name();
                        if ("UNREGISTERED".equals(errorCode) || "INVALID_ARGUMENT".equals(errorCode)) {
                            deviceTokenRepository.deleteByToken(tokenStrings.get(i));
                            System.out.println("Deleted invalid token: " + tokenStrings.get(i));
                        }
                    }
                }
            }
        } catch (FirebaseMessagingException e) {
            System.err.println("Error sending push notification: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
