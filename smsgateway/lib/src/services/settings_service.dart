import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hive/hive.dart';

/// Simple settings storage. Stores non-sensitive settings in Hive and
/// sensitive keys (API key) in Flutter Secure Storage.
class SettingsService {
  static const _boxName = 'settings_box';
  static const _serverKey = 'server_url';
  final FlutterSecureStorage _secure = const FlutterSecureStorage();
  Box? _box;

  Future<void> init() async {
    if (!Hive.isBoxOpen(_boxName)) {
      _box = await Hive.openBox(_boxName);
    } else {
      _box = Hive.box(_boxName);
    }
    // If no server URL is stored, attempt to detect environment and set a sensible default
    final stored = _box?.get(_serverKey);
    if (stored == null || (stored is String && stored.isEmpty)) {
      String defaultUrl = 'http://10.0.2.2:5000/api/v1'; // fallback for emulator
      try {
        final deviceInfo = DeviceInfoPlugin();
        if (Platform.isAndroid) {
          final info = await deviceInfo.androidInfo;
          final isPhysical = info.isPhysicalDevice == true;
          if (isPhysical) {
            // Physical device: user must set via "Find Host" or manual entry
            // Don't default to localhost—it won't work on physical devices
            defaultUrl = 'http://192.168.1.100:5000/api/v1'; // placeholder, user should configure
          } else {
            // Android emulator -> use 10.0.2.2 loopback to host
            defaultUrl = 'http://10.0.2.2:5000/api/v1';
          }
        } else if (Platform.isIOS) {
          final info = await deviceInfo.iosInfo;
          final isPhysical = info.isPhysicalDevice == true;
          if (isPhysical) {
            // iOS physical device: user must set via "Find Host" or manual entry
            defaultUrl = 'http://192.168.1.100:5000/api/v1'; // placeholder, user should configure
          } else {
            // iOS Simulator -> localhost works
            defaultUrl = 'http://localhost:5000/api/v1';
          }
        }
      } catch (e) {
        // Non-fatal: fall back to emulator default
        defaultUrl = 'http://10.0.2.2:5000/api/v1';
      }

      await _box!.put(_serverKey, defaultUrl);
    }
  }

  // Server URL (read from settings box)
  String get serverUrl => _box?.get(_serverKey, defaultValue: 'http://localhost:5000/api/v1') as String;

  Future<void> setServerUrl(String url) async {
    await init();
    await _box!.put(_serverKey, url);
  }

  Future<void> setApiKey(String key) async {
    await _secure.write(key: 'api_key', value: key);
  }

  Future<String?> getApiKey() async {
    return await _secure.read(key: 'api_key');
  }
}
