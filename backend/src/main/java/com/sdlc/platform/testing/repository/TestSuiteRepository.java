package com.sdlc.platform.testing.repository;

import com.sdlc.platform.testing.model.TestSuite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TestSuiteRepository extends JpaRepository<TestSuite, UUID> {

    List<TestSuite> findByProjectIdOrderByCreatedAtAsc(UUID projectId);

    boolean existsByProjectIdAndNameIgnoreCase(UUID projectId, String name);

    Optional<TestSuite> findByIdAndProjectId(UUID id, UUID projectId);
}
