package com.hola.HoLa.dto;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Data;

@Data
public class MessageDTO {
    private Long id;
    private Long roomId;
    private String content;
    private String messageType;
    

    private Long senderId;
    private String senderName;
    private String senderAvatarUrl;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}
