package com.hola.HoLa.repository;

import com.hola.HoLa.model.CallParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CallParticipantRepository extends JpaRepository<CallParticipant, Long> {
    
    @Query("SELECT cp FROM CallParticipant cp WHERE cp.callSession.id = :sessionId AND cp.leftAt IS NULL")
    List<CallParticipant> findActiveParticipants(@Param("sessionId") Long sessionId);

    @Query("SELECT cp FROM CallParticipant cp WHERE cp.callSession.id = :sessionId AND cp.user.id = :userId")
    Optional<CallParticipant> findBySessionAndUser(@Param("sessionId") Long sessionId, @Param("userId") Long userId);
}
