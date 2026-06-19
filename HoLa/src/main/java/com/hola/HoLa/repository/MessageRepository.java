package com.hola.HoLa.repository;

import com.hola.HoLa.model.Message;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;

@Repository
/**
 * Lớp Repository cho MessageRepository.
 * Chịu trách nhiệm giao tiếp với cơ sở dữ liệu.
 */
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByRoomIdOrderByIdAsc(Long roomId);
    Optional<Message> findFirstByRoomIdOrderByIdDesc(Long roomId);
    List<Message> findTop10ByRoomIdOrderByIdDesc(Long roomId);
    Page<Message> findByRoomIdOrderByIdDesc(Long roomId, Pageable pageable);
    void deleteAllByRoomId(Long roomId);
    Page<Message> findByRoomIdAndMessageTypeOrderByIdDesc(Long roomId, com.hola.HoLa.model.MessageType messageType, Pageable pageable);
}

