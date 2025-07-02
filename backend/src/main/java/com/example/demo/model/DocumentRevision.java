package com.example.demo.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.time.ZonedDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "document_revisions")
public class DocumentRevision {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "content_diff", nullable = false, columnDefinition = "text")
    private String contentDiff;

    @Column(name = "revision_number", nullable = false)
    private Integer revisionNumber;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private ZonedDateTime createdAt;

    @Override
    public String toString() {
        return "DocumentRevision{" +
                "id=" + id +
                ", documentId=" + (document != null ? document.getId() : null) +
                ", userId=" + (user != null ? user.getId() : null) +
                ", revisionNumber=" + revisionNumber +
                ", createdAt=" + createdAt +
                '}';
    }
} 