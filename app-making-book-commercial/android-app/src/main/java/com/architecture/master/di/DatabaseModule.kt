package com.architecture.master.di

import android.content.Context
import androidx.room.Room
import com.architecture.master.data.local.AppDatabase
import com.architecture.master.data.local.UserDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Previously this module provided a plain String ("DatabaseInstance")
 * instead of a real database, and there was no way to obtain a
 * UserDao at all — UserRepository's constructor could never actually
 * be satisfied by Hilt. This provides the real Room database and DAO.
 */
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "app-making-book.db"
        ).build()
    }

    @Provides
    @Singleton
    fun provideUserDao(database: AppDatabase): UserDao {
        return database.userDao()
    }
}
