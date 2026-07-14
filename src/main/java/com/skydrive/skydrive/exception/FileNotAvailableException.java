package com.skydrive.skydrive.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class FileNotAvailableException extends RuntimeException {
    public FileNotAvailableException(String message) {
        super(message);
    }
}
