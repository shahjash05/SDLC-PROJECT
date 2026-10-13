package com.sdlc.platform.requirement.repository;

import com.sdlc.platform.requirement.model.StoryStatus;
import com.sdlc.platform.requirement.model.UserStory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserStoryRepository extends JpaRepository<UserStory, UUID> {

    List<UserStory> findByProjectIdOrderByStoryNumberAsc(UUID projectId);

    List<UserStory> findBySprintIdOrderByStoryNumberAsc(UUID sprintId);

    List<UserStory> findByProjectIdAndSprintIsNullOrderByStoryNumberAsc(UUID projectId);

    List<UserStory> findByProjectIdAndStatusOrderByStoryNumberAsc(UUID projectId, StoryStatus status);

    Optional<UserStory> findByProjectIdAndStoryNumber(UUID projectId, Integer storyNumber);

    long countByProjectId(UUID projectId);

    long countBySprintId(UUID sprintId);

    long countBySprintIdAndStatus(UUID sprintId, StoryStatus status);

    @Query("SELECT COALESCE(MAX(us.storyNumber), 0) FROM UserStory us WHERE us.project.id = :projectId")
    int findMaxStoryNumberByProjectId(@Param("projectId") UUID projectId);
}
