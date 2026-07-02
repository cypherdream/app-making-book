        android:allowBackup="false"
                android:icon="@mipmap/ic_launcher"
                        android:label="@string/app_name"
                                android:roundIcon="@mipmap/ic_launcher_round"
                                        android:supportsRtl="true"
                                                android:theme="@style/Theme.MasterApp"
                                                        android:networkSecurityConfig="@xml/network_security_config">

                                                                <activity
                                                                            android:name=".MainActivity"
                                                                                        android:exported="true">
                                                                                                    <intent-filter>
                                                                                                                    <action android:name="android.intent.action.MAIN" />
                                                                                                                                    <category android:name="android.intent.category.LAUNCHER" />
                                                                                                                                                </intent-filter>
                                                                                                                                                        </activity>

                                                                                                                                                                <activity
                                                                                                                                                                            android:name=".SecureDataDashboardActivity"
                                                                                                                                                                                        android:exported="false" />

                                                                                                                                                                                                <service
                                                                                                                                                                                                            android:name=".BackgroundTelemetryService"
                                                                                                                                                                                                                        android:exported="false" />

                                                                                                                                                                                                                            </application>
                                                                                                                                                                                                                            </manifest># 📱 Week 1, Day 1: Android Studio IDE, SDK Tooling, and Manifest Configurations

> **Progress Tracker:** 🟢 Day 1 of 14 (7%)  
> **Core Objective:** Establish the architecture of a native Android application package (.apk) from the ground up.

---

## 🏗️ 1. The Anatomy of an Android Application (.APK)

An Android application package (`.apk`) is essentially a specialized zip archive containing compiled code, resources, assets, and structural instructions. When a mobile operating system executes an app, it relies on a strict directory structure to understand what to run.



### 📂 Key System Directories:
* **`src/main/java/` or `src/main/kotlin/`**: Houses the operational logic scripts (Activities, Services, Utilities).
* **`src/main/res/`**: The resource repository.
  * `/layout/`: Holds the user interface configuration files (XML or Compose declarations).
    * `/values/`: Holds universal static strings, color palettes (`colors.xml`), and theme styles.
    * **`build.gradle` (Project & Module)**: Configures the compilation rules, dependencies, source libraries, and target software development kits (SDK).

    ---

    ## 📋 2. The Android Manifest File (`AndroidManifest.xml`)

    The `AndroidManifest.xml` is the single most critical structural file in any Android application. It acts as the gatekeeper and structural roadmap that instructs the Android operating system on how to manage the application.

    ### 🔑 Critical Manifest Operations:
    1. **Declaring Core Components**: Every Activity (screen), Service (background task), and Broadcast Receiver must be registered here, or the system will crash when trying to open them.
    2. **Requesting Security Permissions**: Informs the user and the operating system what device features the app requires access to (e.g., Camera, Internet, Storage).
    3. **Defining the App Launch Point**: Specifies which screen opens first when the user taps the app icon.

    #### 💻 Structured Native Manifest Blueprint Sample:
    ```xml
    <?xml version="1.0" encoding="utf-8"?>
    <manifest xmlns:android="[http://schemas.android.com/apk/res/android](http://schemas.android.com/apk/res/android)"
        package="com.master.two_week_app">

            <uses-permission android:name="android.permission.INTERNET" />

                    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

                        <application
                                android:allowBackup="true"
                                        android:icon="@mipmap/ic_launcher"
                                                android:label="Master App Core"
                                                        android:theme="@style/Theme.AppCompat">

                                                                <activity 
                                                                            android:name=".MainActivity"
                                                                                        android:exported="true">

                                                                                                                <intent-filter>
                                                                                                                                <action android:name="android.intent.action.MAIN" />
                                                                                                                                                <category android:name="android.intent.category.LAUNCHER" />
                                                                                                                                                            </intent-filter>

                                                                                                                                                                                </activity>

                                                                                                                                                                                    </application>

                                                                                                                                                                                    </manifest>
