package com.sdlc.platform.testing.repository;

import com.sdlc.platform.testing.model.TestCase;
import com.sdlc.platform.testing.model.TestCaseStatus;
import com.sdlc.platform.testing.model.TestPriority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TestCaseRepository extends JpaRepository<TestCase, UUID> {

    List<TestCase> findByProjectIdOrderByCaseNumberAsc(UUID projectId);

    List<TestCase> findByProjectIdAndSuiteIdOrderByCaseNumberAsc(UUID projectId, UUID suiteId);

    List<TestCase> findByProjectIdAndSuiteIsNullOrderByCaseNumberAsc(UUID projectId);

    List<TestCase> findByProjectIdAndStatusOrderByCaseNumberAsc(UUID projectId, TestCaseStatus status);

    List<TestCase> findByProjectIdAndPriorityOrderByCaseNumberAsc(UUID projectId, TestPriority priority);

    @Query("SELECT COALESCE(MAX(t.caseNumber), 0) FROM TestCase t WHERE t.project.id = :projectId")
    int findMaxCaseNumberByProjectId(@Param("projectId") UUID projectId);

    long countBySuiteId(UUID suiteId);

    long countByProjectId(UUID projectId);

    long countByProjectIdAndStatus(UUID projectId, TestCaseStatus status);

    void deleteAllByProjectId(UUID projectId);
}
