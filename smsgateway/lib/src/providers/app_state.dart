import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import '../services/sms_service.dart';
import '../services/http_service.dart';
import '../services/settings_service.dart';
import '../services/foreground_service.dart';
import '../repositories/message_repository.dart';
import '../models/sms_message.dart';

/// High-level application state. Exposes start/stop operations, logs,
/// and delegates work to services and repositories.
class AppState extends ChangeNotifier {
  final SmsService smsService;
  final HttpService httpService;
  final MessageRepository _repo = MessageRepository();
  final SettingsService? settingsService;

  String status = 'idle';
  final List<String> logs = [];

  AppState({required this.smsService, required this.httpService, this.settingsService});

  /// Import native persisted SMS records written by the Android `SmsReceiver`.
  /// Reads `sms_queue.jsonl` from the app files directory, enqueues each record
  /// into the retry queue, and deletes the file.
  Future<void> importNativeQueue() async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      File file = File('${dir.path}/sms_queue.jsonl');
      // Fallback: some native code writes to context.filesDir which may
      // be different on some Android setups. Check the common path as well.
      if (!await file.exists()) {
        final fallback = File('/data/user/0/com.example.smsgateway/files/sms_queue.jsonl');
        if (await fallback.exists()) {
          file = fallback;
        } else {
          return;
        }
      }
      final lines = await file.readAsLines();
      for (final line in lines) {
        try {
          final m = jsonDecode(line) as Map<String, dynamic>;
          // normalize date if needed
          if (m['date'] is int) {
            m['date'] = DateTime.fromMillisecondsSinceEpoch(m['date'] as int).toIso8601String();
          }
          await _repo.addToRetryQueue(Map<String, dynamic>.from(m));
          addLog('Imported native SMS from ${m['address']}');
        } catch (e) {
          addLog('Failed to parse native SMS line: $e');
        }
      }
      // remove file after importing
      try {
        await file.delete();
      } catch (e) {
        addLog('Could not delete native queue file: $e');
      }
    } catch (e) {
      addLog('importNativeQueue error: $e');
    }
  }

  /// Request SMS-related runtime permissions from the user.
  /// On Android 6+ (API 23+), runtime permissions must be requested.
  /// On Android 12+ (API 31+), READ_PHONE_STATE and SEND_SMS require runtime permission.
  /// Returns true if essential SMS permissions are granted.
  Future<bool> requestSmsPermissions() async {
    try {
      // Request essential SMS permissions
      final smsStatus = await Permission.sms.request();
      addLog('SMS permission status: ${smsStatus.toString()}');
      
      // Request phone state permission (needed for some operations on Android 12+)
      final phoneStatus = await Permission.phone.request();
      addLog('Phone permission status: ${phoneStatus.toString()}');
      
      // On Android 13+, also request notification permission for foreground service
      final notificationStatus = await Permission.notification.request();
      addLog('Notification permission status: ${notificationStatus.toString()}');
      
      // Essential: SMS permission must be granted
      final granted = smsStatus.isGranted;
      addLog('Permissions granted (essential): $granted');
      
      // Log what we have
      if (!smsStatus.isGranted) {
        addLog('⚠️ SMS permission DENIED. The app needs this to capture incoming SMS.');
      }
      if (!phoneStatus.isGranted) {
        addLog('⚠️ Phone permission DENIED. Some features may be limited.');
      }
      
      return granted;
    } catch (e) {
      addLog('❌ requestSmsPermissions error: $e');
      return false;
    }
  }

  void addLog(String s) {
    logs.add('${DateTime.now().toIso8601String()} - $s');
    notifyListeners();
  }

  Future<void> startSmsListeners() async {
    status = 'starting';
    notifyListeners();
    await _repo.init();

    // Initialize and start foreground service FIRST to ensure background reliability
    try {
      addLog('🔔 Initializing foreground service...');
      await ForegroundService.init();
      addLog('✅ Foreground service initialized');
    } catch (e) {
      addLog('⚠️ Foreground service init failed: $e');
    }

    // Import any native-persisted SMS that arrived while the app was not running.
    try {
      await importNativeQueue();
    } catch (e) {
      addLog('❌ Error importing native queue at listener start: $e');
    }

    // Start listening and forward to server + persist
    await smsService.startListening((SmsMessageModel msg) async {
      addLog('Received SMS from ${msg.address}');
      await _repo.saveIncoming(msg);

      // Try to post to server (fire-and-forget for phase 1)
      try {
        final res = await httpService.postIncomingSms(msg);
        addLog('Posted to server: ${res.statusCode}');
      } catch (e) {
        addLog('Failed to post to server, queued for retry');
        await _repo.addToRetryQueue(msg.toMap());
      }
      notifyListeners();
    });

    status = 'listening';
    addLog('✅ SMS listener started');
    // Start foreground service to keep app running in background
    try {
      addLog('📱 Starting foreground service with persistent notification...');
      await ForegroundService.start();
      addLog('✅ Foreground service started - app will continue running in background');
    } catch (e) {
      addLog('⚠️ Could not start foreground service: $e');
      // Continue anyway, SMS listeners still work but background reliability is reduced
    }

    // Start background timers: retry processing and outgoing polling
    _startPeriodicWork();
    notifyListeners();
  }

  /// Stop listeners and foreground service if running
  Future<void> stopSmsListeners() async {
    _retryTimer?.cancel();
    _outgoingTimer?.cancel();
    try {
      addLog('⏹️ Stopping foreground service...');
      await ForegroundService.stop();
      addLog('✅ Foreground service stopped');
    } catch (e) {
      addLog('⚠️ Error stopping foreground service: $e');
    }
    status = 'idle';
    notifyListeners();
  }

  // --- Retry and polling logic ---
  Duration retryInterval = const Duration(seconds: 20);
  Duration outgoingPollInterval = const Duration(seconds: 30);
  Timer? _retryTimer;
  Timer? _outgoingTimer;

  void _startPeriodicWork() {
    _retryTimer?.cancel();
    _outgoingTimer?.cancel();

    _retryTimer = Timer.periodic(retryInterval, (_) async {
      await processRetryQueue();
    });

    _outgoingTimer = Timer.periodic(outgoingPollInterval, (_) async {
      await pollAndSendOutgoing();
    });
  }

  /// Process retry queue: pop items and attempt to post again. On failure,
  /// requeue with incremented attempts counter.
  Future<void> processRetryQueue() async {
    try {
      final item = await _repo.popRetryItem();
      if (item == null) return;

      final msg = SmsMessageModel.fromMap(item);
      addLog('🔄 Retrying post for ${msg.id}');
      try {
        final res = await httpService.postIncomingSms(msg);
        addLog('✅ Retry posted: ${res.statusCode}');
      } catch (e) {
        // put back with attempts metadata
        final attempts = (item['attempts'] ?? 0) as int;
        item['attempts'] = attempts + 1;
        item['last_error'] = e.toString();
        // simple backoff: push to end
        await _repo.pushRetryItem(Map<String, dynamic>.from(item));
        addLog('⚠️ Retry failed, requeued (attempts=${item['attempts']})');
      }
    } catch (e) {
      addLog('❌ processRetryQueue error: $e');
    }
  }

  /// Poll server for outgoing instructions and send them via SmsService.
  Future<void> pollAndSendOutgoing() async {
    try {
      // Log API key status for debugging
      final keyDisplay = httpService.apiKey != null && httpService.apiKey!.isNotEmpty 
        ? '${httpService.apiKey!.substring(0, 4)}...' 
        : '<NOT SET>';
      
      if (httpService.apiKey == null || httpService.apiKey!.isEmpty) {
        addLog('⚠️ CRITICAL: No API key configured! Polling will fail with 401.');
        addLog('   → Go to Settings and enter the API key (e.g., "test-key")');
        return;
      }
      
      addLog('📡 Polling from ${httpService.baseUrl}/outgoing_sms');
      addLog('   API Key: $keyDisplay');
      final items = await httpService.pollOutgoing();
      if (items.isEmpty) {
        addLog('✅ Poll complete: no pending instructions');
        return;
      }
      addLog('✅ Polled ${items.length} outgoing instructions');
      for (final dyn in items) {
        try {
          final id = dyn['id']?.toString() ?? '';
          final to = dyn['to']?.toString() ?? '';
          final body = dyn['body']?.toString() ?? '';
          final sent = await smsService.sendSms(to, body);
          if (sent) {
            addLog('✅ Sent SMS to $to (instr=$id)');
            // report back success
            await httpService.postOutgoingResult(id, 'sent');
          } else {
            addLog('❌ Failed to send SMS to $to (instr=$id)');
            await httpService.postOutgoingResult(id, 'failed', error: 'send_error');
          }
        } catch (e) {
          addLog('❌ Error handling outgoing item: $e');
        }
      }
    } catch (e) {
      final keyDisplay = httpService.apiKey != null && httpService.apiKey!.isNotEmpty 
        ? '${httpService.apiKey!.substring(0, 4)}...' 
        : '<NOT SET>';
      addLog('❌ pollAndSendOutgoing error: $e');
      addLog('   Server URL: ${httpService.baseUrl}');
      addLog('   API Key: $keyDisplay');
      if (e.toString().contains('401')) {
        addLog('   ⚠️ 401 Unauthorized - API key may be invalid or missing');
        addLog('   Check: Is the API key "test-key" registered in the backend database?');
        addLog('   Check: Backend database has a GatewayClient with apiKey = "test-key"?');
      }
    }
  }

  /// Stop timers when app is disposed.
  @override
  void dispose() {
    _retryTimer?.cancel();
    _outgoingTimer?.cancel();
    super.dispose();
  }
}
