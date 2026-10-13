package com.sdlc.platform.common;

import org.springframework.boot.actuate.info.Info;
import org.springframework.boot.actuate.info.InfoContributor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;

/**
 * Custom health/info controller providing a simple ping endpoint
 * and application metadata via the Actuator /info endpoint.
 */
@Component
public class AppInfoContributor implements InfoContributor {

    @Override
    public void contribute(Info.Builder builder) {
        builder.withDetails(Map.of(
                "name", "SDLC Platform",
                "description", "Collaborative SDLC Management Platform",
                "version", "0.1.0-SNAPSHOT",
                "phase", "Phase 0 — Foundation",
                "startedAt", Instant.now().toString()
        ));
    }
}
