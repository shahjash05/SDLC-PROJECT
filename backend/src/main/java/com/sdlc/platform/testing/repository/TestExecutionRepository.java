package com.sdlc.platform.testing.repository;

import com.sdlc.platform.testing.model.TestExecution;
import com.sdlc.platform.testing.model.TestExecutionStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TestExecutionRepository extends JpaRepository<TestExecution, UUID> {

    List<TestExecution> findByTestCaseIdOrderByExecutedAtDesc(UUID testCaseId);

    List<TestExecution> findByProjectIdOrderByExecutedAtDesc(UUID projectId);

    List<TestExecution> findByProjectIdOrderByExecutedAtDesc(UUID projectId, Pageable pageable);

    Optional<TestExecution> findTopByTestCaseIdOrderByExecutedAtDesc(UUID testCaseId);

    long countByProjectId(UUID projectId);

    long countByProjectIdAndStatus(UUID projectId, TestExecutionStatus status);

    long countByTestCaseId(UUID testCaseId);
}
