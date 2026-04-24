package com.example.smsgateway

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.telephony.SmsMessage
import org.json.JSONObject
import java.io.File

class SmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == "android.provider.Telephony.SMS_RECEIVED") {
            val bundle: Bundle? = intent.extras
            try {
                if (bundle != null) {
                    val pdus = bundle.get("pdus") as Array<*>
                    val sb = StringBuilder()
                    var sender: String? = null
                    var timestamp: Long = System.currentTimeMillis()
                    for (pdu in pdus) {
                        val msg = SmsMessage.createFromPdu(pdu as ByteArray)
                        sender = msg.originatingAddress
                        sb.append(msg.messageBody)
                        timestamp = msg.timestampMillis
                    }
                    val body = sb.toString()

                    // Broadcast to Flutter when app is running
                    val bcast = Intent("com.example.smsgateway.SMS_RECEIVED_ACTION")
                    bcast.putExtra("address", sender)
                    bcast.putExtra("body", body)
                    bcast.putExtra("date", timestamp)
                    context.sendBroadcast(bcast)

                    // Persist minimal record to file for background processing
                    try {
                        val file = File(context.filesDir, "sms_queue.jsonl")
                        val obj = JSONObject()
                        obj.put("address", sender)
                        obj.put("body", body)
                        obj.put("date", timestamp)
                        file.appendText(obj.toString())
                        file.appendText("\n")
                    } catch (e: Exception) {
                        // swallow persistence errors
                    }
                }
            } catch (e: Exception) {
                // ignore
            }
        }
    }
}
