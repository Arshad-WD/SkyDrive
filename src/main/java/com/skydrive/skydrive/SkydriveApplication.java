package com.skydrive.skydrive;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SkydriveApplication {

	public static void main(String[] args) {
		SpringApplication.run(SkydriveApplication.class, args);
	}

}
