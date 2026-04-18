package com.hola.HoLa.dto;

import lombok.Data;

@Data
public class UserDTO {
    private Long id;
    private String userName;
    private String email;
    private String avatarUrl;
    private Boolean isOnline;
    private Boolean isVerified;
    
}
