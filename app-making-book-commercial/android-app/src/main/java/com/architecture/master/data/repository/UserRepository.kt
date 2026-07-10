package com.architecture.master.data.repository

import com.architecture.master.data.local.UserDao
import com.architecture.master.data.remote.ApiService
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UserRepository @Inject constructor(
    private val userDao: UserDao,
    private val apiService: ApiService
) {
    fun getLocalUsers(): Flow<List<com.architecture.master.data.local.UserEntity>> =
        userDao.getAllUsers()

    /**
     * Calls GET /health on the backend. Wrapped in a Result so
     * MainViewModel doesn't need its own try/catch for network errors.
     */
    suspend fun checkBackendStatus(): Result<String> {
        return try {
            val response = apiService.getSystemStatus()
            Result.success("${response.status} — ${response.backend}")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
