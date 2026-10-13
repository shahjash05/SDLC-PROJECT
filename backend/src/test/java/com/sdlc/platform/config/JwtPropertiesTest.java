package com.sdlc.platform.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtPropertiesTest {

    @Test
    void validate_succeedsWith256BitKey() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("12345678901234567890123456789012"); // exactly 32 bytes
        assertDoesNotThrow(properties::validate);
    }

    @Test
    void validate_failsWhenSecretIsNull() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret(null);
        IllegalStateException ex = assertThrows(IllegalStateException.class, properties::validate);
        assertTrue(ex.getMessage().contains("JWT secret is not configured"));
    }

    @Test
    void validate_failsWhenSecretIsTooShort() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("short-secret-key"); // less than 32 bytes
        IllegalStateException ex = assertThrows(IllegalStateException.class, properties::validate);
        assertTrue(ex.getMessage().contains("JWT secret is insecure"));
    }
}
