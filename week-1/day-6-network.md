# 📱 Week 1, Day 6: Web Network Integrations: Retrofit REST API Engine & JSON Parsers

> **Progress Tracker:** 🟡 Day 6 of 14 (43%)  
> **Core Objective:** Build a high-performance HTTP network client engine using Retrofit to fetch and parse remote server payloads.

---

## 🌐 1. Mobile Network Architecture & Asynchronicity

When a mobile app requests data from an external server via an API, the request must happen asynchronously in the background. If you attempt to make a network request on the **Main Thread** (the UI thread), the mobile operating system will instantly crash the app to prevent freezing the interface.



### ⚙️ The Network Lifecycle:
1. **UI Thread** triggers an action (e.g., user pulls down to refresh a product feed).
2. The app hands execution off to a **Background Worker / Coroutine** pool.
3. The background network client sends an **HTTP Request** to a remote web server.
4. The server processes the request and responds with a raw text string, typically formatted as **JSON** (JavaScript Object Notation).
5. The data client parses the JSON text string into native data objects and posts the results back to the **UI Thread** to redraw the screen layout.

---

## 📦 2. The Retrofit HTTP Client Engine

In native Android engineering, **Retrofit** is the type-safe HTTP client framework standard. It simplifies connecting to RESTful APIs by turning your target web endpoints into clean, executable interfaces.

### 🧩 Core Dependencies Needed:
* **Retrofit**: Handles the HTTP network handshakes, headers, routing paths, and connections.
* **Moshi or Gson Converter**: An automated data parsing library that converts raw JSON strings directly into clean data model class objects.
---

## 💻 3. Implementing the Networking Client Code

To map out a real network execution layer, we define our target data payload structure, compile the communication interface endpoints, and instantiate the structural builder instance.

#### 💻 Kotlin Retrofit Network Architecture Implementation:
```kotlin
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

// 1. DATA MODEL CLASS: Maps out the expected structural JSON keys from the backend
data class ServerProduct(
	    val id: Int,
	        val title: String,
	            val price: Double
	            )

	            // 2. RETROFIT API INTERFACE: Defines target HTTP paths and parameters
	            interface ProductApiService {

	            	        // Fetches an absolute endpoint path string dynamically injecting a resource ID variable
	            	            @GET("products/{id}")
	            	                suspend fun getProductById(
	            	                	        @Path("id") productId: Int
	            	                	            ): ServerProduct

	            	                	                // Queries an optional filter path string (e.g., api/products?category=electronics)
	            	                	                    @GET("products")
	            	                	                        suspend fun getProductsByCategory(
	            	                	                        	        @Query("category") filterCategory: String
	            	                	                        	            ): List<ServerProduct>
	            	                	                        	            }

	            	                	                        	            // 3. CENTRAL NETWORK CLIENT BUILDER SINGLETON INSTANCE
	            	                	                        	            object NetworkClient {
	            	                	                        	            	    private const val BASE_URL = "[https://api.internal-production.com/](https://api.internal-production.com/)"

	            	                	                        	            	        val apiEngine: ProductApiService by lazy {
	            	                	                        	            	        	        Retrofit.Builder()
	            	                	                        	            	        	                    .baseUrl(BASE_URL)
	            	                	                        	            	        	                                .addConverterFactory(MoshiConverterFactory.create()) // Auto-parses JSON payloads
	            	                	                        	            	        	                                            .build()
	            	                	                        	            	        	                                                        .create(ProductApiService::class.java)
	            	                	                        	            	        	                                                            }
	            	                	                        	            	        	                                                            }
	            	                	                        	            	        }
	            	                	                        	            }
	            	                	                        )
	            	                )
	            }
)
