package com.sdlc.platform.document.repository;

import com.sdlc.platform.document.model.Document;
import com.sdlc.platform.document.model.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {
    List<Document> findByProjectIdOrderByUpdatedAtDesc(UUID projectId);
    List<Document> findByProjectIdAndTypeOrderByUpdatedAtDesc(UUID projectId, DocumentType type);
    boolean existsByProjectIdAndTitle(UUID projectId, String title);
}
