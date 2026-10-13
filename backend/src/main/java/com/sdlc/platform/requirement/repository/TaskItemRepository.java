package com.sdlc.platform.requirement.repository;

import com.sdlc.platform.requirement.model.TaskItem;
import com.sdlc.platform.requirement.model.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskItemRepository extends JpaRepository<TaskItem, UUID> {

    List<TaskItem> findByStoryIdOrderByCreatedAtAsc(UUID storyId);

    long countByStoryId(UUID storyId);

    long countByStoryIdAndStatus(UUID storyId, TaskStatus status);

    void deleteAllByStoryId(UUID storyId);
}
