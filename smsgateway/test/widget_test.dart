// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:smsgateway/main.dart';
import 'package:smsgateway/src/providers/app_state.dart';
import 'package:smsgateway/src/services/sms_service.dart';
import 'package:smsgateway/src/services/http_service.dart';

void main() {
  testWidgets('App shows title and status', (WidgetTester tester) async {
    // Provide a real AppState with simple service instances
    final appState = AppState(smsService: SmsService(), httpService: HttpService());

    await tester.pumpWidget(ChangeNotifierProvider<AppState>(
      create: (_) => appState,
      child: const MaterialApp(home: HomePage()),
    ));

    // Expect the app bar title
    expect(find.text('SMS Gateway'), findsOneWidget);
    // Status text should be shown (initially 'idle')
    expect(find.text('idle'), findsOneWidget);
  });
}
