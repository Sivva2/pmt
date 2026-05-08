# PMT — Project Management Tool

Application full-stack de gestion de projets collaborative, développée dans le cadre de l'étude de cas du bloc RNCP Niveau 7 "Intégration, industrialisation et déploiement de logiciel" — Groupe ESIEA INTECH / Visiplus.

## Sommaire

- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Démarrage rapide avec Docker](#démarrage-rapide-avec-docker)
- [Installation pour le développement](#installation-pour-le-développement)
- [Tests et couverture](#tests-et-couverture)
- [Pipeline CI/CD](#pipeline-cicd)
- [Images Docker Hub](#images-docker-hub)
- [Structure du projet](#structure-du-projet)

## Stack technique

**Backend**
- Java 21
- Spring Boot 3.2
- Spring Data JPA
- PostgreSQL 16
- Maven
- JUnit 5 + JaCoCo

**Frontend**
- Angular 18 (composants standalone, signals)
- TypeScript 5
- Jest + ts-jest

**Infrastructure**
- Docker / Docker Compose
- Nginx (reverse proxy frontend)
- GitHub Actions (CI/CD)
- Docker Hub (registry)

## Architecture

L'application suit une architecture trois tiers classique :

- **Frontend Angular** servi par Nginx, qui consomme l'API REST exposée par le backend.
- **Backend Spring Boot** qui expose les endpoints REST et orchestre la logique métier.
- **Base de données PostgreSQL** persistante, accédée via Spring Data JPA.

Les trois composants sont conteneurisés et orchestrés par Docker Compose.

```
┌─────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  Frontend       │       │  Backend         │       │  PostgreSQL      │
│  Angular 18     │ ────▶ │  Spring Boot 3.2 │ ────▶ │  16              │
│  Nginx          │       │  Java 21         │       │                  │
│  Port 80        │       │  Port 8080       │       │  Port 5432       │
└─────────────────┘       └──────────────────┘       └──────────────────┘
```

## Démarrage rapide avec Docker

C'est la méthode la plus rapide pour lancer l'application complète. Aucun outil de développement n'est requis sur la machine, juste Docker.

### Prérequis

- Docker Desktop 4.x ou Docker Engine 20.10+
- Docker Compose v2

### Démarrage

Depuis la racine du projet :

```bash
docker compose up -d
```

Trois conteneurs démarrent :
- `pmt-postgres` (base de données)
- `pmt-backend` (API Spring Boot)
- `pmt-frontend` (interface Angular servie par Nginx)

L'application est accessible sur :
- **Frontend** : http://localhost
- **Backend (API)** : http://localhost:8080/api
- **Base de données** : localhost:5432 (utilisateur `pmt`, mot de passe `pmt`)

### Arrêt

```bash
docker compose down
```

Pour aussi supprimer les données de la base :

```bash
docker compose down -v
```

## Installation pour le développement

### Backend

Prérequis : JDK 21 et Maven 3.9+

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Le backend démarre sur http://localhost:8080.

Pour la base de données en local, lance juste le conteneur Postgres :

```bash
docker compose up -d postgres
```

### Frontend

Prérequis : Node.js 20+ et npm 10+

```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

Le frontend est accessible sur http://localhost:4200 et proxifie automatiquement les appels API vers le backend.

## Tests et couverture

### Backend

```bash
cd backend
mvn verify
```

Cette commande exécute tous les tests unitaires et d'intégration, puis génère le rapport de couverture JaCoCo dans `backend/target/site/jacoco/index.html`.

**Résultats actuels** : 36 tests, couverture supérieure à 60% sur les instructions et les branches (critère du bloc RNCP).

### Frontend

```bash
cd frontend
npm test
```

Pour la couverture :

```bash
npm test -- --coverage
```

Le rapport est généré dans `frontend/coverage/lcov-report/index.html`.

**Résultats actuels** : 18 tests, **couverture supérieure à 98%** sur les services métiers.

## Pipeline CI/CD

Le projet utilise GitHub Actions. Le fichier de configuration est `.github/workflows/ci.yml`.

Trois jobs s'enchaînent automatiquement à chaque push sur `main` :

1. **Backend — Build & Test** : compile le projet Maven, exécute les tests JUnit, génère le rapport JaCoCo, archive le JAR.
2. **Frontend — Build & Test** : installe les dépendances npm, exécute les tests Jest avec couverture, build le bundle de production Angular.
3. **Docker — Build & Push to Docker Hub** : build les images backend et frontend, les tag (`latest` + SHA du commit), et les push sur Docker Hub.

Sur les pull requests, seuls les deux premiers jobs s'exécutent (pas de push d'image).

### Secrets requis

Les secrets suivants doivent être configurés dans Settings → Secrets and variables → Actions :

- `DOCKERHUB_USERNAME` : identifiant Docker Hub
- `DOCKERHUB_TOKEN` : token d'accès personnel Docker Hub

## Images Docker Hub

Les images sont publiées automatiquement à chaque commit sur `main`.

- Backend : `sivva2/pmt-backend:latest`
- Frontend : `sivva2/pmt-frontend:latest`

Pour récupérer et lancer la dernière version sans cloner le repo :

```bash
docker pull sivva2/pmt-backend:latest
docker pull sivva2/pmt-frontend:latest
```

## Structure du projet

```
pmt/
├── .github/
│   └── workflows/
│       └── ci.yml                    # Pipeline GitHub Actions
├── backend/
│   ├── src/
│   │   ├── main/                     # Code Spring Boot
│   │   └── test/                     # Tests JUnit + JaCoCo
│   ├── Dockerfile
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                 # Services, guards, interceptors
│   │   │   └── features/             # Composants Angular standalone
│   │   └── __mocks__/                # Mocks pour ts-jest
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── jest.config.js
│   └── package.json
├── docs/
│   ├── database-schema.md            # Schéma de la base de données
│   └── schema.sql                    # Script SQL d'initialisation
├── docker-compose.yml
└── README.md
```

## Fonctionnalités

- Authentification (inscription, connexion, déconnexion) avec mot de passe BCrypt
- Gestion de projets (création, consultation, listing)
- Gestion des membres et des rôles (ADMIN, MEMBER, OBSERVER)
- Tableau de bord des tâches (kanban)
- Création, modification, suppression et historique des tâches
- Système de notifications

## Auteur

Kevin Abaskaran — Étude de cas PMT — Bloc RNCP Niveau 7 (Visiplus / ESIEA INTECH)