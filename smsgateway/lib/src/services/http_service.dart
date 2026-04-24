import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/sms_message.dart';

/// Simple HTTP helper for communicating with the backend server.
/// - `postIncomingSms` sends incoming SMS data to server
/// - `pollOutgoing` fetches pending outgoing instructions
class HttpService {
  // baseUrl should point to the backend root; SettingsService will set this.
  // Ensure we call endpoints under the API version path `/api/v1`.
  String baseUrl = 'https://example.com/api/v1';

  /// Optional API key to send as `Authorization: Bearer <key>`
  String? apiKey;

  void setApiKey(String? key) => apiKey = key;

  String _normalize(String path) {
    var b = baseUrl.trim();
    if (b.endsWith('/')) b = b.substring(0, b.length - 1);
    // allow callers to supply paths that include leading slash
    if (!path.startsWith('/')) path = '/$path';
    return '$b$path';
  }

  /// Check backend health endpoint
  Future<http.Response> getHealth() async {
    final uri = Uri.parse(_normalize('/health'));
    final headers = {'Accept': 'application/json'};
    final key = apiKey ?? '';  // Health check doesn't require auth, but can include key if set
    if (key.isNotEmpty) headers['Authorization'] = 'Bearer $key';
    return await http.get(uri, headers: headers).timeout(const Duration(seconds: 5));
  }

  /// POST an incoming SMS to the server.
  Future<http.Response> postIncomingSms(SmsMessageModel msg, {String? apiKey}) async {
    final uri = Uri.parse(_normalize('/incoming_sms'));
    final headers = {'Content-Type': 'application/json'};
    final key = apiKey ?? this.apiKey ?? '';  // Use instance apiKey as fallback
    if (key.isNotEmpty) headers['Authorization'] = 'Bearer $key';

    final body = jsonEncode(msg.toMap());
    return await http.post(uri, headers: headers, body: body).timeout(const Duration(seconds: 15));
  }

  /// Poll the server for outgoing instructions. Returns decoded JSON list.
  /// Increased timeout to 30 seconds for physical devices over WiFi.
  Future<List<dynamic>> pollOutgoing({String? apiKey}) async {
    final uri = Uri.parse(_normalize('/outgoing_sms'));
    final headers = {'Accept': 'application/json'};
    final key = apiKey ?? this.apiKey ?? '';  // Use instance apiKey as fallback
    if (key.isNotEmpty) {
      headers['Authorization'] = 'Bearer $key';
      print('📡 pollOutgoing(): Sending Authorization header = "Bearer ${key.substring(0, 4)}..."');
    } else {
      print('📡 pollOutgoing(): WARNING - No API Key set, Authorization header will be missing!');
    }

    final res = await http.get(uri, headers: headers).timeout(const Duration(seconds: 30));
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      if (data is List) return data;
      return [data];
    }
    print('❌ pollOutgoing(): Got status ${res.statusCode}');
    throw Exception('Polling failed with ${res.statusCode}');
  }

  /// Report the result of executing an outgoing instruction back to the server.
  Future<http.Response> postOutgoingResult(String instrId, String status, {String? platformId, String? error, String? apiKey}) async {
    final uri = Uri.parse(_normalize('/outgoing_sms/result'));
    final headers = {'Content-Type': 'application/json'};
    final key = apiKey ?? this.apiKey ?? '';  // Use instance apiKey as fallback
    if (key.isNotEmpty) headers['Authorization'] = 'Bearer $key';
    final body = jsonEncode({
      'id': instrId,
      'status': status,
      'platform_id': platformId,
      'error': error,
    });
    return await http.post(uri, headers: headers, body: body).timeout(const Duration(seconds: 15));
  }
}
