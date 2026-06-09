package com.hola.HoLa.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hola.HoLa.model.DeviceToken;
import com.hola.HoLa.model.User;
import com.hola.HoLa.repository.DeviceTokenRepository;
import com.hola.HoLa.repository.UserRepository;

@Service
public class DeviceTokenService {

    @Autowired
    private DeviceTokenRepository deviceTokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public void saveDeviceToken(String email, String token) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        // Check if token already exists
        DeviceToken existingToken = deviceTokenRepository.findByToken(token).orElse(null);
        if (existingToken != null) {
            // If token exists but belongs to a different user, update the user
            if (!existingToken.getUser().getId().equals(user.getId())) {
                existingToken.setUser(user);
                deviceTokenRepository.save(existingToken);
            }
            // If token exists and belongs to the same user, do nothing
            return;
        }

        // Create new device token
        DeviceToken deviceToken = new DeviceToken();
        deviceToken.setUser(user);
        deviceToken.setToken(token);
        deviceTokenRepository.save(deviceToken);
    }

    @Transactional
    public void removeDeviceToken(String token) {
        deviceTokenRepository.deleteByToken(token);
    }
}
