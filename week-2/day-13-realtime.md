# 📱 Week 2, Day 13: Real-Time Event Telemetry: WebSockets, Push Notification Services, and Background Workers

> **Progress Tracker:** 🔵 Day 13 of 14 (93%)  
> **Core Objective:** Build bidirectional WebSocket event streams, configure Firebase Cloud Messaging (FCM) wrappers, and stand up asynchronous background workers.

---

## ⚡ 1. The Real-Time Architecture Paradigm

Standard REST APIs operate on a passive request-response mechanism: the mobile client must explicitly ask for data before the server responds. For real-time applications (such as live chats, matching dashboards, or monitoring feeds), this approach is highly inefficient. 



### 🛰️ Core Real-Time Technologies:
* **WebSockets**: Establishes a single, persistent, **bidirectional TCP connection** between the client and server. Both sides can send data payloads instantly at any time without the overhead of HTTP headers.
* **Push Notifications (FCM)**: Allows servers to wake up backgrounded or closed mobile applications by pushing alerts through global cloud messaging networks.
* **Background Workers**: Headless internal threads designed to offload long-running tasks (like image compression or web scraping) away from the primary event loop.

---

## 🟢 2. JavaScript Live Streams: Node.js + WebSocket Core

This script sets up a persistent WebSocket engine that handles concurrent user connections, tracks active socket states, and broadcasts live text events down to all connected clients.

