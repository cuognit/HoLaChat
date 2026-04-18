package com.hola.HoLa.dto;

import lombok.Data;

@Data
public class RoomMemberDTO {
    private Long id;
    private Long roomId;
    private Long userId;
    private String role;

}
