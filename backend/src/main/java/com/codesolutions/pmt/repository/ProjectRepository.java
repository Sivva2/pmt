package com.codesolutions.pmt.repository;

import com.codesolutions.pmt.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    @Query("""
        SELECT DISTINCT p FROM Project p
        LEFT JOIN ProjectMember pm ON pm.project = p
        WHERE p.createdBy.id = :userId OR pm.user.id = :userId
        ORDER BY p.createdAt DESC
    """)
    List<Project> findAllByUserId(Long userId);
}
