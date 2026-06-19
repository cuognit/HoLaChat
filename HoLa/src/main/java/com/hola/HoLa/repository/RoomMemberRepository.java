package com.hola.HoLa.repository;

import com.hola.HoLa.model.ChatRoom;
import com.hola.HoLa.model.RoomMember;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
/**
 * Lớp Repository cho RoomMemberRepository.
 * Chịu trách nhiệm giao tiếp với cơ sở dữ liệu.
 */
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

    List<RoomMember> findByRoomIdOrderByJoinedAtAsc(Long roomId);

    Optional<RoomMember> findByRoomIdAndUserId(Long roomId, Long userId);

    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT rm FROM RoomMember rm WHERE rm.room.id = :roomId AND rm.user.id = :userId")
    Optional<RoomMember> findByRoomIdAndUserIdForUpdate(@Param("roomId") Long roomId, @Param("userId") Long userId);

    int countByRoomId(Long roomId);

    void deleteAllByRoomId(Long roomId);

    @Query("SELECT CASE WHEN COUNT(rm) > 0 THEN true ELSE false END FROM RoomMember rm WHERE rm.room.id = :roomId AND rm.user.id = :userId AND rm.role = com.hola.HoLa.model.MemberRole.ADMIN")
    boolean isAdminOfRoom(@Param("roomId") Long roomId, @Param("userId") Long userId);
}
