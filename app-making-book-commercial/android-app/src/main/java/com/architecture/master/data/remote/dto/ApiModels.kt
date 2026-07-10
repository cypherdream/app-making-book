package com.architecture.master.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class HealthResponse(val status: String, val backend: String)

@Serializable
data class LogRequest(val message: String, val userId: Int)

@Serializable
data class LogResponse(val id: Int, val message: String, val userId: Int)
