package com.hola.HoLa.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SeenUserDTO {
    private Long userId;
    private String userName;
    private String avatarUrl;
}
