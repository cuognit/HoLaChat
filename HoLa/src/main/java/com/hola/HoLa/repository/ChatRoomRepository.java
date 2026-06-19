package com.hola.HoLa.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.hola.HoLa.model.ChatRoom;

@Repository
/**
 * Lớp Repository cho ChatRoomRepository.
 * Chịu trách nhiệm giao tiếp với cơ sở dữ liệu.
 */
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    
}


