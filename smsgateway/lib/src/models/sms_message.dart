// Model representing an SMS message used inside the app.
class SmsMessageModel {
  final String id;
  final String address;
  final String body;
  final DateTime date;

  SmsMessageModel({required this.id, required this.address, required this.body, required this.date});

  // Convert to a map for storage / network transport
  Map<String, dynamic> toMap() => {
        'id': id,
        'address': address,
        'body': body,
        'date': date.toIso8601String(),
  };

  factory SmsMessageModel.fromMap(Map<dynamic, dynamic> m) => SmsMessageModel(
        id: m['id']?.toString() ?? '',
        address: m['address']?.toString() ?? '',
        body: m['body']?.toString() ?? '',
        date: DateTime.tryParse(m['date']?.toString() ?? '') ?? DateTime.now(),
  );
}
