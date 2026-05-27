package com.hola.HoLa.dto;

import lombok.Data;
import java.util.List;

@Data
public class CreateGroupRequest {
    private String roomName;
    private String avatarUrl;
    private List<Long> memberIds;
}
