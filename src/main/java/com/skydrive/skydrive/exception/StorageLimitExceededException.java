package com.skydrive.skydrive.exception;


public class StorageLimitExceededException extends RuntimeException {
    public StorageLimitExceededException(String message){
        super(message);
    }
}
