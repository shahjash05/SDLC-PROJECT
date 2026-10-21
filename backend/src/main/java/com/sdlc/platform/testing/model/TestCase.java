package com.sdlc.platform.testing.model;

import com.sdlc.platform.auth.model.User;
import com.sdlc.platform.document.model.Document;
import com.sdlc.platform.project.model.Project;
import com.sdlc.platform.requirement.model.UserStory;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "test_cases", uniqueConstraints = {
        @UniqueConstraint(name = "uq_project_case_number", columnNames = {"project_id", "case_number"})
})
public class TestCase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "suite_id")
    private TestSuite suite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_story_id")
    private UserStory userStory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requirement_id")
    private Document requirement;

    @Column(name = "case_number", nullable = false)
    private int caseNumber;

    @Column(nullable = false, length = 250)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String preconditions;

    @Column(name = "test_steps", columnDefinition = "TEXT")
    private String testSteps;

    @Column(name = "expected_result", columnDefinition = "TEXT")
    private String expectedResult;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TestPriority priority = TestPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TestCaseStatus status = TestCaseStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public TestCase() {}

    public TestCase(Project project, TestSuite suite, int caseNumber, String title,
                    String description, String preconditions, String testSteps,
                    String expectedResult, TestPriority priority, TestCaseStatus status, User createdBy) {
        this.project = project;
        this.suite = suite;
        this.caseNumber = caseNumber;
        this.title = title;
        this.description = description;
        this.preconditions = preconditions;
        this.testSteps = testSteps;
        this.expectedResult = expectedResult;
        this.priority = priority != null ? priority : TestPriority.MEDIUM;
        this.status = status != null ? status : TestCaseStatus.DRAFT;
        this.createdBy = createdBy;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
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

    public TestSuite getSuite() {
        return suite;
    }

    public void setSuite(TestSuite suite) {
        this.suite = suite;
    }

    public int getCaseNumber() {
        return caseNumber;
    }

    public void setCaseNumber(int caseNumber) {
        this.caseNumber = caseNumber;
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

    public String getPreconditions() {
        return preconditions;
    }

    public void setPreconditions(String preconditions) {
        this.preconditions = preconditions;
    }

    public String getTestSteps() {
        return testSteps;
    }

    public void setTestSteps(String testSteps) {
        this.testSteps = testSteps;
    }

    public String getExpectedResult() {
        return expectedResult;
    }

    public void setExpectedResult(String expectedResult) {
        this.expectedResult = expectedResult;
    }

    public TestPriority getPriority() {
        return priority;
    }

    public void setPriority(TestPriority priority) {
        this.priority = priority != null ? priority : TestPriority.MEDIUM;
    }

    public TestCaseStatus getStatus() {
        return status;
    }

    public void setStatus(TestCaseStatus status) {
        this.status = status != null ? status : TestCaseStatus.DRAFT;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public UserStory getUserStory() {
        return userStory;
    }

    public void setUserStory(UserStory userStory) {
        this.userStory = userStory;
    }

    public Document getRequirement() {
        return requirement;
    }

    public void setRequirement(Document requirement) {
        this.requirement = requirement;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TestCase testCase = (TestCase) o;
        return Objects.equals(id, testCase.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
