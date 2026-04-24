# SMS Gateway Foreground Service

## Overview

The foreground service is a critical component that keeps the SMS Gateway app running reliably in the background on Android. It displays a persistent notification and prevents the system from terminating the app's background processes.

## How It Works

### Foreground Service Flow

1. **User taps "Start Listener"** in the Home page
2. **AppState.startSmsListeners()** is called:
   - Repository is initialized
   - Native SMS queue is imported (if any)
   - SMS broadcast receiver is registered
   - **Foreground service is initialized** (requests notification permission on Android 13+)
   - **Foreground service is started** (shows persistent notification)
   - Background timers are started (retry queue processor, outgoing poller)

3. **Persistent Notification Appears**:
   - Title: "SMS Gateway"
   - Text: "Monitoring for incoming SMS..."
   - Cannot be swiped away (pinned notification)

4. **Background Work Continues**:
   - Every 20 seconds: attempts to retry failed SMS submissions
   - Every 30 seconds: polls backend for outgoing instructions
   - Incoming SMS continue to be captured and queued

### Foreground Service Benefits

✅ **Prevents app termination** — System won't kill the app while foreground service is active
✅ **Reliable background work** — Timers continue running even with screen off
✅ **Battery aware** — Shows persistent notification (user can see why battery is draining)
✅ **Device restart aware** — Can be configured to restart on boot (requires `RECEIVE_BOOT_COMPLETED` permission)

## Implementation Details

### Android Configuration

**Permissions** (AndroidManifest.xml):
- `FOREGROUND_SERVICE` — Required to use foreground services (all versions)
- `FOREGROUND_SERVICE_RECEIVE_SMS` — Required on Android 14+ (API 34+)
- `POST_NOTIFICATIONS` — Required on Android 13+ (API 33+) for notification permission
- `RECEIVE_BOOT_COMPLETED` — Optional, for auto-restart on device boot

**Service Declaration**:
```xml
<service android:name="com.pravera.flutter_foreground_task.service.ForegroundService" 
         android:exported="false" />
```

**Notification Channels** (MainActivity.kt):
Three notification channels are created:
1. `flutter_foreground_task_channel` — IMPORTANCE_LOW (foreground service)
2. `sms_received_channel` — IMPORTANCE_HIGH (incoming SMS alerts)
3. `error_channel` — IMPORTANCE_DEFAULT (error notifications)

### Dart Implementation

**ForegroundService class** (lib/src/services/foreground_service.dart):
- `init()` — Requests notification permission on Android 13+
- `start()` — Starts the foreground service with persistent notification
- `stop()` — Stops the foreground service
- `updateNotification()` — Updates notification text (e.g., status changes)

Uses `flutter_foreground_task` package for cross-platform compatibility.

## Testing

### Check if Foreground Service is Running

1. **In the app**:
   - Tap "Start Listener"
   - Check logs for: `✅ Foreground service started - app will continue running in background`

2. **On the device**:
   - Swipe down from top to open notification drawer
   - You should see persistent notification: "SMS Gateway - Monitoring for incoming SMS..."
   - This notification cannot be swiped away

3. **Verify background work**:
   - Keep the app open for 20-30 seconds
   - Check logs for: `📡 Polling outgoing...` (every 30 seconds)
   - This confirms background timers are running

### Stop the Foreground Service

1. **In the app**:
   - Tap "Stop Listener" (if available)
   - Check logs for: `✅ Foreground service stopped`

2. **On the device**:
   - Notification should disappear from notification drawer

## Common Issues & Fixes

### Issue: Notification permission denied on Android 13+

**Symptom**: 
```
⚠️ Notification permission not granted for foreground service
```

**Fix**:
1. Open Settings → Apps → SMS Gateway → Permissions
2. Enable "Notifications"
3. Restart the app

### Issue: Foreground service starts but doesn't show notification

**Symptom**:
- Logs show `✅ Foreground service started` but no notification appears

**Fix**:
1. Check if notification channels are created (should happen automatically in MainActivity)
2. Verify Android version is 8+ (API 26+)
3. Check if notifications are disabled for the app

### Issue: App still gets killed by system after a few minutes

**Symptom**:
- Logs stop appearing after 5-10 minutes despite foreground service running

**Possible causes**:
- Device has aggressive battery optimization (manufacturer-specific)
- Foreground service was somehow stopped
- User manually swiped away the notification (try again)

**Fixes**:
1. Check device settings for battery optimization:
   - Samsung: Settings → Battery → App power management → Turn off for SMS Gateway
   - Other brands: Similar settings under Battery or Power
2. Whitelist the app in background restriction settings
3. Ensure foreground notification cannot be swiped away (it should be pinned)

## Performance Considerations

### Battery Impact
- Foreground service uses slightly more battery than background work alone
- Timers wake the CPU every 20-30 seconds for brief operations
- Persistent notification displays but doesn't consume significant battery

### Memory Usage
- Foreground service adds minimal overhead (~1-2 MB)
- Main memory usage is from the app itself and stored SMS in database

### Network Usage
- Polling every 30 seconds: ~1-2 KB per request
- Roughly 100-200 KB per day of polling alone
- Incoming SMS submissions vary based on usage

## Advanced Configuration

### Change Poll Interval

Edit `lib/src/providers/app_state.dart`:
```dart
Duration outgoingPollInterval = const Duration(seconds: 30); // Change to 60 for less frequent polling
```

### Change Notification Text

Edit `lib/src/services/foreground_service.dart`:
```dart
await FlutterForegroundTask.startService(
  notificationTitle: 'Custom Title',
  notificationText: 'Custom text here...',
  // ...
);
```

### Auto-restart on Boot (Optional)

In `foreground_service.dart`, set `autoRunOnBoot: true` (already enabled). Requires `RECEIVE_BOOT_COMPLETED` permission.

## References

- [Flutter Foreground Task Package](https://pub.dev/packages/flutter_foreground_task)
- [Android Foreground Services Documentation](https://developer.android.com/guide/components/foreground-services)
- [Android Notification Channels](https://developer.android.com/guide/topics/ui/notifiers/notifications#ManageChannels)
- [Android Background Execution Limits](https://developer.android.com/about/versions/oreo/background)
