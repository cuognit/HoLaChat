package com.hola.HoLa.dto;

import lombok.Data;

@Data
public class RequestVerifiedOtp {
    private String email;
    private String otp;
}
