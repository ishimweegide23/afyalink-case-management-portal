package com.afyalink.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {

    private final String resourceName;
    private final String message;

    public ResourceNotFoundException(String message) {
        super(message);
        this.message = message;
        this.resourceName = "Resource";
    }

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue));
        this.resourceName = resourceName;
        this.message = String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue);
    }

    @Override
    public String getMessage() {
        return message;
    }

    public String getResourceName() {
        return resourceName;
    }
}
