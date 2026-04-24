import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:hive/hive.dart';

import 'package:smsgateway/src/repositories/message_repository.dart';
import 'package:smsgateway/src/models/sms_message.dart';

void main() {
  late Directory tempDir;
  late MessageRepository repo;

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('hive_test');
    Hive.init(tempDir.path);
    repo = MessageRepository();
    await repo.init();
  });

  tearDown(() async {
    await Hive.close();
    try {
      await tempDir.delete(recursive: true);
    } catch (_) {}
  });

  test('save and retrieve incoming message', () async {
    final msg = SmsMessageModel(id: '1', address: '+100', body: 'hello', date: DateTime.now());
    await repo.saveIncoming(msg);
    final all = repo.allMessages();
    expect(all.length, 1);
    expect(all.first.address, '+100');
  });

  test('retry queue push/pop', () async {
    final item = {'id': 'r1', 'address': '+1', 'body': 'b'};
    await repo.addToRetryQueue(Map<String, dynamic>.from(item));
    final queue = repo.getRetryQueue();
    expect(queue.length, 1);

    final popped = await repo.popRetryItem();
    expect(popped?['id'], 'r1');

    final empty = repo.getRetryQueue();
    expect(empty.length, 0);
  });
}
