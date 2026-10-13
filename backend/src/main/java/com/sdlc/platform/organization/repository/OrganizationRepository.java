package com.sdlc.platform.organization.repository;

import com.sdlc.platform.organization.model.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, UUID> {

    boolean existsBySlug(String slug);

    Optional<Organization> findBySlug(String slug);

    @Query("SELECT om.organization FROM OrganizationMember om WHERE om.user.id = :userId ORDER BY om.organization.createdAt DESC")
    List<Organization> findAllByUserId(@Param("userId") UUID userId);

    List<Organization> findAllByOrderByCreatedAtDesc();
}
