# Git Ignore Configuration Changes

This document lists the additions made to Git ignore configurations to prevent accidental commits of Firebase keys or JSON configuration sheets.

## 1. Modified Files
- `Backend/.gitignore`
- `.gitignore` (Root)

## 2. Added Patterns
The following patterns were added to the bottom of both `.gitignore` configurations:
```gitignore
# Firebase credentials
serviceAccountKey.json
*.json
Backend/serviceAccountKey.json
Backend/config/serviceAccountKey.json
```

## 3. Results
- `Backend/serviceAccountKey.json` is completely ignored by Git.
- `git status` no longer lists the key file as an untracked or modified file.
