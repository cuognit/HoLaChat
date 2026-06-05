package com.hola.HoLa.repository;

import com.hola.HoLa.model.DeletedMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Set;

@Repository
public interface DeletedMessageRepository extends JpaRepository<DeletedMessage, Long> {
    boolean existsByUserIdAndMessageId(Long userId, Long messageId);

    @Query("SELECT dm.message.id FROM DeletedMessage dm WHERE dm.user.id = :userId AND dm.message.id IN :messageIds")
    Set<Long> findDeletedMessageIdsByUserIdAndMessageIdIn(Long userId, Collection<Long> messageIds);
}
