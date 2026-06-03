package com.hola.HoLa.repository;

import com.hola.HoLa.model.Message;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByRoomIdOrderByCreatedAtAsc(Long roomId);
    Optional<Message> findFirstByRoomIdOrderByCreatedAtDesc(Long roomId);
    Page<Message> findByRoomIdOrderByCreatedAtDesc(Long roomId, Pageable pageable);
    void deleteAllByRoomId(Long roomId);
    Page<Message> findByRoomIdAndMessageTypeOrderByCreatedAtDesc(Long roomId, com.hola.HoLa.model.MessageType messageType, Pageable pageable);
}

