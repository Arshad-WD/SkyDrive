package com.skydrive.skydrive.service;

import org.springframework.stereotype.Service;

import com.skydrive.skydrive.entity.ShareLink;
import com.skydrive.skydrive.repository.ShareLinkRespoistory;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ShareService {
    
    private final ShareLinkRespoistory shareLinkRespoistory;

    public ShareLink getShareLink(String token){

        return shareLinkRespoistory.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid share link"));
    }
}
