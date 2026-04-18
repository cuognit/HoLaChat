package com.hola.HoLa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class HoLaApplication {

	public static void main(String[] args) {
		SpringApplication.run(HoLaApplication.class, args);
		System.out.println("Backend Spring Boot đã chạy thành công!");
		System.out.println("http://localhost:8080/");
	}

}
