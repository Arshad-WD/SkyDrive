package com.skydrive.skydrive.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import lombok.Getter;

@Getter
@Configuration
public class ClamAvConfig {

    @Value("${clamav.host}")
    private String host;

    @Value("${clamav.port}")
    private Integer port;
}