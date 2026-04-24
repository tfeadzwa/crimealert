// Minimal local stub of the `telephony` package API used by this project.
// This is intended only for local development and builds; replace with the
// real plugin on a device for actual SMS behavior.

class SmsMessage {
  final int? date;
  final String? address;
  final String? body;
  final int? id;

  SmsMessage({this.date, this.address, this.body, this.id});
}

class Telephony {
  Telephony._();
  static final Telephony instance = Telephony._();

  // Simulate permission request
  Future<bool> get requestPhoneAndSmsPermissions async => true;

  // Listen for incoming SMS. Callbacks should be provided.
  void listenIncomingSms({required Function(SmsMessage) onNewMessage, Function? onBackgroundMessage}) {
    // Stub: does nothing. In development you can call onNewMessage manually
    // by exposing a test hook if needed.
  }

  Future<void> sendSms({required String to, required String message}) async {
    // Stub: pretend to send
    return;
  }
}
