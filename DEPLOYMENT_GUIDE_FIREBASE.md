# Firebase CI/CD Deployment Guide

This guide provides instructions to connect your GitHub repository to Firebase and configure automated CI/CD deployments to Firebase Functions using GitHub Actions.

---

## 1. Creating a Firebase Project

If you do not have an existing Firebase Project, follow these steps to create one:

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Enter your project name (e.g., `traveloop-version-2`), accept terms, and click **Continue**.
4. (Optional) Enable Google Analytics for the project and click **Continue**.
5. Select your default Google Analytics account and click **Create project**. Wait for the project creation process to complete.
6. Since Firebase Functions requires the **Blaze (Pay-as-you-go)** billing plan, navigate to the bottom-left corner of the console and upgrade your billing plan from Spark to Blaze. (Note: Cloud Functions has a generous free tier, and you only pay for usage exceeding it).

---

## 2. Generating a Service Account Key (Recommended)

To authenticate the GitHub Actions runner securely without relying on legacy session tokens:

1. In the Firebase Console, click the **Gear icon (Settings)** next to "Project Overview" in the left sidebar and select **Project settings**.
2. Navigate to the **Service accounts** tab.
3. Click the **Generate new private key** button at the bottom of the page.
4. Click **Generate key** in the modal that appears.
5. A `.json` file containing your Service Account Credentials will be downloaded to your computer. Keep this file secure and **do not commit it to your git repository**.

---

## 3. Adding GitHub Secrets

To allow GitHub Actions to deploy to Firebase on your behalf:

1. Open your repository on GitHub.
2. Go to **Settings** -> **Secrets and variables** -> **Actions** in the left sidebar.
3. Click **New repository secret**.
4. Add the following secrets:
   - **`FIREBASE_SERVICE_ACCOUNT`**: Copy and paste the *entire* contents of the `.json` Service Account Key file you downloaded in Step 2.
   - **`FIREBASE_TOKEN`**: (Alternative/Legacy) If not using a Service Account, you can generate a CI token by running `npx firebase-tools login:ci` locally, authenticating in the browser, and copying the resulting token into this secret.
   
*Note: The GitHub Actions workflow is configured to prioritize `FIREBASE_SERVICE_ACCOUNT` if both secrets are present.*

---

## 4. Testing & Running Locally

Before deploying to production, you can run and test the Firebase Cloud Functions environment locally using the Firebase Emulator Suite.

### Prerequisites
Make sure Node.js (v20) and npm are installed on your machine.

### Installation
From the root of the project, navigate to the `functions` directory and install the dependencies:
```bash
cd functions
npm install
```

### Starting the Emulators
To start the local functions emulator:
```bash
npm run serve
```
This command starts the Cloud Functions emulator. By default, you can view the emulator dashboard at `http://localhost:4000` and access your functions API endpoints at:
`http://localhost:5001/<your-project-id>/us-central1/api`

For example, to test the sample endpoint:
```bash
curl http://localhost:5001/traveloop-version-2-83bd2/us-central1/api/hello?name=Traveler
```

---

## 5. Triggering Deployment via Git Push

Once the configuration files are committed and pushed to the `main` branch, the GitHub Actions workflow will handle deployment automatically.

1. Stage and commit the new files:
   ```bash
   git add .github/workflows/firebase.yml firebase.json .firebaserc functions/ DEPLOYMENT_GUIDE_FIREBASE.md
   git commit -m "feat: setup firebase functions and CI/CD deployment pipeline"
   ```
2. Push your changes to the `main` branch:
   ```bash
   git push origin main
   ```
3. Monitor the deployment progress:
   - Navigate to your repository on GitHub.
   - Click the **Actions** tab.
   - Select the **Firebase CI/CD Pipeline** workflow to inspect the build and deployment logs.
