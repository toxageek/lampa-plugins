plugins {
    id("com.android.application")
}

android {
    namespace = "io.github.toxageek.goveesync"
    compileSdk = 35

    defaultConfig {
        applicationId = "io.github.toxageek.goveesync"
        minSdk = 21
        targetSdk = 34
        // build.sh читает versionCode/versionName отсюда — держите формат строк.
        versionCode = 1
        versionName = "1.0.0"
    }

    // Тот же ключ, что и у build.sh: APK из Android Studio ставится поверх собранного скриптом.
    signingConfigs {
        create("shared") {
            storeFile = file("../signing/govee-sync.keystore")
            storePassword = "goveesync"
            keyAlias = "goveesync"
            keyPassword = "goveesync"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("shared")
        }
        debug {
            signingConfig = signingConfigs.getByName("shared")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
}
