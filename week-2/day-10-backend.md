# 📱 Week 2, Day 10: Server Infrastructure Architecture: Node.js, Express, and FastAPI Engines

> **Progress Tracker:** 🟢 Day 10 of 14 (71%)  
> **Core Objective:** Stand up operational full-stack backend application servers using JavaScript (Node.js/Express) and Python (FastAPI).

---

## ⚙️ 1. The Mechanics of a Backend Server Engine

A backend server is a persistent program running on a computer machine that continuously listens for incoming network connections over a specified **Port** identifier. Unlike a mobile frontend app that focuses on touch input and rendering user screens, a backend process runs headlessly, focusing on file I/O operations, authentication controls, and raw data processing throughput.

### 📊 Comparing Modern Server Environments:
* **Node.js + Express**: Powered by Google's V8 JavaScript runtime engine. It utilizes an asynchronous, single-threaded Event Loop architecture to handle thousands of concurrent requests smoothly without bottlenecking system resource walls.
* **Python + FastAPI**: A modern, high-performance web framework built around Python's native asynchronous execution keywords (`async`/`await`) and Pydantic data schemas. It automatically provides interactive documentation interfaces out of the box.

---

## 🟢 2. JavaScript Engine Blueprint: Node.js & Express

To spin up a basic server that accepts incoming application payloads and registers data objects, we declare a REST interface port mapping.

#### 💻 JavaScript Express Server Core Blueprint:
```javascript
const express = require('express');
const app = express();
const PORT = 5000;

// Universal Middleware engine to intercept and parse incoming raw JSON network bodies
app.use(express.json());

// 1. READ REQUEST (GET): Checking system integrity status
app.get('/api/status', (req, res) => {
	    res.status(200).json({ status: "ONLINE", timestamp: new Date().toISOString() });
	    });

	    // 2. WRITE REQUEST (POST): Emulating incoming user registration from a mobile form
	    app.post('/api/register', (req, res) => {
	    	    const { username, deviceType } = req.body;

	    	            if (!username) {
	    	            	        return res.status(400).json({ error: "Missing required tracking property: username" });
	    	            	            }

	    	            	                    res.status(201).json({
	    	            	                    	        message: "Registration data captured successfully",
	    	            	                    	                accountId: Math.floor(Math.random() * 10000),
	    	            	                    	                        registeredUser: username
	    	            	                    	                            });
	    	            	                    	                            });

	    	            	                    	                            app.listen(PORT, () => console.log(`🚀 Node.js Core Backend running on port ${PORT}`));from fastapi import FastAPI, HTTPException
	    	            	                    	                            from pydantic import BaseModel
	    	            	                    	                            import uvicorn

	    	            	                    	                            app = FastAPI(title="Master App Server Engine")

	    	            	                    	                            # 1. PYDANTIC DATA MODEL SCHEMA: Forces structural validation rules on payloads
	    	            	                    	                            class UserRegistration(BaseModel):
	    	            	                    	                                username: str
	    	            	                    	                                    device_type: str

	    	            	                    	                                    # 2. ASYNCHRONOUS GET ROUTE: Server health inspection path
	    	            	                    	                                    @app.get("/api/status")
	    	            	                    	                                    async def get_server_status():
	    	            	                    	                                        return {"status": "ONLINE", "engine": "FastAPI Core"}

	    	            	                    	                                        # 3. ASYNCHRONOUS POST ROUTE: Captures structured registration JSON objects
	    	            	                    	                                        @app.post("/api/register", status_code=201)
	    	            	                    	                                        async def register_account(user_payload: UserRegistration):
	    	            	                    	                                            return {
	    	            	                    	                                            	        "message": "Registration data captured successfully",
	    	            	                    	                                            	                "registered_user": user_payload.username,
	    	            	                    	                                            	                        "device": user_payload.device_type
	    	            	                    	                                            	                            }

	    	            	                    	                                            	                            if __name__ == "__main__":
	    	            	                    	                                            	                                uvicorn.run(app, host="0.0.0.0", port=8000)
	    	            	                    	                                            }
	    	            	                    })
	    	            }
	    })
})
