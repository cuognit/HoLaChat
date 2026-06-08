package com.hola.HoLa.dto;

import lombok.Data;

@Data
public class ReactionDTO {
    private Long userId;
    private String userName;
    private String avatarUrl;
    private String emoji;
}
