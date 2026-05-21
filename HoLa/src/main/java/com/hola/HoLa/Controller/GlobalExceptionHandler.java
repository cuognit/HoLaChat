package com.hola.HoLa.Controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handleMaxSizeException(MaxUploadSizeExceededException exc) {
        Map<String, String> response = new HashMap<>();
        // Trả về thông báo lỗi thân thiện định dạng JSON để frontend hiển thị qua toast
        response.put("message", "Kích thước tệp tải lên vượt quá giới hạn cho phép ở phía máy chủ (tối đa 10MB)!");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
}