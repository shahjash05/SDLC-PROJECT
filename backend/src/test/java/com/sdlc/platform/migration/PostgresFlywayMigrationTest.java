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

        assertTrue(appliedMigrations.length >= 9, "Expected at least V1 through V9 migrations to be applied");

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

        MigrationInfo v5 = appliedMigrations[4];
        assertEquals("5", v5.getVersion().getVersion());
        assertEquals("documents and diagrams schema", v5.getDescription());
        assertEquals(MigrationState.SUCCESS, v5.getState());

        MigrationInfo v6 = appliedMigrations[5];
        assertEquals("6", v6.getVersion().getVersion());
        assertEquals("test management schema", v6.getDescription());
        assertEquals(MigrationState.SUCCESS, v6.getState());

        MigrationInfo v7 = appliedMigrations[6];
        assertEquals("7", v7.getVersion().getVersion());
        assertEquals("test execution schema", v7.getDescription());
        assertEquals(MigrationState.SUCCESS, v7.getState());

        MigrationInfo v8 = appliedMigrations[7];
        assertEquals("8", v8.getVersion().getVersion());
        assertEquals("defect tracking schema", v8.getDescription());
        assertEquals(MigrationState.SUCCESS, v8.getState());

        MigrationInfo v9 = appliedMigrations[8];
        assertEquals("9", v9.getVersion().getVersion());
        assertEquals("test case traceability schema", v9.getDescription());
        assertEquals(MigrationState.SUCCESS, v9.getState());
    }
}
