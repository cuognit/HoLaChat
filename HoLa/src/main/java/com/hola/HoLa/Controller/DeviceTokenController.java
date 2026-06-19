package com.hola.HoLa.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hola.HoLa.dto.DeviceTokenRequest;
import com.hola.HoLa.dto.ResponseApi;
import com.hola.HoLa.service.DeviceTokenService;

@RestController
@RequestMapping("/api/device-token")
/**
 * Lớp Controller xử lý các HTTP request cho DeviceTokenController.
 */
public class DeviceTokenController {

    @Autowired
    private DeviceTokenService deviceTokenService;

    @PostMapping("/save")
    public ResponseEntity<ResponseApi<String>> saveDeviceToken(@RequestBody DeviceTokenRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        deviceTokenService.saveDeviceToken(email, request.getToken());
        return ResponseEntity.ok(new ResponseApi<>(200, "Lưu token thiết bị thành công", null));
    }

    @DeleteMapping("/remove")
    public ResponseEntity<ResponseApi<String>> removeDeviceToken(@RequestParam String token) {
        deviceTokenService.removeDeviceToken(token);
        return ResponseEntity.ok(new ResponseApi<>(200, "Đã xóa token thiết bị", null));
    }
}
