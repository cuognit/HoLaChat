package com.hola.HoLa.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.hola.HoLa.model.User;

import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    
    List<User> findByEmailContainingIgnoreCaseAndEmailNot(String keyword, String email);

    @Query("SELECT u FROM User u WHERE (LOWER(u.userName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND u.email != :excludeEmail")
    List<User> searchByNameOrEmail(@org.springframework.data.repository.query.Param("keyword") String keyword, 
                                   @org.springframework.data.repository.query.Param("excludeEmail") String excludeEmail);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.isOnline = :isOnline")
    void updateAllUserStatus(boolean isOnline);
}


