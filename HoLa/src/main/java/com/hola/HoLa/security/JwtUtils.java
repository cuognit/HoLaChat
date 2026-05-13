package com.hola.HoLa.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;
@Component
public class JwtUtils {
    // SecretKey phải dài ít nhất 32 ký tự
    private static final String SECRET_KEY = "day_la_chuoi_secret_sieu_bao_mat_2026";
    private static final long ACCESS_TOKEN_EXPIRATION_TIME = 5 * 60 * 1000; // 5 phút (ms)
   

    private static SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8));
    }    
    //. access token
    public static String generateAccessToken(String email) {
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + ACCESS_TOKEN_EXPIRATION_TIME))
                .signWith(getSigningKey()) // Dùng Key đã tạo ở trên
                .compact();
    }
    //. refresh token
    public static String generateRefreshToken(String email) {
        return UUID.randomUUID().toString();
    }

    // 2. Giải mã và lấy email từ Token
    public static String getEmailFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    // 3. Kiểm tra Token còn hạn hay không
    public static boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false; // Token sai, hết hạn, hoặc bị sửa đổi
        }
    }
}