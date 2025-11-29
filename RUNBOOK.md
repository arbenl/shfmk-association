# SHFMK Scanner Operator Runbook

This document provides instructions for building and deploying the SHFMK Scanner application for both Android and iOS.

## 1. Project Setup

Follow these steps to set up the project on a clean machine.

### 1.1. Prerequisites

- [Node.js](https://nodejs.org/) (LTS version)
- [pnpm](https://pnpm.io/installation)
- [EAS CLI](https://docs.expo.dev/eas/getting-started/) (`pnpm install -g eas-cli`)
- Apple Developer account (for iOS builds)

### 1.2. Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd shfmk-association
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

## 2. Local Development

To run the app in a development environment with Expo Go, use the following commands:

-   **Start the development server:**

    ```bash
    pnpm --filter scanner start
    ```

-   **Run on Android:**

    ```bash
    pnpm --filter scanner start --android
    ```

-   **Run on iOS:**

    ```bash
    pnpm --filter scanner start --ios
    ```

## 3. Environment Configuration (Public Key)

The scanner requires a public PEM-encoded key to verify QR code signatures. This is provided via the `EXPO_PUBLIC_QR_PUBLIC_KEY_PEM` environment variable.

### 3.1. Local Development

For local development, you can create a `.env` file in the `apps/scanner` directory:

```bash
# apps/scanner/.env
EXPO_PUBLIC_QR_PUBLIC_KEY_PEM="-----BEGIN PUBLIC KEY-----\n...your public key...\n-----END PUBLIC KEY-----"
```

If this variable is not set, the app will enter a demo mode, generating a temporary key pair on each launch.

### 3.2. EAS Builds (Production & Preview)

For EAS builds, the public key must be registered as an **EAS Secret**. This ensures the key is available at build time without committing it to the repository.

1.  **Set the secret:**

    Run the following command in the `apps/scanner` directory. Replace the placeholder with your actual PEM-encoded public key.

    ```bash
    eas secret create --scope project --name EXPO_PUBLIC_QR_PUBLIC_KEY_PEM --value "-----BEGIN PUBLIC KEY-----\n...your public key...\n-----END PUBLIC KEY-----"
    ```

2.  **Verify the secret:**

    To ensure the secret is set correctly, you can list the secrets for the project:

    ```bash
    eas secret:list
    ```

## 4. Building the Standalone App

EAS Build is used to create standalone binaries for Android and iOS.

### 4.1. Android Build (APK)

To build an APK for internal distribution or direct installation:

1.  **Log in to your Expo account:**

    ```bash
    eas login
    ```

2.  **Run the build:**

    Navigate to `apps/scanner` and run the following command:

    ```bash
    eas build --profile preview --platform android
    ```

    This will generate a downloadable APK file.

### 4.2. Android Build (App Bundle for Play Store)

To build an App Bundle for submission to the Google Play Store:

```bash
eas build --profile production --platform android
```

### 4.3. iOS Build (TestFlight)

Building for iOS requires a configured Apple Developer account.

1.  **Configure EAS for iOS:**

    EAS will guide you through the process of setting up your Apple Developer account, creating provisioning profiles, and certificates.

    ```bash
eas build --profile production --platform ios
    ```

2.  **Submit to TestFlight:**

    After the build is complete, you can submit it to TestFlight:

    ```bash
eas submit --platform ios --latest
    ```

## 5. Acceptance Tests

After a successful build, perform the following checks on a physical device:

### 5.1. Android (APK)

-   [ ] Install the APK on a physical Android device.
-   [ ] Open the app and grant camera permissions.
-   [ ] Verify the scanner view appears.
-   [ ] Scan a valid QR code and confirm the "Valid" status.
-   [ ] Scan the same QR code again and confirm the "Already checked-in" status.
-   [ ] Scan an invalid QR code and confirm the "Invalid token" status.
-   [ ] Verify the check-in list is populated.
-   [ ] Export the check-in list and verify the generated JSON.

### 5.2. iOS (TestFlight)

-   [ ] Install the app via TestFlight on a physical iPhone.
-   [ ] Open the app and grant camera permissions.
-   [ ] Verify the scanner view appears.
-   [ ] Scan a valid QR code and confirm the "Valid" status.
-   [ ] Scan the same QR code again and confirm the "Already checked-in" status.
-   [ ] Scan an invalid QR code and confirm the "Invalid token" status.
-   [ ] Verify the check-in list is populated.
-   [ ] Export the check-in list and verify the generated content.