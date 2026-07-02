# 📱 Week 2, Day 9: Core Application Bridges: Platform Channels & Native UI Wrappers

> **Progress Tracker:** 🔵 Day 9 of 14 (64%)  
> **Core Objective:** Implement low-level communications between cross-platform layer runtimes and underlying native device OS subsystems.

---

## 🪟 1. The Cross-Platform Hardware Access Problem

While cross-platform code scripts (JavaScript or Dart) excel at rendering buttons and loading text layouts, they cannot talk directly to a device's physical electronic hardware. When an app needs to fire up a camera lens or pull battery percentage telemetry, it must send an asynchronous communication payload through a specialized runtime message broker.



### 🧩 Core Bridge Paradigms:
* **React Native Native Modules**: Uses an asynchronous message serialization bridge (or the newer JSI—JavaScript Interface) to invoke Java/Kotlin or Objective-C/Swift native methods.
* **Flutter Platform Channels**: Establishes an asynchronous binary messaging pipe (`MethodChannel`) that transmits platform-agnostic data down to native host operating systems.

---

## 🛰️ 2. Implementing Flutter Method Channels

To fetch information from a native Android system class (like a battery manager API), we declare a message channel, listen for invoke requests inside the native Kotlin files, and pass the data results back across the bridge.
#### 💻 Dart Bridge Invocation Blueprint:
```dart
import 'package:flutter/services.dart';

class HardwareBridge {
	  // 1. Establish a uniquely named communication channel identifier matching the native side
	    static const MethodChannel _batteryChannel = MethodChannel('com.master.app/battery');

	      // 2. Safely trigger the native channel method asynchronously
	        static Future<String> getDeviceBatteryStatus() async {
	        	    try {
	        	    	      final String result = await _batteryChannel.invokeMethod('getBatteryLevel');
	        	    	            return 'Battery Level: $result%';
	        	    	                } on PlatformException catch (e) {
	        	    	                	      return "Failed to fetch native metrics: '${e.message}'.";
	        	    	                	          }
	        	    	                	            }
	        	    	                	            }package com.master.app

	        	    	                	            import android.content.Context
	        	    	                	            import android.content.ContextWrapper
	        	    	                	            import android.content.Intent
	        	    	                	            import android.content.IntentFilter
	        	    	                	            import android.os.BatteryManager
	        	    	                	            import android.os.Build
	        	    	                	            import io.flutter.embedding.android.FlutterActivity
	        	    	                	            import io.flutter.embedding.engine.FlutterEngine
	        	    	                	            import io.flutter.plugin.common.MethodChannel

	        	    	                	            class MainActivity: FlutterActivity() {
	        	    	                	            	    private val CHANNEL = "com.master.app/battery"

	        	    	                	            	        override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
	        	    	                	            	        	        super.configureFlutterEngine(flutterEngine)

	        	    	                	            	        	                        // Bind a MethodCallHandler listener straight to the incoming message pipe
	        	    	                	            	        	                                MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
	        	    	                	            	        	                                            if (call.method == "getBatteryLevel") {
	        	    	                	            	        	                                            	                val batteryLevel = getBatteryLevel()

	        	    	                	            	        	                                            	                                if (batteryLevel != -1) {
	        	    	                	            	        	                                            	                                	                    result.success(batteryLevel.toString())
	        	    	                	            	        	                                            	                                	                                    } else {
	        	    	                	            	        	                                            	                                	                                    	                    result.error("UNAVAILABLE", "Battery level computation failed.", null)
	        	    	                	            	        	                                            	                                	                                    	                                    }
	        	    	                	            	        	                                            	                                	                                    	                                                } else {
	        	    	                	            	        	                                            	                                	                                    	                                                	                result.notImplemented()
	        	    	                	            	        	                                            	                                	                                    	                                                	                            }
	        	    	                	            	        	                                            	                                	                                    	                                                	                                    }
	        	    	                	            	        	                                            	                                	                                    	                                                	                                        }

	        	    	                	            	        	                                            	                                	                                    	                                                	                                            private fun getBatteryLevel(): Int {
	        	    	                	            	        	                                            	                                	                                    	                                                	                                            	        val batteryLevel: Int = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
	        	    	                	            	        	                                            	                                	                                    	                                                	                                            	        	            val batteryManager = getSystemService(Context.BATTERY_SERVICE) as BatteryManager
	        	    	                	            	        	                                            	                                	                                    	                                                	                                            	        	                        batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
	        	    	                	            	        	                                            	                                	                                    	                                                	                                            	        	                                } else {
	        	    	                	            	        	                                            	                                	                                    	                                                	                                            	        	                                	            val intent = ContextWrapper(applicationContext).registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
	        	    	                	            	        	                                            	                                	                                    	                                                	                                            	        	                                	                        (intent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1) * 100 / (intent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1)
	        	    	                	            	        	                                            	                                	                                    	                                                	                                            	        	                                	                                }
	        	    	                	            	        	                                            	                                	                                    	                                                	                                            	        	                                	                                        return batteryLevel
	        	    	                	            	        	                                            	                                	                                    	                                                	                                            	        	                                	                                            }
	        	    	                	            	        	                                            	                                	                                    	                                                	                                            	        	                                }
	        	    	                	            	        	                                            	                                	                                    	                                                	                                            	        }
	        	    	                	            	        	                                            	                                	                                    	                                                	                                            }
	        	    	                	            	        	                                            	                                	                                    	                                                }
	        	    	                	            	        	                                            	                                	                                    }
	        	    	                	            	        	                                            	                                }
	        	    	                	            	        	                                            }}
	        	    	                	            	        }
	        	    	                	            }
	        	    	                }
	        	    }
	        }
}
