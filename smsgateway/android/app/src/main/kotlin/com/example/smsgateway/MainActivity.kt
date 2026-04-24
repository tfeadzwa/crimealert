package com.example.smsgateway

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
	private val SMS_EVENT_CHANNEL = "smsgateway/sms_events"
	private val SMS_METHOD_CHANNEL = "smsgateway/sms_method"
	private var eventSink: EventChannel.EventSink? = null

	private val smsReceiver = object : BroadcastReceiver() {
		override fun onReceive(context: Context, intent: Intent) {
			if (intent.action == "com.example.smsgateway.SMS_RECEIVED_ACTION") {
				val address = intent.getStringExtra("address") ?: ""
				val body = intent.getStringExtra("body") ?: ""
				val date = intent.getLongExtra("date", System.currentTimeMillis())
				val map: MutableMap<String, Any> = HashMap()
				map["address"] = address
				map["body"] = body
				map["date"] = date
				eventSink?.success(map)
			}
		}
	}

	override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
		super.configureFlutterEngine(flutterEngine)

		// Create notification channels for Android 8+
		createNotificationChannels()

		MethodChannel(flutterEngine.dartExecutor.binaryMessenger, SMS_METHOD_CHANNEL).setMethodCallHandler { call, result ->
			when (call.method) {
				"sendSms" -> {
					val to = call.argument<String>("to") ?: ""
					val message = call.argument<String>("message") ?: ""
					try {
						android.telephony.SmsManager.getDefault().sendTextMessage(to, null, message, null, null)
						result.success(true)
					} catch (e: Exception) {
						result.error("send_error", e.message, null)
					}
				}
				else -> result.notImplemented()
			}
		}

		EventChannel(flutterEngine.dartExecutor.binaryMessenger, SMS_EVENT_CHANNEL).setStreamHandler(object : EventChannel.StreamHandler {
			override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
				eventSink = events
			}

			override fun onCancel(arguments: Any?) {
				eventSink = null
			}
		})

		// register local broadcast receiver to forward native SMS events to Flutter
		val filter = IntentFilter()
		filter.addAction("com.example.smsgateway.SMS_RECEIVED_ACTION")
		// On Android 13+ we must specify receiver exported flags when registering
		if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
			registerReceiver(smsReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
		} else {
			registerReceiver(smsReceiver, filter)
		}
	}

	override fun onDestroy() {
		super.onDestroy()
		unregisterReceiver(smsReceiver)
	}

	/// Create notification channels required for Android 8+ (API 26+)
	/// This must be called before posting notifications to these channels
	private fun createNotificationChannels() {
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
			val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

			// Channel for foreground service notifications
			val foregroundChannel = NotificationChannel(
				"flutter_foreground_task_channel",
				"SMS Gateway Service",
				NotificationManager.IMPORTANCE_LOW
			).apply {
				description = "Notification for SMS Gateway foreground service"
				enableVibration(false)
				enableLights(false)
			}
			notificationManager.createNotificationChannel(foregroundChannel)

			// Channel for incoming SMS alerts (high priority)
			val smsChannel = NotificationChannel(
				"sms_received_channel",
				"Incoming SMS",
				NotificationManager.IMPORTANCE_HIGH
			).apply {
				description = "Notifications for received SMS"
				enableVibration(true)
				enableLights(true)
			}
			notificationManager.createNotificationChannel(smsChannel)

			// Channel for errors (medium priority)
			val errorChannel = NotificationChannel(
				"error_channel",
				"Errors",
				NotificationManager.IMPORTANCE_DEFAULT
			).apply {
				description = "Error notifications"
				enableVibration(false)
			}
			notificationManager.createNotificationChannel(errorChannel)
		}
	}
}
