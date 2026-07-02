package com.architecture.master.data.remote

import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Body

interface ApiService {
    @GET("status")
    suspend fun getSystemStatus(): String

    @POST("log")
    suspend fun postSecurityLog(@Body logData: String): Boolean
}
