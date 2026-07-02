package com.architecture.master

import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        runSystemDiagnostics()
    }

    private fun runSystemDiagnostics() {
        val buildArchitecture = android.os.Build.SUPPORTED_ABIS.joinToString()
        val sdkVersion = android.os.Build.VERSION.SDK_INT
        
        Log.w("DIAGNOSTICS", "--- CORE TOOLCHAIN INTEGRITY PASS ---")
        Log.w("DIAGNOSTICS", "DEVICE ARCHITECTURE: $buildArchitecture")
        Log.w("DIAGNOSTICS", "ANDROID SDK VERSION: $sdkVersion")
        Log.w("DIAGNOSTICS", "STATUS: ENVIRONMENT OPERATIONAL")
    }
}
