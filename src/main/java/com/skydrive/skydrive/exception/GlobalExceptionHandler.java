package com.skydrive.skydrive.exception;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex){
        
        ErrorResponse response = ErrorResponse.builder()
                    .timestamp(LocalDateTime.now())
                    .status(404)
                    .message(ex.getMessage())
                    .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex){
        
        ErrorResponse response = ErrorResponse.builder()
                    .timestamp(LocalDateTime.now())
                    .status(403)
                    .message(ex.getMessage())
                    .build();

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex){
        ex.printStackTrace(); // Log the exception for debugging
        ErrorResponse response = 
            ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .message("Internal Server Error")
            .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }


    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(
        MethodArgumentNotValidException ex
    ){
        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult()
            .getFieldErrors()
            .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));
    return ResponseEntity.badRequest()
                .body(errors);
    }

    @ExceptionHandler(StorageLimitExceededException.class)
    public ResponseEntity<String> handleStorageLimitExceeded(StorageLimitExceededException ex){
        return ResponseEntity.badRequest()
                .body(ex.getMessage());
    }

    @ExceptionHandler(VirusDetectedException.class)
    public ResponseEntity<String> handleVirus(VirusDetectedException ex){
        return ResponseEntity.badRequest().body("Virus detected: " + ex.getMessage());
    }
}
