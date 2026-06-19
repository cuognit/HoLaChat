package com.hola.HoLa.repository;

import com.hola.HoLa.model.MessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
/**
 * Lớp Repository cho MessageReactionRepository.
 * Chịu trách nhiệm giao tiếp với cơ sở dữ liệu.
 */
public interface MessageReactionRepository extends JpaRepository<MessageReaction, Long> {
    Optional<MessageReaction> findByMessageIdAndUserId(Long messageId, Long userId);
    List<MessageReaction> findByMessageId(Long messageId);
    void deleteByMessageIdAndUserId(Long messageId, Long userId);
}
