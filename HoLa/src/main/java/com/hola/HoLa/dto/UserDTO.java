package com.hola.HoLa.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class UserDTO {
    private Long id;
    private String userName;
    private String email;
    private String avatarUrl;
    private String coverUrl;
    private String gender;
    private LocalDate birthday;
    private Boolean isOnline;
    private Boolean isVerified;
}
