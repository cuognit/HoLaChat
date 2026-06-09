package com.hola.HoLa.repository;

import com.hola.HoLa.model.CallSession;
import com.hola.HoLa.model.CallStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface CallSessionRepository extends JpaRepository<CallSession, Long> {

    @Query("SELECT count(c) > 0 FROM CallSession c WHERE (c.caller.id = :userId OR c.callee.id = :userId) AND c.status IN ('RINGING', 'ACTIVE')")
    boolean hasActiveCall(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE CallSession c SET c.status = :newStatus WHERE c.id = :sessionId AND c.status = :oldStatus")
    int updateStatusAtomic(@Param("sessionId") Long sessionId, @Param("newStatus") CallStatus newStatus, @Param("oldStatus") CallStatus oldStatus);

    @Modifying
    @Query("UPDATE CallSession c SET c.status = :newStatus, c.startedAt = :startedAt WHERE c.id = :sessionId AND c.status = :oldStatus")
    int updateStatusAndStartedAtAtomic(@Param("sessionId") Long sessionId, @Param("newStatus") CallStatus newStatus, @Param("oldStatus") CallStatus oldStatus, @Param("startedAt") Instant startedAt);

    @Query("SELECT c FROM CallSession c WHERE c.status = 'RINGING' AND c.createdAt < :threshold")
    List<CallSession> findRingingOlderThan(@Param("threshold") Instant threshold);
    
    @Query("SELECT c FROM CallSession c WHERE (c.caller.id = :userId OR c.callee.id = :userId) AND c.status IN ('RINGING', 'ACTIVE')")
    List<CallSession> findActiveSessionsForUser(@Param("userId") Long userId);
}
