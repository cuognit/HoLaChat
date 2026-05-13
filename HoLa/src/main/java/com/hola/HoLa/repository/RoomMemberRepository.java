package com.hola.HoLa.repository;

import com.hola.HoLa.model.ChatRoom;
import com.hola.HoLa.model.RoomMember;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {
    @Query("""
        SELECT rm.room
        FROM RoomMember rm
        WHERE rm.room.isGroup = false
        GROUP BY rm.room
        HAVING COUNT(rm.id) = 2
           AND SUM(CASE WHEN rm.user.id = :user1Id THEN 1 ELSE 0 END) > 0
           AND SUM(CASE WHEN rm.user.id = :user2Id THEN 1 ELSE 0 END) > 0
    """)
    Optional<ChatRoom> findPrivateRoom(@Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id);

    @Query("""
        SELECT rm.room
        FROM RoomMember rm
        WHERE rm.user.id = :userId
        ORDER BY rm.room.createdAt DESC
    """)
    List<ChatRoom> findRoomsByUserId(@Param("userId") Long userId);

    Optional<RoomMember> findFirstByRoomIdAndUserIdNot(Long roomId, Long userId);

    List<RoomMember> findByRoomId(Long roomId);

    boolean existsByRoomIdAndUserId(Long roomId, Long userId);
}
