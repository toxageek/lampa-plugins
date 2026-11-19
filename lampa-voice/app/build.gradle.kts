plugins {
    id("com.android.application")
}

android {
    namespace = "io.github.toxageek.lampavoice"
    compileSdk = 35

    defaultConfig {
        applicationId = "io.github.toxageek.lampavoice"
        minSdk = 21
        targetSdk = 34
        // build.sh читает versionCode/versionName отсюда — держите формат строк.
        versionCode = 2
        versionName = "1.1.0"
    }

    // Тот же ключ, что и у build.sh: APK из Android Studio ставится поверх собранного скриптом.
    signingConfigs {
        create("shared") {
            storeFile = file("../signing/lampa-voice.keystore")
            storePassword = "lampavoice"
            keyAlias = "lampavoice"
            keyPassword = "lampavoice"
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
