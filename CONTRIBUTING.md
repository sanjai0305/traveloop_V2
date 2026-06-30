# Contribution Guide — Traveloop V2

This document outlines the coding standards, branch conventions, and submission workflows for contributing to the Traveloop V2 project.

---

## 1. Branch Strategy

We follow a structured branching model for stable version releases:

* `main`: Represents production-ready, stable releases.
* `develop`: Integration branch for new features and patches.
* `feature/<name>`: Feature-specific branches branched off `develop`.
* `hotfix/<name>`: Quick production fixes branched off `main` and merged to both `main` and `develop`.

---

## 2. Commit Message Guidelines

To maintain a clean commit history, use the standard prefix formatting:

* **feat**: A new feature (e.g., `feat: add driver updates broadcast timeline`).
* **fix**: A bug fix (e.g., `fix: resolve duplicate key warnings in MyTrips mapping`).
* **docs**: Documentation adjustments (e.g., `docs: publish API specification sheet`).
* **style**: Visual style corrections (e.g., `style: adjust margin alignment in pass card`).
* **refactor**: Code reorganization without features/fixes (e.g., `refactor: clean up connection helper`).

---

## 3. Pull Request Process

1. Fork the repository and create your feature branch off `develop`.
2. Ensure your changes compile locally:
   ```bash
   npm run build
   ```
3. Open a Pull Request targeting the `develop` branch.
4. Provide a detailed summary of changes, screenshot assets of UI updates, and test validation logs.
5. Code reviews require approval from at least one core maintainer before merging.

---

## 4. Semantic Versioning

This project adheres to **Semantic Versioning (SemVer)** specifications:
`MAJOR.MINOR.PATCH`

* **MAJOR**: Incompatible API breaking adjustments (e.g., upgrading Mongoose schemas without backwards compatibility).
* **MINOR**: Backward-compatible feature additions (e.g., adding the new Driver Updates tab).
* **PATCH**: Backward-compatible bug corrections (e.g., fixing `getTravelStatus` ReferenceError).
