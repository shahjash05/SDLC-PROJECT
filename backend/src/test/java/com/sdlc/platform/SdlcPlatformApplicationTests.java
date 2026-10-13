package com.sdlc.platform;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Smoke test — verifies the Spring application context loads successfully
 * using the test profile (H2 in-memory database, no live PostgreSQL needed).
 */
@SpringBootTest
@ActiveProfiles("test")
class SdlcPlatformApplicationTests {

    @Test
    void contextLoads() {
        // If the context fails to load, this test will fail with a descriptive error
    }
}
