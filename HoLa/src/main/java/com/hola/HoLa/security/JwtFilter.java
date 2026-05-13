package com.hola.HoLa.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. Lấy header "Authorization" từ request
        String authHeader = request.getHeader("Authorization");
        String token = null;
        String email = null;

        // 2. Kiểm tra xem Header có bắt đầu bằng "Bearer " không (chuẩn quốc tế)
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7); // Cắt bỏ 7 ký tự đầu "Bearer " để lấy Token
            try {
                email = jwtUtils.getEmailFromToken(token);
            } catch (Exception e) {
                // Token lỗi hoặc hết hạn thì có thể log ra ở đây
                System.out.println("JWT Error: " + e.getMessage());
            }
        }

        // 3. Nếu có Username và chưa được xác thực trong SecurityContext (phiên làm việc này)
        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // Kiểm tra Token lần nữa xem có thực sự hợp lệ không
            if (jwtUtils.validateToken(token)) {
                // Tạo đối tượng xác thực của Spring Security
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        email, null, null // Chỗ null cuối là dành cho Roles/Authorities (Quyền)
                );

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Lưu thông tin xác thực vào Context của hệ thống
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // 4. Cho phép request đi tiếp đến Controller hoặc Filter tiếp theo
        filterChain.doFilter(request, response);
    }
}
