# Schéma de base de données — PMT

## Entités identifiées

| Entité | Description |
|--------|-------------|
| `users` | Comptes utilisateurs de la plateforme |
| `projects` | Projets créés par les utilisateurs |
| `project_members` | Association user ↔ project avec un rôle (table de liaison) |
| `tasks` | Tâches appartenant à un projet |
| `task_history` | Historique des modifications de chaque tâche |
| `notifications` | Notifications destinées à un utilisateur |

## Relations

- `users` **1,1 — 0,N** `projects` (un projet a un créateur)
- `users` **0,N — 0,N** `projects` via `project_members` (rôles : ADMIN, MEMBER, OBSERVER)
- `projects` **1,1 — 0,N** `tasks`
- `users` **1,1 — 0,N** `tasks` (assignation — optionnelle, donc 0,1)
- `tasks` **1,1 — 0,N** `task_history`
- `users` **1,1 — 0,N** `task_history` (qui a fait la modification)
- `users` **1,1 — 0,N** `notifications`

## Formes normales

- **1NF** : toutes les colonnes sont atomiques (pas de liste dans une cellule).
- **2NF** : toutes les tables ont une clé primaire simple (`id` BIGSERIAL) ; pas de dépendance partielle.
- **3NF** : aucune dépendance transitive. L'information dérivée (ex. nombre de membres d'un projet) n'est pas stockée.

## Diagramme Mermaid

```mermaid
erDiagram
    users ||--o{ projects : "creates"
    users ||--o{ project_members : "has"
    projects ||--o{ project_members : "has"
    projects ||--o{ tasks : "contains"
    users ||--o{ tasks : "assigned to"
    tasks ||--o{ task_history : "has"
    users ||--o{ task_history : "performs"
    users ||--o{ notifications : "receives"

    users {
        BIGSERIAL id PK
        VARCHAR username UK
        VARCHAR email UK
        VARCHAR password
        TIMESTAMP created_at
    }

    projects {
        BIGSERIAL id PK
        VARCHAR name
        TEXT description
        BIGINT created_by FK
        TIMESTAMP created_at
    }

    project_members {
        BIGSERIAL id PK
        BIGINT user_id FK
        BIGINT project_id FK
        VARCHAR role
        TIMESTAMP joined_at
    }

    tasks {
        BIGSERIAL id PK
        VARCHAR name
        TEXT description
        VARCHAR priority
        VARCHAR status
        DATE due_date
        BIGINT project_id FK
        BIGINT assignee_id FK
        BIGINT created_by FK
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    task_history {
        BIGSERIAL id PK
        BIGINT task_id FK
        BIGINT user_id FK
        VARCHAR field_changed
        TEXT old_value
        TEXT new_value
        TIMESTAMP changed_at
    }

    notifications {
        BIGSERIAL id PK
        BIGINT user_id FK
        BIGINT task_id FK
        VARCHAR message
        BOOLEAN is_read
        TIMESTAMP created_at
    }
```

## Énumérations

- **role** : `ADMIN`, `MEMBER`, `OBSERVER`
- **priority** : `LOW`, `MEDIUM`, `HIGH`
- **status** : `TODO`, `IN_PROGRESS`, `DONE`
