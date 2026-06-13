package com.skydrive.skydrive.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.skydrive.skydrive.service.VirusScanService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestController {

    private final VirusScanService virusScanService;
    
    @GetMapping("/")
    public String home(){
        return "SkyDrive API Running";
    }

    @GetMapping("/token-test")
    public String tokenTest(){
        return "JWT Working";
    }
    
    @GetMapping("/me")
    public String me(){
        return "Authenicated";
    }

    @PostMapping("/scan")
    public String scan(@RequestParam("file") MultipartFile file) throws Exception {
        virusScanService.scan(file);
        return "File is clean";
    }

}
