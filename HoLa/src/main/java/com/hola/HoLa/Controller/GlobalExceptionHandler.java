package com.hola.HoLa.Controller;

import com.hola.HoLa.dto.ResponseApi;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
/**
 * Lớp Controller xử lý các HTTP request cho GlobalExceptionHandler.
 */
public class GlobalExceptionHandler {

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ResponseApi<Void>> handleMaxSizeException(MaxUploadSizeExceededException exc) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ResponseApi<>(400, "Kích thước tệp tải lên vượt quá giới hạn (tối đa 10MB)!", null));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ResponseApi<Void>> handleRuntimeException(RuntimeException exc) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ResponseApi<>(400, exc.getMessage(), null));
    }
}