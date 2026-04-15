plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.example.xgglassapp.logic"
    compileSdk = 34

    defaultConfig {
        minSdk = 28
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions { jvmTarget = "1.8" }
}

dependencies {
    // Only depends on the entry contracts + core API surface (keeps this module device-agnostic).
    implementation("com.universalglasses:app-contract:0.0.1")
    // org.json for JSON parsing (available via SDK)
    implementation("org.json:json:20240303")
    // coroutines for Dispatchers.IO
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}
