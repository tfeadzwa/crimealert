import 'dart:async';
import 'package:flutter/services.dart';

/// Platform-channel based SMS service for Android.
/// - EventChannel `smsgateway/sms_events` streams incoming SMS messages.
/// - MethodChannel `smsgateway/sms_method` exposes `sendSms` method.
class AndroidSmsService {
  static const MethodChannel _method = MethodChannel('smsgateway/sms_method');
  static const EventChannel _events = EventChannel('smsgateway/sms_events');

  Stream<Map<String, dynamic>>? _incomingStream;

  /// Stream of incoming SMS messages (address, body, date)
  Stream<Map<String, dynamic>> incomingMessages() {
    _incomingStream ??= _events
        .receiveBroadcastStream()
        .map((event) => Map<String, dynamic>.from(event as Map));
    return _incomingStream!;
  }

  /// Send an SMS via platform SMS manager.
  Future<bool> sendSms(String to, String message) async {
    try {
      final res = await _method.invokeMethod('sendSms', {'to': to, 'message': message});
      return res == true;
    } on PlatformException catch (_) {
      return false;
    }
  }
}
