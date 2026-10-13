package com.sdlc.platform.team.repository;

import com.sdlc.platform.team.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamRepository extends JpaRepository<Team, UUID> {

    List<Team> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    boolean existsByOrganizationIdAndName(UUID organizationId, String name);

    Optional<Team> findByOrganizationIdAndName(UUID organizationId, String name);

    @Query("SELECT tm.team FROM TeamMember tm WHERE tm.user.id = :userId ORDER BY tm.team.createdAt DESC")
    List<Team> findAllByUserId(@Param("userId") UUID userId);

    long countByOrganizationId(UUID organizationId);
}
