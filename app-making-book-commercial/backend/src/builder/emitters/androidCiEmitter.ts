import type { AppSpec } from '../schema/appSpec';

/**
 * This is the actual "packing the APK" step. No Android SDK exists in
 * the sandbox that generates the source above — this workflow is what
 * turns that source into a real, installable APK, for free, using
 * GitHub Actions' hosted runners (which come with an Android SDK
 * preinstalled). Push the generated android/ folder to a repo, this
 * workflow runs automatically, and the APK is downloadable from the
 * Actions run's artifacts.
 */
export function emitAndroidCiWorkflow(spec: AppSpec): string {
    return `name: Build Android APK

on:
  push:
    paths:
      - 'android/**'
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      # GitHub's ubuntu-latest runner ships with an Android SDK already
      # installed — no separate SDK setup action needed for a basic build.
      - name: Grant execute permission for gradlew
        run: chmod +x android/gradlew || true

      - name: Generate Gradle wrapper if missing
        run: |
          cd android
          if [ ! -f gradlew ]; then
            gradle wrapper --gradle-version 8.7
          fi

      - name: Build debug APK
        working-directory: android
        run: ./gradlew assembleDebug

      - name: Build release AAB (unsigned)
        working-directory: android
        run: ./gradlew bundleRelease
        continue-on-error: true  # release build needs signing config you add yourself — see README

      - uses: actions/upload-artifact@v4
        with:
          name: ${spec.appName.replace(/\s+/g, '-')}-debug-apk
          path: android/app/build/outputs/apk/debug/*.apk

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: ${spec.appName.replace(/\s+/g, '-')}-release-aab
          path: android/app/build/outputs/bundle/release/*.aab
          if-no-files-found: ignore
`;
}
