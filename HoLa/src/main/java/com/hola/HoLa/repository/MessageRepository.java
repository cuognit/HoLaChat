package com.hola.HoLa.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.hola.HoLa.model.Message;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
}


