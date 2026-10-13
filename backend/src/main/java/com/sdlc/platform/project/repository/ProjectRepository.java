package com.sdlc.platform.project.repository;

import com.sdlc.platform.project.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    List<Project> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    List<Project> findByTeamIdOrderByCreatedAtDesc(UUID teamId);

    boolean existsByOrganizationIdAndProjectKey(UUID organizationId, String projectKey);

    Optional<Project> findByOrganizationIdAndProjectKey(UUID organizationId, String projectKey);

    @Query("SELECT p FROM Project p WHERE p.organization.id IN (" +
            "SELECT om.organization.id FROM OrganizationMember om WHERE om.user.id = :userId" +
            ") ORDER BY p.createdAt DESC")
    List<Project> findAllAccessibleToUser(@Param("userId") UUID userId);

    long countByOrganizationId(UUID organizationId);

    long countByTeamId(UUID teamId);
}
