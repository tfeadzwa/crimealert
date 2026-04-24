import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:smsgateway/src/services/http_service.dart';
import 'package:smsgateway/src/models/sms_message.dart';

void main() {
  late HttpServer server;
  late HttpService svc;

  setUp(() async {
    server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    final port = server.port;
    svc = HttpService();
    svc.baseUrl = 'http://${server.address.host}:$port/api';

    // simple request handler in background
    server.listen((HttpRequest req) async {
      final path = req.uri.path;
      if (path == '/api/incoming_sms' && req.method == 'POST') {
        // echo back
        req.response.statusCode = 200;
        await req.response.close();
      } else if (path == '/api/outgoing_sms' && req.method == 'GET') {
        req.response.statusCode = 200;
        req.response.headers.contentType = ContentType.json;
        req.response.write(jsonEncode([
          {'id': 'o1', 'to': '+100', 'body': 'hi'}
        ]));
        await req.response.close();
      } else if (path == '/api/outgoing_sms/result' && req.method == 'POST') {
        req.response.statusCode = 200;
        await req.response.close();
      } else {
        req.response.statusCode = 404;
        await req.response.close();
      }
    });
  });

  tearDown(() async {
    await server.close(force: true);
  });

  test('postIncomingSms works', () async {
    final msg = SmsMessageModel(id: '1', address: '+1', body: 'hi', date: DateTime.now());
    final res = await svc.postIncomingSms(msg);
    expect(res.statusCode, 200);
  });

  test('pollOutgoing returns list', () async {
    final out = await svc.pollOutgoing();
    expect(out, isA<List>());
    expect(out.length, 1);
    expect(out.first['id'], 'o1');
  });

  test('postOutgoingResult works', () async {
    final res = await svc.postOutgoingResult('o1', 'sent');
    expect(res.statusCode, 200);
  });
}

// no fake needed now
