package com.skydrive.skydrive.exception;

public class AccessDeniedException extends RuntimeException {
    
    public AccessDeniedException(String message){
        super(message);
    }
}
