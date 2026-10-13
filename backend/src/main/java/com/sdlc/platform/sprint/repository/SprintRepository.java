package com.sdlc.platform.sprint.repository;

import com.sdlc.platform.sprint.model.Sprint;
import com.sdlc.platform.sprint.model.SprintStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SprintRepository extends JpaRepository<Sprint, UUID> {

    List<Sprint> findByProjectIdOrderByCreatedAtDesc(UUID projectId);

    List<Sprint> findByProjectIdAndStatus(UUID projectId, SprintStatus status);

    boolean existsByProjectIdAndName(UUID projectId, String name);

    long countByProjectId(UUID projectId);

    Optional<Sprint> findByProjectIdAndStatusOrderByIdDesc(UUID projectId, SprintStatus status);
}
