package com.sdlc.platform.migration;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.MigrationState;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import javax.sql.DataSource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Live integration test verifying that Flyway migrations V1 and V2 apply and validate
 * successfully against the real running PostgreSQL 16 container.
 */
@SpringBootTest
@ActiveProfiles("dev")
class PostgresFlywayMigrationTest {

    @Autowired
    private DataSource dataSource;

    @Test
    void verifyMigrationsAgainstRunningPostgres() {
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .load();

        flyway.migrate();

        MigrationInfo[] appliedMigrations = flyway.info().applied();

        assertTrue(appliedMigrations.length >= 4, "Expected at least V1, V2, V3, and V4 migrations to be applied");

        MigrationInfo v1 = appliedMigrations[0];
        assertEquals("1", v1.getVersion().getVersion());
        assertEquals("baseline schema", v1.getDescription());
        assertEquals(MigrationState.SUCCESS, v1.getState());

        MigrationInfo v2 = appliedMigrations[1];
        assertEquals("2", v2.getVersion().getVersion());
        assertEquals("auth schema", v2.getDescription());
        assertEquals(MigrationState.SUCCESS, v2.getState());

        MigrationInfo v3 = appliedMigrations[2];
        assertEquals("3", v3.getVersion().getVersion());
        assertEquals("org team project schema", v3.getDescription());
        assertEquals(MigrationState.SUCCESS, v3.getState());

        MigrationInfo v4 = appliedMigrations[3];
        assertEquals("4", v4.getVersion().getVersion());
        assertEquals("requirements and sprints schema", v4.getDescription());
        assertEquals(MigrationState.SUCCESS, v4.getState());
    }
}