#### 💻 JavaScript WebSocket Server Implementation Blueprint:
```javascript
const { WebSocketServer } = require('ws');

// 1. INITIALIZE WEBSOCKET ENGINE ON PORT 8080
const wss = new WebSocketServer({ port: 8080 });
console.log("🚀 Live WebSocket Telemetry Server humming on port 8080");

wss.on('connection', (ws, req) => {
	    const clientIp = req.socket.remoteAddress;
	        console.log(`🔌 New client link established from node: ${clientIp}`);

	            // Send an immediate greeting handshake to the newly joined client
	                ws.send(JSON.stringify({ event: "SYSTEM_HANDSHAKE", message: "Real-time stream active." }));

	                    // 2. LISTEN FOR INCOMING TELEMETRY FROM CLIENTS
	                        ws.on('message', (rawData) => {
	                        	        try {
	                        	        	            const payload = JSON.parse(rawData);
	                        	        	                        console.log(`📥 Received stream data:`, payload);

	                        	        	                                    // 3. BROADCAST EVENT OUT TO EVERY ALIVE NODE IN THE POOL
	                        	        	                                                wss.clients.forEach((client) => {
	                        	        	                                                	                if (client.readyState === 1) { // 1 means the socket connection is open
	                        	        	                                                	                                    client.send(JSON.stringify({
	                        	        	                                                	                                    	                        event: "STREAM_BROADCAST",
	                        	        	                                                	                                    	                                                origin: clientIp,
	                        	        	                                                	                                    	                                                                        data: payload
	                        	        	                                                	                                    	                                                                                            }));
	                        	        	                                                	                                    	                                                                                                            }
	                        	        	                                                	                                    	                                                                                                                        });
	                        	        	                                                	                                    	                                                                                                                                } catch (err) {
	                        	        	                                                	                                    	                                                                                                                                	            ws.send(JSON.stringify({ error: "MALFORMED_STREAM_JSON" }));
	                        	        	                                                	                                    	                                                                                                                                	                    }
	                        	        	                                                	                                    	                                                                                                                                	                        });

	                        	        	                                                	                                    	                                                                                                                                	                            ws.on('close', () => console.log(`❌ Client node disconnected: ${clientIp}`));
	                        	        	                                                	                                    	                                                                                                                                	                            });from fastapi import FastAPI, HTTPException
	                        	        	                                                	                                    	                                                                                                                                	                            from pydantic import BaseModel
	                        	        	                                                	                                    	                                                                                                                                	                            import firebase_admin
	                        	        	                                                	                                    	                                                                                                                                	                            from firebase_admin import credentials, messaging

	                        	        	                                                	                                    	                                                                                                                                	                            app = FastAPI(title="Real-Time Event Dispatch Engine")

	                        	        	                                                	                                    	                                                                                                                                	                            # 1. INITIALIZE GOOGLE FIREBASE SDK CONTEXT
	                        	        	                                                	                                    	                                                                                                                                	                            # In production, this reads your secure serviceAccountKey.json certificate file
	                        	        	                                                	                                    	                                                                                                                                	                            try:
	                        	        	                                                	                                    	                                                                                                                                	                                cred = credentials.Certificate("path/to/firebase-credentials.json")
	                        	        	                                                	                                    	                                                                                                                                	                                    firebase_admin.initialize_app(cred)
	                        	        	                                                	                                    	                                                                                                                                	                                    except Exception:
	                        	        	                                                	                                    	                                                                                                                                	                                        # Fallback log printout for environment tracing placeholder setups
	                        	        	                                                	                                    	                                                                                                                                	                                            print("⚠️ Firebase SDK offline: Provide structural credential JSON files to authorize.")

	                        	        	                                                	                                    	                                                                                                                                	                                            class NotificationPayload(BaseModel):
	                        	        	                                                	                                    	                                                                                                                                	                                                target_device_token: str
	                        	        	                                                	                                    	                                                                                                                                	                                                    alert_title: str
	                        	        	                                                	                                    	                                                                                                                                	                                                        alert_body: str

	                        	        	                                                	                                    	                                                                                                                                	                                                        # 2. ENDPOINT TO REMOTE-TRIGGER MOBILE ALERTS
	                        	        	                                                	                                    	                                                                                                                                	                                                        @app.post("/api/dispatch-alert", status_code=200)
	                        	        	                                                	                                    	                                                                                                                                	                                                        async def dispatch_push_notification(payload: NotificationPayload):
	                        	        	                                                	                                    	                                                                                                                                	                                                            try:
	                        	        	                                                	                                    	                                                                                                                                	                                                                    # Construct the specialized FCM transport envelope mapping structure
	                        	        	                                                	                                    	                                                                                                                                	                                                                            message = messaging.Message(
	                        	        	                                                	                                    	                                                                                                                                	                                                                            	            notification=messaging.Notification(
	                        	        	                                                	                                    	                                                                                                                                	                                                                            	            	                title=payload.alert_title,
	                        	        	                                                	                                    	                                                                                                                                	                                                                            	            	                                body=payload.alert_body,
	                        	        	                                                	                                    	                                                                                                                                	                                                                            	            	                                            ),
	                        	        	                                                	                                    	                                                                                                                                	                                                                            	            	                                                        token=payload.target_device_token,
	                        	        	                                                	                                    	                                                                                                                                	                                                                            	            	                                                                )

	                        	        	                                                	                                    	                                                                                                                                	                                                                            	            	                                                                                # Dispatch the payload packet straight onto Google's routing nodes
	                        	        	                                                	                                    	                                                                                                                                	                                                                            	            	                                                                                        response = messaging.send(message)
	                        	        	                                                	                                    	                                                                                                                                	                                                                            	            	                                                                                                return {"status": "SUCCESS", "fcm_message_id": response}

	                        	        	                                                	                                    	                                                                                                                                	                                                                            	            	                                                                                                            except Exception as e:
	                        	        	                                                	                                    	                                                                                                                                	                                                                            	            	                                                                                                                    raise HTTPException(status_code=500, detail=f"FCM transmission bottleneck encountered: {str(e)}")")
	                        	        	                                                	                                    	                                                                                                                                	                                                                            	            )
	                        	        	                                                	                                    	                                                                                                                                	                                                                            )
	                        	        	                                                	                                    	                                                                                                                                }
	                        	        	                                                	                                    }))}
	                        	        	                                                })
	                        	        }
	                        })
})
