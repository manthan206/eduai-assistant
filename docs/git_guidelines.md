# Git Commit & Branching Guidelines

Use these guidelines to maintain a clean git history for your repository.

## 1. Commit Message Standard
We follow the **Conventional Commits** specification:
- `feat`: A new feature (e.g. `feat: add SSE streaming to chat endpoint`)
- `fix`: A bug fix (e.g. `fix: resolve race conditions in SQLite database`)
- `docs`: Documentation changes (e.g. `docs: update AWS deployment steps in README`)
- `style`: Changes that do not affect the meaning of the code (e.g. formatting)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `chore`: Updating build scripts, dependencies, configuration, etc.

---

## 2. Commit Sequence Suggestion

Here is a recommended commit sequence for this project:

```bash
# Commit 1: Project setup and configurations
git commit -m "chore: initialize project structure with root configs, docker configs, and dotenv"

# Commit 2: Backend development
git commit -m "feat(backend): implement auth routing, database models, and openai integration with fallback streaming"

# Commit 3: Frontend framework implementation
git commit -m "feat(frontend): configure tailwind styles, routing guards, and authentication state"

# Commit 4: Frontend dashboard and pages
git commit -m "feat(frontend): build landing page, auth forms, and interactive streaming chat dashboard"

# Commit 5: Full integration & documentation
git commit -m "docs: finalize concept notes, project reports, and README configuration"
```

---

## 3. Recommended Branch Workflow
1. **`main`**: Production-ready branch. Only merge tested pull requests here.
2. **`dev`**: Integration branch for ongoing feature compilation.
3. **`feature/...`**: Short-lived branches created for specific files/modules (e.g., `feature/sse-streaming`).
