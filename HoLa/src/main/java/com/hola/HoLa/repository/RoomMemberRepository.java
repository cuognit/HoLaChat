package com.hola.HoLa.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hola.HoLa.model.RoomMember;

@Repository
public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {
    
}


