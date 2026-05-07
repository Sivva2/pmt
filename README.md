# PMT — Project Management Tool

[![CI/CD](https://github.com/Sivva2/pmt/actions/workflows/ci.yml/badge.svg)](https://github.com/Sivva2/pmt/actions/workflows/ci.yml)

Plateforme de gestion de projet collaboratif destinée aux équipes de développement logiciel. Permet de planifier, suivre et collaborer sur des projets avec gestion fine des rôles, tableau Kanban, historique et notifications.

---

## 📚 Table des matières

- [Stack technique](#-stack-technique)
- [Architecture](#%EF%B8%8F-architecture)
- [Fonctionnalités](#-fonctionnalités)
- [Démarrage rapide (Docker)](#-démarrage-rapide-docker)
- [Développement local](#-développement-local)
- [Tests & Couverture](#-tests--couverture)
- [Pipeline CI/CD](#-pipeline-cicd)
- [Déploiement en production](#-déploiement-en-production)
- [Documentation API](#-documentation-api)
- [Schéma de base de données](#-schéma-de-base-de-données)
- [Structure du projet](#-structure-du-projet)

---

## 🛠 Stack technique

| Couche           | Technologie                                        |
|------------------|----------------------------------------------------|
| Frontend         | Angular 18 (standalone components + signals)       |
| UI               | Angular Material + Angular CDK (drag & drop)       |
| Backend          | Java 21 + Spring Boot 3.3 (Web, Data JPA, Validation) |
| Base de données  | PostgreSQL 16 (H2 en dev/tests)                    |
| Build            | Maven 3.9 (back) / npm (front)                     |
| Tests backend    | JUnit 5 + Mockito + AssertJ + Jacoco               |
| Tests frontend   | Jest + `@angular-builders/jest`                    |
| Conteneurisation | Docker + Docker Compose                            |
| CI/CD            | GitHub Actions → Docker Hub                        |

---

## 🏗️ Architecture

```
┌─────────────────┐      HTTP/JSON      ┌──────────────────┐     JDBC     ┌──────────────┐
│  Angular 18 SPA │ ───────────────────▶│  Spring Boot API │ ────────────▶│ PostgreSQL 16│
│   (nginx :80)   │◀─── /api proxy ─────│    (port 8080)   │              │  (port 5432) │
└─────────────────┘                     └──────────────────┘              └──────────────┘
```

---

## ✨ Fonctionnalités

### Authentification
- Inscription et connexion par email + mot de passe
- Hachage BCrypt des mots de passe
- Session persistée côté client via `localStorage`

### Gestion des projets
- Création de projets (le créateur devient automatiquement `ADMIN`)
- Liste des projets auxquels l'utilisateur appartient
- Invitation de membres par email avec un rôle (`ADMIN`, `MEMBER`, `OBSERVER`)

### Tableau Kanban
- Tâches organisées en trois colonnes : **À faire**, **En cours**, **Terminé**
- Drag & drop pour changer le statut (Angular CDK)
- Création / édition / suppression avec dialog Material
- Champs : nom, description, priorité, date limite, assigné

### Historique & notifications
- Historique automatique de toutes les modifications (champ, ancienne/nouvelle valeur, auteur, date)
- Notifications visuelles lors d'une assignation ou d'une modification
- Badge de notifications non lues dans la topbar

### Matrice des rôles

| Action                      | ADMIN | MEMBER | OBSERVER |
|-----------------------------|:-----:|:------:|:--------:|
| Voir le projet & les tâches |   ✅   |   ✅    |    ✅     |
| Créer / modifier une tâche  |   ✅   |   ✅    |    ❌     |
| Supprimer une tâche         |   ✅   |   ✅    |    ❌     |
| Inviter un membre           |   ✅   |   ❌    |    ❌     |

---

## 🚀 Démarrage rapide (Docker)

**Prérequis** : Docker 24+ et Docker Compose v2.

```bash
# Cloner le repo
git clone https://github.com/Sivva2/pmt.git
cd pmt

# Lancer la stack complète (DB + backend + frontend)
docker compose up -d --build
```

Une fois les healthchecks passés :

- Frontend : <http://localhost:4200>
- Backend API : <http://localhost:8080/api>
- PostgreSQL : `localhost:5432` (user `pmt` / password `pmt`)

**Comptes de test** (chargés via `docs/schema.sql`, mot de passe `password`) :

| Email              | Rôle par défaut                          |
|--------------------|------------------------------------------|
| alice@pmt.com      | ADMIN du projet « Refonte site web »     |
| bob@pmt.com        | ADMIN du projet « Application mobile »   |
| charlie@pmt.com    | OBSERVER du projet « Refonte site web »  |

> ℹ️ Les données de test sont injectées automatiquement au premier démarrage de PostgreSQL via le volume `docker-entrypoint-initdb.d`. Pour repartir de zéro : `docker compose down -v && docker compose up -d --build`.

---

## 💻 Développement local

### Backend (sans Docker)

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Profil `dev` → H2 en mémoire, console H2 accessible sur <http://localhost:8080/h2-console>.

### Frontend (sans Docker)

```bash
cd frontend
npm install
npm start
```

Accessible sur <http://localhost:4200>. Par défaut, l'URL de l'API est `http://localhost:8080/api`.

---

## 🧪 Tests & Couverture

### Backend — JUnit + Jacoco

```bash
cd backend
./mvnw verify
```

Le rapport est généré dans `backend/target/site/jacoco/index.html`. Le seuil de **60% (instructions et branches)** est bloquant : la build échoue en dessous.

### Frontend — Jest

```bash
cd frontend
npm run test:coverage
```

Le rapport HTML est généré dans `frontend/coverage/lcov-report/index.html`. Seuils Jest : **60%** sur lignes, branches, fonctions et statements.

### Tests d'intégration

Un test end-to-end (`ApiIntegrationTest`) monte un contexte Spring complet avec H2 et valide le parcours : `register → login → create project → invite member → list members`.

---

## 🔄 Pipeline CI/CD

La pipeline GitHub Actions (`.github/workflows/ci.yml`) se déclenche sur chaque `push` et `pull_request` vers `main`/`develop`.

**Trois jobs séquentiels :**

1. **`backend-test`** — `mvn verify` avec Jacoco, publie le rapport de couverture et le JAR.
2. **`frontend-test`** — `npm ci` + `npm run test:ci` + `npm run build`, publie le coverage Jest et le bundle de prod.
3. **`docker-publish`** — déclenché uniquement sur push `main` : build et push des images Docker `pmt-backend` et `pmt-frontend` sur Docker Hub.

### Secrets GitHub requis

Dans **Settings → Secrets and variables → Actions** :

| Secret               | Description                                    |
|----------------------|------------------------------------------------|
| `DOCKERHUB_USERNAME` | Nom d'utilisateur Docker Hub                   |
| `DOCKERHUB_TOKEN`    | Access Token Docker Hub (pas le mot de passe)  |

---

## 🚢 Déploiement en production

### Option 1 — Pull des images depuis Docker Hub

```bash
# 1. Créer un fichier .env
cat > .env <<EOF
DOCKERHUB_USER=sivva2
TAG=latest
EOF

# 2. Récupérer les dernières images et lancer
docker compose pull
docker compose up -d
```

### Option 2 — Déploiement sur un VPS (exemple OVH)

```bash
# Connexion
ssh user@vps.example.com

# Prérequis : installer Docker Engine + Docker Compose
curl -fsSL https://get.docker.com | sh

# Cloner le repo et lancer
git clone https://github.com/Sivva2/pmt.git
cd pmt
docker compose up -d
```

Pour exposer en HTTPS, placer un reverse proxy (nginx / Traefik / Caddy) devant le service `frontend` (port `4200`) avec un certificat Let's Encrypt.

### Commandes utiles

```bash
# Voir les logs
docker compose logs -f backend
docker compose logs -f frontend

# Redémarrer un service
docker compose restart backend

# Mettre à jour avec les dernières images
docker compose pull && docker compose up -d

# Sauvegarder la base de données
docker compose exec db pg_dump -U pmt pmt > backup-$(date +%F).sql

# Tout arrêter et supprimer les données
docker compose down -v
```

---

## 📖 Documentation API

L'authentification se fait sans Spring Security (pas de JWT). Après `login`/`register`, le frontend stocke l'ID utilisateur et l'envoie dans le header **`X-User-Id`** à chaque requête protégée (injection par l'`authInterceptor` Angular).

### Endpoints

| Méthode | Endpoint                             | Description                        | Header requis |
|---------|--------------------------------------|------------------------------------|:-------------:|
| POST    | `/api/auth/register`                 | Créer un compte                    |       ❌       |
| POST    | `/api/auth/login`                    | Se connecter                       |       ❌       |
| GET     | `/api/projects`                      | Liste mes projets                  |       ✅       |
| POST    | `/api/projects`                      | Créer un projet                    |       ✅       |
| GET     | `/api/projects/{id}`                 | Détail d'un projet                 |       ✅       |
| GET     | `/api/projects/{id}/members`         | Liste des membres                  |       ✅       |
| POST    | `/api/projects/{id}/members`         | Inviter un membre (ADMIN)          |       ✅       |
| GET     | `/api/projects/{projectId}/tasks`    | Tâches d'un projet                 |       ✅       |
| POST    | `/api/projects/{projectId}/tasks`    | Créer une tâche (MEMBER+)          |       ✅       |
| PUT     | `/api/tasks/{id}`                    | Modifier une tâche (MEMBER+)       |       ✅       |
| DELETE  | `/api/tasks/{id}`                    | Supprimer une tâche (MEMBER+)      |       ✅       |
| GET     | `/api/tasks/{id}/history`            | Historique d'une tâche             |       ✅       |
| GET     | `/api/notifications`                 | Mes notifications                  |       ✅       |
| GET     | `/api/notifications/unread-count`    | Nombre de notifications non lues   |       ✅       |
| PUT     | `/api/notifications/{id}/read`       | Marquer comme lue                  |       ✅       |

### Exemples cURL

```bash
# Inscription
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"dave","email":"dave@pmt.com","password":"password"}'

# Création d'un projet (userId=1)
curl -X POST http://localhost:8080/api/projects \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 1" \
  -d '{"name":"Mon projet","description":"Description"}'

# Liste des tâches d'un projet
curl http://localhost:8080/api/projects/1/tasks -H "X-User-Id: 1"
```

---

## 🗄 Schéma de base de données

Voir [`docs/database-schema.md`](docs/database-schema.md) pour le diagramme Mermaid complet et la documentation des formes normales.

Le script DDL+DML est disponible dans [`docs/schema.sql`](docs/schema.sql).

**Entités** : `users`, `projects`, `project_members`, `tasks`, `task_history`, `notifications`.

---

## 📁 Structure du projet

```
pmt/
├── backend/                        # Spring Boot 3.3 + Java 21
│   ├── src/main/java/.../pmt/
│   │   ├── config/                 # CORS
│   │   ├── controller/             # REST controllers
│   │   ├── dto/                    # Records Java 21
│   │   ├── entity/                 # Entités JPA + enums
│   │   ├── exception/              # Exceptions + GlobalExceptionHandler
│   │   ├── repository/             # Spring Data JPA
│   │   └── service/                # Logique métier + RBAC
│   ├── src/main/resources/
│   │   └── application.yml         # Profils dev / prod / test
│   ├── src/test/java/              # Tests unitaires + intégration
│   ├── Dockerfile                  # Multi-stage Maven → JRE Alpine
│   └── pom.xml                     # Jacoco seuil 60%
│
├── frontend/                       # Angular 18 standalone + signals
│   ├── src/app/
│   │   ├── core/
│   │   │   ├── guards/             # authGuard
│   │   │   ├── interceptors/       # authInterceptor (X-User-Id)
│   │   │   ├── models/             # Types TypeScript
│   │   │   └── services/           # Auth, Project, Task, Notification
│   │   ├── features/
│   │   │   ├── auth/               # login + register
│   │   │   ├── projects/           # list + create + detail
│   │   │   └── tasks/              # board Kanban + form + history
│   │   └── shared/components/      # Notification bell
│   ├── jest.config.js              # Seuils Jest 60%
│   ├── Dockerfile                  # Multi-stage Node → nginx
│   └── nginx.conf                  # Proxy /api + SPA routing
│
├── docs/
│   ├── database-schema.md          # MCD + formes normales
│   └── schema.sql                  # DDL + données de test
│
├── .github/workflows/ci.yml        # Pipeline CI/CD complète
├── docker-compose.yml              # Orchestration DB + back + front
└── README.md
```

---

## 📝 Licence

Projet pédagogique réalisé dans le cadre du **Titre RNCP Niveau 7 – Expert en Ingénierie du Logiciel** (Groupe ESIEA INTECH).

**Auteur** : Sivva (Kevin Abaskaran) — 2026
