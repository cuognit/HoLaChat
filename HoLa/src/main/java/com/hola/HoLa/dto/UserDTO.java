package com.hola.HoLa.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.Instant;

@Data
public class UserDTO {
    private Long id;
    
    @com.fasterxml.jackson.annotation.JsonProperty("userName")
    private String userName;
    
    private String email;
    
    @com.fasterxml.jackson.annotation.JsonProperty("avatarUrl")
    private String avatarUrl;
    
    private String coverUrl;
    private String gender;
    private LocalDate birthday;
    private Boolean isOnline;
    private Instant lastActiveAt;
    private Boolean isVerified;
}
