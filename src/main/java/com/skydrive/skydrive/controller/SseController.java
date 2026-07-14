package com.skydrive.skydrive.controller;

import com.skydrive.skydrive.entity.User;
import com.skydrive.skydrive.service.SseService;
import com.skydrive.skydrive.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/files/sse")
@RequiredArgsConstructor
public class SseController {

    private final SseService sseService;
    private final UserService userService;

    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe() {
        User currentUser = userService.getCurrentUser();
        return sseService.subscribe(currentUser.getId());
    }
}
