package com.hola.HoLa.dto;

import com.hola.HoLa.model.MemberRole;
import lombok.Data;

@Data
public class UpdateRoleRequest {
    private MemberRole role;
}
