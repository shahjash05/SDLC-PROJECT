package com.sdlc.platform.testing.repository;

import com.sdlc.platform.testing.model.Defect;
import com.sdlc.platform.testing.model.DefectSeverity;
import com.sdlc.platform.testing.model.DefectStatus;
import com.sdlc.platform.testing.model.TestPriority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DefectRepository extends JpaRepository<Defect, UUID> {

    @Query("SELECT COALESCE(MAX(d.defectNumber), 0) FROM Defect d WHERE d.project.id = :projectId")
    int findMaxDefectNumberByProjectId(@Param("projectId") UUID projectId);

    List<Defect> findByProjectIdOrderByDefectNumberDesc(UUID projectId);

    List<Defect> findByProjectIdAndStatusOrderByDefectNumberDesc(UUID projectId, DefectStatus status);

    List<Defect> findByProjectIdAndSeverityOrderByDefectNumberDesc(UUID projectId, DefectSeverity severity);

    List<Defect> findByProjectIdAndPriorityOrderByDefectNumberDesc(UUID projectId, TestPriority priority);

    List<Defect> findByTestCaseIdOrderByDefectNumberDesc(UUID testCaseId);

    List<Defect> findByTestExecutionIdOrderByDefectNumberDesc(UUID testExecutionId);

    long countByProjectId(UUID projectId);

    long countByProjectIdAndStatus(UUID projectId, DefectStatus status);

    long countByProjectIdAndSeverity(UUID projectId, DefectSeverity severity);
}
