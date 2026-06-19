package com.hola.HoLa.config;

import com.hola.HoLa.security.JwtUtils;
import java.security.Principal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import com.hola.HoLa.security.JwtUtils;
import com.hola.HoLa.service.WebSocketPresenceService;
import java.security.Principal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

@Component
/**
 * Lớp cấu hình / tiện ích / bảo mật: WebSocketAuthChannelInterceptor.
 */
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {
    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    @Lazy
    private WebSocketPresenceService presenceService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return message;
            }

            String token = authHeader.substring(7);
            if (!jwtUtils.validateToken(token)) {
                return message;
            }

            String email = jwtUtils.getEmailFromToken(token);
            StompPrincipal principal = new StompPrincipal(email);
            accessor.setUser(principal);

            // Cập nhật trạng thái Online ngay tại đây
            presenceService.processConnect(email, accessor.getSessionId());
        }

        return message;
    }

    private static final class StompPrincipal implements Principal {
        private final String name;

        private StompPrincipal(String name) {
            this.name = name;
        }

        @Override
        public String getName() {
            return name;
        }
    }
}
