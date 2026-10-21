package com.sdlc.platform.testing.model;

import com.sdlc.platform.auth.model.User;
import com.sdlc.platform.project.model.Project;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "test_executions")
public class TestExecution {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "test_case_id", nullable = false)
    private TestCase testCase;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TestExecutionStatus status;

    @Column(name = "actual_result", columnDefinition = "TEXT", nullable = false)
    private String actualResult;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "duration_ms")
    private Integer durationMs;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "executed_by", nullable = false)
    private User executedBy;

    @Column(name = "executed_at", nullable = false, updatable = false)
    private Instant executedAt = Instant.now();

    public TestExecution() {
    }

    public TestExecution(TestCase testCase, Project project, TestExecutionStatus status,
                         String actualResult, String notes, Integer durationMs, User executedBy) {
        this.testCase = testCase;
        this.project = project;
        this.status = status;
        this.actualResult = actualResult;
        this.notes = notes;
        this.durationMs = durationMs;
        this.executedBy = executedBy;
        this.executedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public TestCase getTestCase() {
        return testCase;
    }

    public void setTestCase(TestCase testCase) {
        this.testCase = testCase;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public TestExecutionStatus getStatus() {
        return status;
    }

    public void setStatus(TestExecutionStatus status) {
        this.status = status;
    }

    public String getActualResult() {
        return actualResult;
    }

    public void setActualResult(String actualResult) {
        this.actualResult = actualResult;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Integer getDurationMs() {
        return durationMs;
    }

    public void setDurationMs(Integer durationMs) {
        this.durationMs = durationMs;
    }

    public User getExecutedBy() {
        return executedBy;
    }

    public void setExecutedBy(User executedBy) {
        this.executedBy = executedBy;
    }

    public Instant getExecutedAt() {
        return executedAt;
    }

    public void setExecutedAt(Instant executedAt) {
        this.executedAt = executedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TestExecution that = (TestExecution) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
