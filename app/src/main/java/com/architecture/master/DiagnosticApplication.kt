package com.architecture.master

import android.app.Application
import dagger.hilt.android.HiltAndroidApp
import android.util.Log

@HiltAndroidApp
class DiagnosticApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        Log.i("INTEGRITY_CHECK", "Application Lifecycle Initialized Safely")
    }
}
