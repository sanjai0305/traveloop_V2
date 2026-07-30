# Firebase Environment Variables Template

Below is the environment configuration required for Firebase Admin SDK initialization using environment variables.

## Environment Variable Schema

```env
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-firebase-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkq...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_ID=123456789012345678901
```

## Parsing Rules
- **FIREBASE_PRIVATE_KEY**: Must be wrapped inside double quotes to protect the multi-line backslash characters. Newlines must be represented literally as `\n` in the environment configuration.
