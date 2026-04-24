import 'package:flutter_foreground_task/flutter_foreground_task.dart';

/// ForegroundService manages the Android foreground service to keep the SMS
/// gateway running in the background. This ensures incoming SMS are captured
/// even when the app is in the background or the device screen is off.
///
/// The foreground service shows a persistent notification and prevents the
/// system from terminating the app's background processes.
class ForegroundService {
  /// Initialize the foreground service by requesting permissions (Android 13+).
  static Future<void> init() async {
    // Request notification permission on Android 13+ (API 33+)
    try {
      await FlutterForegroundTask.requestNotificationPermission();
      print('✅ Notification permission request sent');
    } catch (e) {
      print('⚠️ Could not request notification permission: $e');
      // Continue anyway; the service may still work
    }
  }

  /// Start the foreground service. This will show a persistent notification
  /// and begin monitoring for incoming SMS in the background.
  static Future<void> start() async {
    // Check if foreground task is running
    try {
      final isRunning = await FlutterForegroundTask.isRunningService;
      if (isRunning) {
        print('ℹ️ Foreground service already running');
        return;
      }
    } catch (e) {
      print('⚠️ Could not check service status: $e');
    }

    try {
      // Start the foreground task with a persistent notification
      // Using only the basic parameters that are stable in the API
      await FlutterForegroundTask.startService(
        notificationTitle: 'SMS Gateway',
        notificationText: 'Monitoring for incoming SMS...',
        callback: _foregroundTaskCallback,
      );
      print('✅ Foreground service started');
    } catch (e) {
      print('❌ Failed to start foreground service: $e');
      rethrow;
    }
  }

  /// Stop the foreground service and remove the persistent notification.
  static Future<void> stop() async {
    try {
      final isRunning = await FlutterForegroundTask.isRunningService;
      if (!isRunning) {
        print('ℹ️ Foreground service not running');
        return;
      }

      await FlutterForegroundTask.stopService();
      print('✅ Foreground service stopped');
    } catch (e) {
      print('❌ Failed to stop foreground service: $e');
      rethrow;
    }
  }

  /// Update the foreground notification with new text (e.g., status updates).
  static Future<void> updateNotification(String title, String text) async {
    try {
      await FlutterForegroundTask.updateService(
        notificationTitle: title,
        notificationText: text,
      );
    } catch (e) {
      print('⚠️ Failed to update notification: $e');
    }
  }

  /// Callback invoked by the foreground service.
  /// This is required by flutter_foreground_task.
  @pragma('vm:entry-point')
  static void _foregroundTaskCallback() {
    // Callback for the foreground service
    // The service will call this periodically
  }
}
