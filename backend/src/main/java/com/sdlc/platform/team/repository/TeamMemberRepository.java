package com.sdlc.platform.team.repository;

import com.sdlc.platform.team.model.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, UUID> {

    Optional<TeamMember> findByTeamIdAndUserId(UUID teamId, UUID userId);

    List<TeamMember> findByTeamId(UUID teamId);

    boolean existsByTeamIdAndUserId(UUID teamId, UUID userId);

    long countByTeamId(UUID teamId);

    void deleteByTeamIdAndUserId(UUID teamId, UUID userId);
}
