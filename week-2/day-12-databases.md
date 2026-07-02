# 📱 Week 2, Day 12: Cloud Database Interconnects: SQL Relational Syncing & MongoDB Fabrics

> **Progress Tracker:** 🔵 Day 12 of 14 (85%)  
> **Core Objective:** Establish structural connection pipelines from backend runtime processes to relational SQL engines and document-based NoSQL storage clusters.

---

## 🗄️ 1. Relational SQL vs. Non-Relational NoSQL Fabrics

Data that enters your backend server must survive system reboots and scale to handle persistent application records. Deciding how to format your database layer determines how easily your application can scale up.



### ⚖️ The Core Database Paradigms:
* **Relational SQL (PostgreSQL, MySQL, SQLite)**: Organizes data into strict rows and columns within predefined **Tables**. It uses explicit primary-to-foreign key links to manage records, enforcing high structural integrity via ACID compliance.
* **Non-Relational NoSQL (MongoDB)**: Organizes data into loose, schema-less **JSON/BSON Documents**. It is built to store unstructured or rapidly shifting records, offering flexible scaling capabilities across multiple cluster nodes.

---

## 📊 2. Relational Object Mapping: Node.js + Sequelize SQL

To speak to a SQL database without manually typing out raw SQL queries every time, backends use an Object-Relational Mapper (ORM). This script defines a model table and syncs data to it programmatically.

#### 💻 JavaScript SQL (Sequelize) Implementation Blueprint:
```javascript
const { Sequelize, DataTypes } = require('sequelize');

// 1. INITIALIZE DATABASE CONNECTION ENGINE (Using an in-memory SQL sandbox)
const sequelize = new Sequelize('sqlite::memory:', { logging: false });

// 2. DEFINE THE FACTORY TABLE MATRIX MODEL
const DBProduct = sequelize.define('Product', {
	    skuCode: {
	    	        type: DataTypes.STRING,
	    	                allowNull: false,
	    	                        unique: true
	    	                            },
	    	                                inventoryCount: {
	    	                                	        type: DataTypes.INTEGER,
	    	                                	                defaultValue: 0
	    	                                	                    }
	    	                                	                    });

	    	                                	                    // 3. SYNCHRONIZE MODEL AND EXECUTE TRANSACTIONS
	    	                                	                    async function initializeDatabasePipeline() {
	    	                                	                    	    // Generates the table schema structural architecture on disk
	    	                                	                    	        await sequelize.sync({ force: true });
	    	                                	                    	            console.log("🟢 SQL Table Layout Engine Synchronized Successfully.");

	    	                                	                    	                // Write record to database
	    	                                	                    	                    const newStock = await DBProduct.create({ skuCode: "SKU-CORE-77", inventoryCount: 45 });
	    	                                	                    	                        console.log(`Saved Entry: Row ID ${newStock.id} -> ${newStock.skuCode}`);
	    	                                	                    	                        }

	    	                                	                    	                        initializeDatabasePipeline();import asyncio
	    	                                	                    	                        from motor.motor_asyncio import AsyncIOMotorClient
	    	                                	                    	                        from beanie import Document, init_beanie
	    	                                	                    	                        from pydantic import Field

	    	                                	                    	                        # 1. DEFINE NOSQL DOCUMENT SCHEMA COLLECTION
	    	                                	                    	                        class ClusterLogDocument(Document):
	    	                                	                    	                            event_signature: str
	    	                                	                    	                                severity_level: int = Field(default=1)

	    	                                	                    	                                    class Settings:
	    	                                	                    	                                            name = "system_runtime_logs" # Name of target collection cluster inside MongoDB

	    	                                	                    	                                            # 2. INITIALIZE ASYNCHRONOUS DATABASE PIPELINE CONNECTOR
	    	                                	                    	                                            async def boot_database_fabric():
	    	                                	                    	                                                # Connect directly to a local or remote MongoDB URI connection string
	    	                                	                    	                                                    mongo_client = AsyncIOMotorClient("mongodb://localhost:27017")

	    	                                	                    	                                                            # Initialize Beanie ODM architecture with target data model bindings
	    	                                	                    	                                                                await init_beanie(database=mongo_client.app_data_store, document_models=[ClusterLogDocument])
	    	                                	                    	                                                                    print("🟢 NoSQL MongoDB Cluster Fabric Connected Successfully.")

	    	                                	                    	                                                                        # Insert a flexible JSON document directly into the collection matrix
	    	                                	                    	                                                                            new_log = ClusterLogDocument(event_signature="AUTH_PORT_MIDDLEWARE_FAIL_9", severity_level=3)
	    	                                	                    	                                                                                await new_log.insert()
	    	                                	                    	                                                                                    print(f"Captured NoSQL Document Entry: Object ID -> {new_log.id}")

	    	                                	                    	                                                                                    # Run async initialization loop	    	                                	                    }
	    	                                }
	    }
})
