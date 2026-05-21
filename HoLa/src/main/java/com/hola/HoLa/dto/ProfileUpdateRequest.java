package com.hola.HoLa.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class ProfileUpdateRequest {
    private String userName;
    private String gender;
    private LocalDate birthday;
}
