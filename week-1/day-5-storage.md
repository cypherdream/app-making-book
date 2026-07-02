---

## 📝 Day 5 Practice Challenge
1. Save this entire structural storage file to your local Termux folder repository code path (`Ctrl + S`, then `Ctrl + Q`).
2. Verify its configuration presence alongside previous days using `ls week-1`.
3. Read the Room DAO code block above and explain why the insertion function is prefixed with the `suspend` keyword modifier while the query function is not.import androidx.room.*
import kotlinx.coroutines.flow.Flow

// 1. DATABASE ENTITY SCHEMA DEFINITION
@Entity(tableName = "app_users")
data class UserEntity(
	    @PrimaryKey(autoGenerate = true) val id: Int = 0,
	        @ColumnInfo(name = "username") val username: String,
	            @ColumnInfo(name = "access_level") val accessLevel: String
	            )

	            // 2. DATA ACCESS OBJECT (DAO) LAYER INTERFACE
	            @Dao
	            interface UserDao {
	            	    @Insert(onConflict = OnConflictStrategy.REPLACE)
	            	        suspend fun insertUser(user: UserEntity)

	            	            @Query("SELECT * FROM app_users WHERE access_level = :level")
	            	                fun getUsersByAccess(level: String): Flow<List<UserEntity>>

	            	                    @Delete
	            	                        suspend fun deleteUser(user: UserEntity)
	            	                        }

	            	                        // 3. MAIN DATABASE HOLDER CONTAINER CLASS
	            	                        @Database(entities = [UserEntity::class], version = 1)
	            	                        abstract class AppDatabase : RoomDatabase() {
	            	                        	    abstract fun userDao(): UserDao
	            	                        	    }
	            	                        }
	            }
)# 📱 Week 1, Day 5: Persistent Device Storage: Jetpack DataStore & SQLite Room Engine

> **Progress Tracker:** 🟡 Day 5 of 14 (35%)  
> **Core Objective:** Build local persistence structures using key-value preferences and embedded relational databases.

---

## 💾 1. The Mobile Local Storage Hierarchy

Applications must save information directly to the phone's sandboxed storage layer. Choosing the correct tool depends entirely on the structure and scale of your data asset profiles.

### 📊 Storage Mechanism Decision Grid:
| Storage Tool | Data Structure Type | Core Use Case | Alternative / Legacy |
| :--- | :--- | :--- | :--- |
| **Jetpack DataStore** | Key-Value Pairs | User preferences, theme settings, login session tokens, flags. | SharedPreferences (Deprecated) |
| **SQLite Room Engine** | Relational Tables | Structured entity models, offline database caches, complex user lists. | Raw SQLite API Drivers |

---

## 🔑 2. Light Storage: Jetpack DataStore

**DataStore** uses asynchronous Kotlin Coroutines and RxJava data streams to store data transactionally and safely, avoiding the UI blocking issues that plagued the older legacy systems.
#### 💻 Kotlin Preferences DataStore Implementation Blueprint:
```kotlin
import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

// Initialize the DataStore instance extension property on Context
val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "user_session")

class SessionManager(private val context: Context) {
	    companion object {
	    	        val AUTH_TOKEN_KEY = stringPreferencesKey("auth_token")
	    	            }

	    	                // Securely write a raw string token asynchronously to disk storage
	    	                    async fun saveAuthToken(token: String) {
	    	                    	        context.dataStore.edit { preferences ->
	    	                    	                    preferences[AUTH_TOKEN_KEY] = token
	    	                    	                            }
	    	                    	                                }

	    	                    	                                    // Read the active token stream reactively as a Flow data pipe
	    	                    	                                        val authTokenFlow: Flow<String?> = context.dataStore.data.map { preferences ->
	    	                    	                                                preferences[AUTH_TOKEN_KEY]
	    	                    	                                                    }
	    	                    	                                                    }
	    	                    }
	    }
}
