import type { AppSpec, entitySchema } from '../schema/appSpec';
import type { z } from 'zod';

type Entity = z.infer<typeof entitySchema>;

const KOTLIN_TYPE_MAP: Record<string, string> = {
    string: 'String', number: 'Double', boolean: 'Boolean', date: 'String', text: 'String',
};

const PKG = 'com.generated.app';

const KOTLIN_DEFAULT_MAP: Record<string, string> = {
    string: '""', number: '0.0', boolean: 'false', date: '""', text: '""',
};

function emitDataClass(entity: Entity): string {
    const fields = entity.fields.map((f) => {
        if (f.required) {
            // Non-nullable type — must default to a real value of that
            // type, not null. Kotlin will not compile `val x: String = null`.
            return `    val ${f.name}: ${KOTLIN_TYPE_MAP[f.type]} = ${KOTLIN_DEFAULT_MAP[f.type]}`;
        }
        return `    val ${f.name}: ${KOTLIN_TYPE_MAP[f.type]}? = null`;
    }).join(',\n');
    return `package ${PKG}.model

data class ${entity.name}(
    val id: Int = 0,
${fields}
)
`;
}

function emitApiService(entity: Entity): string {
    const lower = entity.name.toLowerCase();
    return `package ${PKG}.remote

import ${PKG}.model.${entity.name}
import retrofit2.http.*

interface ${entity.name}ApiService {
    @GET("/api/${lower}s")
    suspend fun getAll(): List<${entity.name}>

    @GET("/api/${lower}s/{id}")
    suspend fun getById(@Path("id") id: Int): ${entity.name}

    @POST("/api/${lower}s")
    suspend fun create(@Body item: ${entity.name}): ${entity.name}

    @PUT("/api/${lower}s/{id}")
    suspend fun update(@Path("id") id: Int, @Body item: ${entity.name}): ${entity.name}

    @DELETE("/api/${lower}s/{id}")
    suspend fun delete(@Path("id") id: Int)
}
`;
}

function emitViewModel(entity: Entity): string {
    return `package ${PKG}.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import ${PKG}.model.${entity.name}
import ${PKG}.remote.${entity.name}ApiService

/**
 * Generated ViewModel — follows the same MVVM pattern as the hand-written
 * reference app (android-app/src/.../MainViewModel.kt): a StateFlow the
 * Activity observes, no direct network calls from the UI layer.
 */
class ${entity.name}ViewModel(private val api: ${entity.name}ApiService) : ViewModel() {
    private val _items = MutableStateFlow<List<${entity.name}>>(emptyList())
    val items: StateFlow<List<${entity.name}>> = _items

    fun load() {
        viewModelScope.launch {
            _items.value = api.getAll()
        }
    }

    fun delete(id: Int) {
        viewModelScope.launch {
            api.delete(id)
            load()
        }
    }
}
`;
}

export function emitAndroidFiles(spec: AppSpec): Record<string, string> {
    const files: Record<string, string> = {};
    const pkgPath = PKG.replace(/\./g, '/');

    for (const entity of spec.entities) {
        files[`android/app/src/main/java/${pkgPath}/model/${entity.name}.kt`] = emitDataClass(entity);
        files[`android/app/src/main/java/${pkgPath}/remote/${entity.name}ApiService.kt`] = emitApiService(entity);
        files[`android/app/src/main/java/${pkgPath}/ui/${entity.name}ViewModel.kt`] = emitViewModel(entity);
    }

    files[`android/app/src/main/java/${pkgPath}/MainActivity.kt`] = `package ${PKG}

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
    }
}
`;

    files['android/app/src/main/AndroidManifest.xml'] = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <application android:label="${spec.appName}" android:icon="@mipmap/ic_launcher" android:usesCleartextTraffic="true">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`;

    files['android/app/src/main/res/layout/activity_main.xml'] = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent" android:layout_height="match_parent" android:orientation="vertical" />
`;

    files['android/app/src/main/res/values/strings.xml'] = `<resources><string name="app_name">${spec.appName}</string></resources>\n`;

    files['android/settings.gradle.kts'] = `pluginManagement {\n    repositories { google(); mavenCentral(); gradlePluginPortal() }\n}\ndependencyResolutionManagement {\n    repositories { google(); mavenCentral() }\n}\nrootProject.name = "${spec.appName.replace(/\s+/g, '-')}"\ninclude(":app")\n`;

    files['android/build.gradle.kts'] = `plugins {\n    id("com.android.application") version "8.5.2" apply false\n    id("org.jetbrains.kotlin.android") version "1.9.24" apply false\n}\n`;

    files['android/app/build.gradle.kts'] = `plugins {\n    id("com.android.application")\n    id("org.jetbrains.kotlin.android")\n}\n\nandroid {\n    namespace = "${PKG}"\n    compileSdk = 34\n    defaultConfig {\n        applicationId = "${PKG}"\n        minSdk = 24\n        targetSdk = 34\n        versionCode = 1\n        versionName = "1.0"\n    }\n    compileOptions {\n        sourceCompatibility = JavaVersion.VERSION_17\n        targetCompatibility = JavaVersion.VERSION_17\n    }\n    kotlinOptions { jvmTarget = "17" }\n}\n\ndependencies {\n    implementation("androidx.core:core-ktx:1.13.1")\n    implementation("androidx.appcompat:appcompat:1.7.0")\n    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.8.4")\n    implementation("com.squareup.retrofit2:retrofit:2.11.0")\n    implementation("com.squareup.retrofit2:converter-gson:2.11.0")\n}\n`;

    files['android/gradle.properties'] = `android.useAndroidX=true\nkotlin.code.style=official\n`;

    files['android/README.md'] = `# ${spec.appName} — Android

Generated Kotlin source (data classes, Retrofit services, ViewModels per
entity) plus a real Gradle project structure. This does NOT compile itself —
no Android SDK exists in the environment that generated it. Two ways to get
a real APK:

1. Open \`android/\` in Android Studio and build normally.
2. Push to a GitHub repo and use \`.github/workflows/build-android.yml\`
   (included in this export) — builds on GitHub's free hosted runners,
   no local Android SDK needed. See that file for setup.
`;

    return files;
}
