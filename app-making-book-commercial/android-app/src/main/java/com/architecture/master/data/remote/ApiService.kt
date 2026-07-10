package com.architecture.master.data.remote

import com.architecture.master.data.remote.dto.HealthResponse
import com.architecture.master.data.remote.dto.LogRequest
import com.architecture.master.data.remote.dto.LogResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface ApiService {
    @GET("../health")
    suspend fun getSystemStatus(): HealthResponse

    @POST("logs")
    suspend fun postSecurityLog(@Body log: LogRequest): LogResponse
}
