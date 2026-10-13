package com.sdlc.platform.common;

/**
 * Exception thrown when a unique constraint would be violated (e.g. duplicate username or email).
 */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }
}
