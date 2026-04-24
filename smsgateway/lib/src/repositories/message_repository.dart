import 'package:hive/hive.dart';
import '../models/sms_message.dart';

/// Simple repository for saving SMS messages and retry queues using Hive.
class MessageRepository {
  static const String _boxName = 'messages_box';
  Box? _box;

  Future<void> init() async {
    if (!Hive.isBoxOpen(_boxName)) {
      _box = await Hive.openBox(_boxName);
    } else {
      _box = Hive.box(_boxName);
    }
  }

  Future<void> saveIncoming(SmsMessageModel msg) async {
    await init();
    await _box!.add(msg.toMap());
  }

  List<SmsMessageModel> allMessages() {
    if (_box == null) return [];
    return _box!.values.map((e) => SmsMessageModel.fromMap(Map.from(e))).toList();
  }

  Future<void> addToRetryQueue(Map<String, dynamic> item) async {
    await init();
    final q = List<Map<dynamic, dynamic>>.from(_box!.get('retry') ?? <Map>[]);
    q.add(item);
    await _box!.put('retry', q);
  }

  List<dynamic> getRetryQueue() {
    if (_box == null) return [];
    return List<Map<dynamic, dynamic>>.from(_box!.get('retry') ?? <Map>[]);
  }

  /// Remove the first item from the retry queue and return it, or null.
  Future<Map<dynamic, dynamic>?> popRetryItem() async {
    await init();
    final q = List<Map<dynamic, dynamic>>.from(_box!.get('retry') ?? <Map>[]);
    if (q.isEmpty) return null;
    final item = q.removeAt(0);
    await _box!.put('retry', q);
    return item;
  }

  /// Put a retry item back to the front (for immediate retry) or append if null
  Future<void> pushRetryItem(Map<String, dynamic> item, {bool front = false}) async {
    await init();
    final q = List<Map<dynamic, dynamic>>.from(_box!.get('retry') ?? <Map>[]);
    if (front) {
      q.insert(0, item);
    } else {
      q.add(item);
    }
    await _box!.put('retry', q);
  }
}
