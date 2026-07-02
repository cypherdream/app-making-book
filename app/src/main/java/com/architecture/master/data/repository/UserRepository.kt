package com.architecture.master.data.repository

import com.architecture.master.data.local.UserDao
import com.architecture.master.data.remote.ApiService
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UserRepository @Inject constructor(
    private val userDao: UserDao,
    private val apiService: ApiService
) {
    // Single source of truth logic goes here
    fun getUsers() = userDao.getAllUsers()
}
