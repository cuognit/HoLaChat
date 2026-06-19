package com.hola.HoLa.repository;

import com.hola.HoLa.model.Friendship;
import com.hola.HoLa.model.FriendshipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
/**
 * Lớp Repository cho FriendshipRepository.
 * Chịu trách nhiệm giao tiếp với cơ sở dữ liệu.
 */
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {
    Optional<Friendship> findBySenderIdAndReceiverId(Long senderId, Long receiverId);

    @Query("SELECT f FROM Friendship f WHERE (f.sender.id = :u1 AND f.receiver.id = :u2) OR (f.sender.id = :u2 AND f.receiver.id = :u1)")
    Optional<Friendship> findRelation(@Param("u1") Long u1, @Param("u2") Long u2);

    List<Friendship> findByReceiverIdAndStatus(Long receiverId, FriendshipStatus status);

    List<Friendship> findBySenderIdAndStatus(Long senderId, FriendshipStatus status);

    List<Friendship> findBySenderIdAndStatusOrReceiverIdAndStatus(Long senderId, FriendshipStatus status1, Long receiverId, FriendshipStatus status2);

    @Query("SELECT f FROM Friendship f WHERE (f.sender.id = :userId OR f.receiver.id = :userId) AND f.status = com.hola.HoLa.model.FriendshipStatus.PENDING")
    List<Friendship> findPendingRequests(@Param("userId") Long userId);
}