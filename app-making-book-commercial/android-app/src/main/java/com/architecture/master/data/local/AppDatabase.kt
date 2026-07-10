package com.architecture.master.data.local

import androidx.room.Database
import androidx.room.RoomDatabase

/**
 * Previously DatabaseModule.provideDatabase() returned a plain String
 * named "DatabaseInstance" instead of an actual Room database, so
 * there was no real local storage anywhere in the app. This is the
 * database that UserDao is generated against.
 */
@Database(entities = [UserEntity::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
}
