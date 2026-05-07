-- =====================================================
-- PMT — Project Management Tool
-- Script de génération de la base de données
-- PostgreSQL 16+
-- =====================================================

-- Nettoyage (ordre inverse des dépendances)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS task_history CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- Table : users
-- =====================================================
CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- =====================================================
-- Table : projects
-- =====================================================
CREATE TABLE projects (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    created_by  BIGINT       NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_projects_creator
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_projects_created_by ON projects(created_by);

-- =====================================================
-- Table : project_members (association n-n avec rôle)
-- =====================================================
CREATE TABLE project_members (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    project_id  BIGINT       NOT NULL,
    role        VARCHAR(20)  NOT NULL CHECK (role IN ('ADMIN', 'MEMBER', 'OBSERVER')),
    joined_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pm_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT fk_pm_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT uq_project_member UNIQUE (user_id, project_id)
);

CREATE INDEX idx_pm_user    ON project_members(user_id);
CREATE INDEX idx_pm_project ON project_members(project_id);

-- =====================================================
-- Table : tasks
-- =====================================================
CREATE TABLE tasks (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(150) NOT NULL,
    description  TEXT,
    priority     VARCHAR(10)  NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    status       VARCHAR(15)  NOT NULL DEFAULT 'TODO'   CHECK (status   IN ('TODO', 'IN_PROGRESS', 'DONE')),
    due_date     DATE,
    project_id   BIGINT       NOT NULL,
    assignee_id  BIGINT,
    created_by   BIGINT       NOT NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tasks_project  FOREIGN KEY (project_id)  REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id) REFERENCES users(id)    ON DELETE SET NULL,
    CONSTRAINT fk_tasks_creator  FOREIGN KEY (created_by)  REFERENCES users(id)    ON DELETE RESTRICT
);

CREATE INDEX idx_tasks_project  ON tasks(project_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status   ON tasks(status);

-- =====================================================
-- Table : task_history
-- =====================================================
CREATE TABLE task_history (
    id             BIGSERIAL PRIMARY KEY,
    task_id        BIGINT       NOT NULL,
    user_id        BIGINT       NOT NULL,
    field_changed  VARCHAR(50)  NOT NULL,
    old_value      TEXT,
    new_value      TEXT,
    changed_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_history_task ON task_history(task_id);

-- =====================================================
-- Table : notifications
-- =====================================================
CREATE TABLE notifications (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    task_id     BIGINT,
    message     VARCHAR(255) NOT NULL,
    is_read     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notif_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_notif_user_unread ON notifications(user_id, is_read);

-- =====================================================
-- DONNÉES DE TEST
-- Mot de passe pour tous : "password" (hashé en BCrypt)
-- =====================================================

INSERT INTO users (username, email, password) VALUES
    ('alice',   'alice@pmt.com',   '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa'),
    ('bob',     'bob@pmt.com',     '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa'),
    ('charlie', 'charlie@pmt.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa');

INSERT INTO projects (name, description, created_by) VALUES
    ('Refonte site web',     'Migration du site corporate sur Next.js',  1),
    ('Application mobile',   'Application iOS/Android de la boutique',   2);

-- Alice (admin du projet 1), Bob (member), Charlie (observer)
INSERT INTO project_members (user_id, project_id, role) VALUES
    (1, 1, 'ADMIN'),
    (2, 1, 'MEMBER'),
    (3, 1, 'OBSERVER'),
    -- Bob (admin du projet 2), Alice (member)
    (2, 2, 'ADMIN'),
    (1, 2, 'MEMBER');

INSERT INTO tasks (name, description, priority, status, due_date, project_id, assignee_id, created_by) VALUES
    ('Maquette homepage',       'Créer les maquettes Figma',              'HIGH',   'DONE',        '2026-05-01', 1, 2, 1),
    ('Intégration HTML/CSS',    'Intégrer la homepage',                   'MEDIUM', 'IN_PROGRESS', '2026-05-15', 1, 2, 1),
    ('Mise en ligne staging',   'Déployer sur l''environnement de test',  'LOW',    'TODO',        '2026-06-01', 1, NULL, 1),
    ('Définir les écrans',      'Rédiger les specs produit',              'HIGH',   'TODO',        '2026-05-20', 2, 1, 2),
    ('Configurer CI/CD',        'Github Actions + TestFlight',            'MEDIUM', 'TODO',        '2026-06-10', 2, 2, 2);

INSERT INTO task_history (task_id, user_id, field_changed, old_value, new_value) VALUES
    (1, 1, 'status',   'TODO',        'IN_PROGRESS'),
    (1, 1, 'status',   'IN_PROGRESS', 'DONE'),
    (2, 1, 'assignee', NULL,          'bob');

INSERT INTO notifications (user_id, task_id, message) VALUES
    (2, 2, 'Vous avez été assigné à la tâche "Intégration HTML/CSS"'),
    (1, 4, 'Vous avez été assigné à la tâche "Définir les écrans"');
