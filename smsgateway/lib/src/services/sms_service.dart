import '../models/sms_message.dart';
import 'android_sms_service.dart';

/// Service responsible for interacting with device SMS capabilities.
/// - listens for incoming SMS
/// - sends SMS
class SmsService {
  final AndroidSmsService _android = AndroidSmsService();
  bool _initialized = false;

  /// Initialize permissions and local state.
  Future<void> init() async {
    if (_initialized) return;
    // Initialization can be extended to request runtime permissions
    // using `permission_handler` or native dialogs. For now we assume
    // permissions will be requested from the UI flow.

    _initialized = true;
  }

  /// Start listening to incoming SMS messages.
  /// [onMessage] will be called for each received SMS.
  Future<void> startListening(Function(SmsMessageModel) onMessage) async {
    if (!_initialized) await init();
    // Listen to platform EventChannel for incoming messages (forwarded by
    // native SmsReceiver). This only works while the Flutter engine runs.
    _android.incomingMessages().listen((m) {
      final model = SmsMessageModel(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        address: m['address'] ?? '',
        body: m['body'] ?? '',
        date: DateTime.fromMillisecondsSinceEpoch((m['date'] ?? DateTime.now().millisecondsSinceEpoch) as int),
      );
      onMessage(model);
    });
  }

  /// Send an SMS to [to] with [message]. Returns true on success.
  Future<bool> sendSms(String to, String message) async {
    try {
      final ok = await _android.sendSms(to, message);
      return ok;
    } catch (e) {
      return false;
    }
  }

}
