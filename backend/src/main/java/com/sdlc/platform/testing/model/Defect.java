package com.sdlc.platform.testing.model;

import com.sdlc.platform.auth.model.User;
import com.sdlc.platform.project.model.Project;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "defects", uniqueConstraints = {
        @UniqueConstraint(name = "uq_project_defect_number", columnNames = {"project_id", "defect_number"})
})
public class Defect {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "defect_number", nullable = false)
    private int defectNumber;

    @Column(nullable = false, length = 250)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "steps_to_reproduce", columnDefinition = "TEXT")
    private String stepsToReproduce;

    @Column(name = "expected_result", columnDefinition = "TEXT")
    private String expectedResult;

    @Column(name = "actual_result", columnDefinition = "TEXT")
    private String actualResult;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DefectSeverity severity = DefectSeverity.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TestPriority priority = TestPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DefectStatus status = DefectStatus.OPEN;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_case_id")
    private TestCase testCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_execution_id")
    private TestExecution testExecution;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id")
    private User reporter;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    public Defect() {}

    public Defect(Project project, int defectNumber, String title, String description,
                  String stepsToReproduce, String expectedResult, String actualResult,
                  DefectSeverity severity, TestPriority priority, DefectStatus status,
                  TestCase testCase, TestExecution testExecution,
                  User assignee, User reporter) {
        this.project = project;
        this.defectNumber = defectNumber;
        this.title = title;
        this.description = description;
        this.stepsToReproduce = stepsToReproduce;
        this.expectedResult = expectedResult;
        this.actualResult = actualResult;
        this.severity = severity != null ? severity : DefectSeverity.MEDIUM;
        this.priority = priority != null ? priority : TestPriority.MEDIUM;
        this.status = status != null ? status : DefectStatus.OPEN;
        this.testCase = testCase;
        this.testExecution = testExecution;
        this.assignee = assignee;
        this.reporter = reporter;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        if (this.status == DefectStatus.RESOLVED) {
            this.resolvedAt = Instant.now();
        } else if (this.status == DefectStatus.CLOSED) {
            this.closedAt = Instant.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public int getDefectNumber() {
        return defectNumber;
    }

    public void setDefectNumber(int defectNumber) {
        this.defectNumber = defectNumber;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStepsToReproduce() {
        return stepsToReproduce;
    }

    public void setStepsToReproduce(String stepsToReproduce) {
        this.stepsToReproduce = stepsToReproduce;
    }

    public String getExpectedResult() {
        return expectedResult;
    }

    public void setExpectedResult(String expectedResult) {
        this.expectedResult = expectedResult;
    }

    public String getActualResult() {
        return actualResult;
    }

    public void setActualResult(String actualResult) {
        this.actualResult = actualResult;
    }

    public DefectSeverity getSeverity() {
        return severity;
    }

    public void setSeverity(DefectSeverity severity) {
        this.severity = severity;
    }

    public TestPriority getPriority() {
        return priority;
    }

    public void setPriority(TestPriority priority) {
        this.priority = priority;
    }

    public DefectStatus getStatus() {
        return status;
    }

    public void setStatus(DefectStatus status) {
        this.status = status;
    }

    public TestCase getTestCase() {
        return testCase;
    }

    public void setTestCase(TestCase testCase) {
        this.testCase = testCase;
    }

    public TestExecution getTestExecution() {
        return testExecution;
    }

    public void setTestExecution(TestExecution testExecution) {
        this.testExecution = testExecution;
    }

    public User getAssignee() {
        return assignee;
    }

    public void setAssignee(User assignee) {
        this.assignee = assignee;
    }

    public User getReporter() {
        return reporter;
    }

    public void setReporter(User reporter) {
        this.reporter = reporter;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public Instant getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(Instant closedAt) {
        this.closedAt = closedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Defect defect)) return false;
        return Objects.equals(id, defect.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
