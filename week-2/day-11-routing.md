# 📱 Week 2, Day 11: API Path Construction: Secure Route Management, Middleware, and Token Hooks

> **Progress Tracker:** 🔵 Day 11 of 14 (78%)  
> **Core Objective:** Design complex API routing matrices and secure endpoints utilizing authorization middleware gate structures.

---

## 🛡️ 1. Understanding Middleware & Route Security

In API engineering, **Middleware** acts as a software wrapper layer that intercepts incoming HTTP requests *before* they reach the final business logic handler function. This allows you to inspect headers, check permissions, or log connection traffic universally across endpoints.



### 🔑 Core Security Vectors:
* **Route Parameters**: Dynamic variables embedded cleanly within a URL path (e.g., `/api/users/:id`).
* **Query Parameters**: Key-value filtering modifiers appended onto the end of a URL string (e.g., `/api/logs?limit=10`).
* **Bearer Tokens**: Cryptographic authentication strings passed securely within the HTTP request header (`Authorization: Bearer <TOKEN>`) to identify and validate a client user session.

---

## 🟢 2. JavaScript Middleware Engine: Node.js/Express

This script maps out a secure route setup that extracts path parameters and uses an inline middleware function to intercept incoming connections and block unauthorized traffic.

#### 💻 JavaScript Secure Routing Implementation Blueprint:
```javascript
const express = require('express');
const app = express();
app.use(express.json());

// 1. AUTHENTICATION MIDDLEWARE GUARD
function verifySecureToken(req, res, next) {
	    const authHeader = req.headers['authorization'];

	            // Check if the bearer header structure exists and matches our expected key
	                if (!authHeader || !authHeader.startsWith('Bearer ')) {
	                	        return res.status(401).json({ error: "Access Denied: Missing cryptographic authorization header" });
	                	            }

	                	                    const token = authHeader.split(' ')[1];
	                	                        if (token !== 'SUPER_SECURE_PASSPORT_TOKEN_99') {
	                	                        	        return res.status(403).json({ error: "Access Forbidden: Invalid token signature credentials" });
	                	                        	            }

	                	                        	                    // Authentication successful -> pass execution down to the next route handler in the chain
	                	                        	                        next();
	                	                        	                        }

	                	                        	                        // 2. SECURED ROUTE WITH PATH PARAMETERS (:id)
	                	                        	                        app.get('/api/dashboard/:userId', verifySecureToken, (req, res) => {
	                	                        	                        	    const requestedUser = req.params.userId;
	                	                        	                        	        const formatFilter = req.query.view || 'summary'; // Parsing optional query parameter (?view=)

	                	                        	                        	                res.status(200).json({
	                	                        	                        	                	        message: "Secure metrics data payload synchronized successfully",
	                	                        	                        	                	                accountID: requestedUser,
	                	                        	                        	                	                        appliedLayoutView: formatFilter,
	                	                        	                        	                	                                confidentialPayload: { networkAccess: "ALLOWED", backendNode: "Node-Beta" }
	                	                        	                        	                	                                    });
	                	                        	                        	                	                                    });

	                	                        	                        	                	                                    app.listen(6000, () => console.log('🚀 Secure Router Engine active on port 6000'));from fastapi import FastAPI, Depends, HTTPException, Header, status

	                	                        	                        	                	                                    app = FastAPI(title="Secure Route Management Engine")

	                	                        	                        	                	                                    # 1. SECURITY DEPENDENCY TOKEN SECURITY GUARD
	                	                        	                        	                	                                    async def verify_access_credentials(authorization: str = Header(None)):
	                	                        	                        	                	                                        if not authorization or not authorization.startswith("Bearer "):
	                	                        	                        	                	                                                raise HTTPException(
	                	                        	                        	                	                                                	            status_code=status.HTTP_401_UNAUTHORIZED,
	                	                        	                        	                	                                                	                        detail="Access Denied: Missing cryptographic authorization header"
	                	                        	                        	                	                                                	                                )

	                	                        	                        	                	                                                	                                        token = authorization.split(" ")[1]
	                	                        	                        	                	                                                	                                            if token != "SUPER_SECURE_PASSPORT_TOKEN_99":
	                	                        	                        	                	                                                	                                                    raise HTTPException(
	                	                        	                        	                	                                                	                                                    	            status_code=status.HTTP_403_FORBIDDEN,
	                	                        	                        	                	                                                	                                                    	                        detail="Access Forbidden: Invalid token signature credentials"
	                	                        	                        	                	                                                	                                                    	                                )
	                	                        	                        	                	                                                	                                                    	                                    return token

	                	                        	                        	                	                                                	                                                    	                                    # 2. PROTECTED DYNAMIC ROUTE INFRASTRUCTURE PATH
	                	                        	                        	                	                                                	                                                    	                                    @app.get("/api/dashboard/{user_id}")
	                	                        	                        	                	                                                	                                                    	                                    async def fetch_secure_dashboard(
	                	                        	                        	                	                                                	                                                    	                                    	    user_id: int, 
	                	                        	                        	                	                                                	                                                    	                                    	        view: str = "summary", 
	                	                        	                        	                	                                                	                                                    	                                    	            token: str = Depends(verify_access_credentials) # Injecting our security guard step
	                	                        	                        	                	                                                	                                                    	                                    	            ):
	                	                        	                        	                	                                                	                                                    	                                    	                return {
	                	                        	                        	                	                                                	                                                    	                                    	                	        "message": "Secure metrics data payload synchronized successfully",
	                	                        	                        	                	                                                	                                                    	                                    	                	                "account_id": user_id,
	                	                        	                        	                	                                                	                                                    	                                    	                	                        "applied_layout_view": view,
	                	                        	                        	                	                                                	                                                    	                                    	                	                                "confidential_payload": {"network_access": "ALLOWED", "backend_node": "FastAPI-Alpha"}
	                	                        	                        	                	                                                	                                                    	                                    	                	                                    }
	                	                        	                        	                	                                                	                                                    	                                    	                }
	                	                        	                        	                	                                                	                                                    	                                    )
	                	                        	                        	                	                                                	                                                    )
	                	                        	                        	                	                                                )
	                	                        	                        	                })
	                	                        	                        })
	                	                        }
	                }
}
