import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter/services.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'src/providers/app_state.dart';
import 'src/services/sms_service.dart';
import 'src/services/http_service.dart';
import 'src/services/settings_service.dart';
import 'package:network_info_plus/network_info_plus.dart';
import 'dart:async';
import 'package:http/http.dart' as http;

// Entry point for the SMS Gateway app. Initializes storage and services.
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Hive for local storage
  await Hive.initFlutter();

  // Create app-level services
  final smsService = SmsService();
  final httpService = HttpService();
  final settingsService = SettingsService();

  // Initialize services (permissions, listeners will be started later)
  await smsService.init();

  // initialize settings and apply baseUrl if present
  await settingsService.init();
  final serverUrl = settingsService.serverUrl;
  httpService.baseUrl = serverUrl;
  // set API key on httpService so outgoing/incoming calls include Authorization header
  final key = await settingsService.getApiKey();
  if (key != null && key.isNotEmpty) {
    httpService.setApiKey(key);
  }

  // create AppState instance so we can run startup tasks before runApp
  final appState = AppState(smsService: smsService, httpService: httpService, settingsService: settingsService);

  // Request SMS permissions at startup (logs outcome) and import any
  // native persisted queue written by the Android receiver.
  appState.addLog('🚀 Gateway app starting...');
  appState.addLog('🌐 Server URL: $serverUrl');
  appState.addLog('🔑 API Key loaded: ${key != null && key.isNotEmpty ? '${key.substring(0, 4)}...' : '<NOT SET - Settings will be empty>'}');
  appState.addLog('ℹ️ To configure: Go to Settings → Enter API Key → Tap Save');
  try {
    appState.addLog('📋 Requesting SMS and related permissions...');
    final perms = await appState.requestSmsPermissions();
    if (perms) {
      appState.addLog('✅ Startup: SMS permissions granted');
      // start listeners automatically when permissions are available
      try {
        await appState.startSmsListeners();
        appState.addLog('✅ Startup: SMS listeners started');
      } catch (e) {
        appState.addLog('❌ Failed to start SMS listeners at startup: $e');
      }
    } else {
      appState.addLog('⚠️ Startup: SMS permissions denied or incomplete');
      appState.addLog('   → Go to Settings → Request SMS Permissions to enable SMS capture');
    }
  } catch (e) {
    // non-fatal, continue
    appState.addLog('❌ Startup permission check failed: $e');
  }

  try {
    await appState.importNativeQueue();
  } catch (e) {
    appState.addLog('❌ Startup importNativeQueue failed: $e');
  }

  runApp(MultiProvider(providers: [
    ChangeNotifierProvider(create: (_) => appState),
  ], child: const SmsGatewayApp()));
}

class SmsGatewayApp extends StatelessWidget {
  const SmsGatewayApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SMS Gateway',
      theme: ThemeData(primarySwatch: Colors.indigo),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  bool _showApiKey = false;

  static String _maskKey(String? key) {
    if (key == null || key.isEmpty) return '<not set>';
    if (key.length <= 6) {
      final a = key.substring(0, 2);
      final b = key.substring(key.length - 2);
      return '$a****$b';
    }
    final visible = 4;
    final last = key.substring(key.length - visible);
    return '****$last';
  }

  void _copyToClipboard(String label, String? value) {
    if (value == null || value.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$label not set')));
      return;
    }
    Clipboard.setData(ClipboardData(text: value));
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$label copied to clipboard')));
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);

    return Scaffold(
      appBar: AppBar(title: const Text('SMS Gateway'), actions: [
        IconButton(
            onPressed: () {
              Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SettingsPage()));
            },
            icon: const Icon(Icons.settings))
      ]),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(children: [
          // Small confirmation card showing current baseUrl and masked apiKey
          Card(
            elevation: 2,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            child: Padding(
              padding: const EdgeInsets.all(12.0),
              child: Row(
                children: [
                  const Icon(Icons.link, color: Colors.indigo),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(children: [
                          Expanded(child: Text('Server: ${appState.httpService.baseUrl}', style: const TextStyle(fontSize: 12))),
                          IconButton(
                            tooltip: 'Copy server URL',
                            icon: const Icon(Icons.copy, size: 18),
                            onPressed: () => _copyToClipboard('Server URL', appState.httpService.baseUrl),
                          ),
                          IconButton(
                            tooltip: 'Health check',
                            icon: const Icon(Icons.health_and_safety, size: 18),
                            onPressed: () async {
                              final hostContext = context;
                              try {
                                final res = await appState.httpService.getHealth();
                                if (!hostContext.mounted) return;
                                showDialog(
                                  context: hostContext,
                                  builder: (dialogContext) => AlertDialog(
                                    title: const Text('Health Check'),
                                    content: Text('Status: ${res.statusCode}\nBody: ${res.body}'),
                                    actions: [TextButton(onPressed: () => Navigator.of(dialogContext).pop(), child: const Text('OK'))],
                                  ),
                                );
                              } catch (e) {
                                if (!hostContext.mounted) return;
                                showDialog(
                                  context: hostContext,
                                  builder: (dialogContext) => AlertDialog(
                                    title: const Text('Health Check'),
                                    content: Text('Failed: $e'),
                                    actions: [TextButton(onPressed: () => Navigator.of(dialogContext).pop(), child: const Text('OK'))],
                                  ),
                                );
                              }
                            },
                          )
                        ]),
                        const SizedBox(height: 6),
                        Row(children: [
                          Expanded(child: Text('API Key: ${_showApiKey ? (appState.httpService.apiKey ?? '<not set>') : _maskKey(appState.httpService.apiKey)}', style: const TextStyle(fontSize: 12))),
                          IconButton(
                            tooltip: _showApiKey ? 'Hide API Key' : 'Show API Key',
                            icon: Icon(_showApiKey ? Icons.visibility_off : Icons.visibility, size: 18),
                            onPressed: () => setState(() => _showApiKey = !_showApiKey),
                          ),
                          IconButton(
                            tooltip: 'Copy API Key',
                            icon: const Icon(Icons.copy, size: 18),
                            onPressed: () => _copyToClipboard('API Key', appState.httpService.apiKey),
                          )
                        ])
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(children: [
            const Text('Status: '),
            Text(appState.status),
            const Spacer(),
            ElevatedButton(
              onPressed: () async => await appState.startSmsListeners(),
              child: const Text('Start Listener'),
            ),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            ElevatedButton(onPressed: () async => await appState.processRetryQueue(), child: const Text('Process Retry')),
            const SizedBox(width: 12),
            ElevatedButton(onPressed: () async => await appState.pollAndSendOutgoing(), child: const Text('Poll Outgoing')),
          ]),
          const SizedBox(height: 12),
          Expanded(
            child: ListView.builder(
              itemCount: appState.logs.length,
              itemBuilder: (context, index) {
                final l = appState.logs.reversed.toList()[index];
                return ListTile(title: Text(l));
              },
            ),
          )
        ]),
      ),
    );
  }
}

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  final _serverController = TextEditingController();
  final _apiController = TextEditingController();
  bool _scanning = false;

  @override
  void initState() {
    super.initState();
    final appState = Provider.of<AppState>(context, listen: false);
    final svc = appState.settingsService;
    if (svc != null) {
      _serverController.text = svc.serverUrl;
      svc.getApiKey().then((k) {
        if (!mounted) return;
        _apiController.text = k ?? '';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context, listen: false);
    final svc = appState.settingsService;
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(children: [
          TextField(controller: _serverController, decoration: const InputDecoration(labelText: 'Server URL')),
          const SizedBox(height: 8),
          const Text('Help: On Android emulator the app uses 10.0.2.2 to reach your development machine. On physical devices, tap "Find Host" to scan the local subnet for a backend responding to /health (this may take a few seconds). For physical devices you may also enter http://<your-host-ip>:5000/api/v1.' , style: TextStyle(fontSize: 12, color: Colors.black54)),
          const SizedBox(height: 8),
            Row(children: [
            ElevatedButton(
              onPressed: _scanning ? null : () async {
                // capture messenger/navigator before any awaits to avoid using
                // BuildContext across async gaps
                final messenger = ScaffoldMessenger.of(context);
                setState(() { _scanning = true; });
                try {
                  final info = NetworkInfo();
                  final ip = await info.getWifiIP();
                  if (!mounted) return;
                  if (ip == null) {
                    messenger.showSnackBar(const SnackBar(content: Text('Could not obtain device IP. Connect to Wi-Fi and try again.')));
                    setState(() { _scanning = false; });
                    return;
                  }

                  final parts = ip.split('.');
                  if (parts.length < 4) {
                    messenger.showSnackBar(const SnackBar(content: Text('Unexpected IP format.')));
                    setState(() { _scanning = false; });
                    return;
                  }
                  final base = '${parts[0]}.${parts[1]}.${parts[2]}';
                  String? found;
                  // scan small range with concurrency
                  final futures = <Future>[];
                  final completer = Completer<void>();
                  int inFlight = 0;
                  const maxConcurrent = 20;

                  Future<void> scheduleCheck(int i) async {
                    final target = '$base.$i';
                    final url = Uri.parse('http://$target:5000/health');
                    try {
                      final res = await http.get(url).timeout(const Duration(milliseconds: 600));
                      if (res.statusCode == 200 && !completer.isCompleted) {
                        found = target;
                        completer.complete();
                      }
                    } catch (_) {
                      // ignore
                    }
                  }

                  for (int i = 1; i <= 254; i++) {
                    // skip own ip
                    if ('$base.$i' == ip) continue;
                    while (inFlight >= maxConcurrent) {
                      await Future.delayed(const Duration(milliseconds: 50));
                    }
                    inFlight++;
                    futures.add(Future(() async {
                      await scheduleCheck(i);
                      inFlight--;
                    }));
                    if (completer.isCompleted) break;
                  }

                  // wait for first found or all finish with timeout
                  await Future.any([completer.future, Future.delayed(const Duration(seconds: 8))]);
                  if (!mounted) return;
                  if (found != null) {
                    final url = 'http://$found:5000/api/v1';
                    _serverController.text = url;
                    messenger.showSnackBar(SnackBar(content: Text('Found backend at $found')));
                  } else {
                    messenger.showSnackBar(const SnackBar(content: Text('Could not find backend on local subnet.')));
                  }
                } catch (e) {
                  if (!mounted) return;
                  messenger.showSnackBar(SnackBar(content: Text('Error while scanning: $e')));
                } finally {
                  setState(() { _scanning = false; });
                }
              },
              child: _scanning ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Find Host'),
            ),
            const SizedBox(width: 12),
            ElevatedButton(onPressed: () { _serverController.text = 'http://10.0.2.2:5000/api/v1'; }, child: const Text('Use Emulator Default'))
          ]),
          const SizedBox(height: 12),
          TextField(controller: _apiController, decoration: const InputDecoration(labelText: 'API Key')),
          const SizedBox(height: 8),
          const Text('Help: The API Key authenticates your gateway with the backend. For testing, you can use "test-key" if it\'s already set up in the backend database.' , style: TextStyle(fontSize: 12, color: Colors.black54)),
          const SizedBox(height: 8),
          Row(children: [
            ElevatedButton(onPressed: () { _apiController.text = 'test-key'; }, child: const Text('Use Test Key')),
          ]),
          const SizedBox(height: 12),
          ElevatedButton(onPressed: () async {
            final navigator = Navigator.of(context);
            if (svc != null) {
              await svc.setServerUrl(_serverController.text.trim());
              print('💾 Settings: Saved server URL = ${_serverController.text.trim()}');
              await svc.setApiKey(_apiController.text.trim());
              print('💾 Settings: Saved API Key = ${_apiController.text.trim()}');
              // Verify it was actually saved
              final verifyKey = await svc.getApiKey();
              print('✓ Settings: Verified API Key read back as = $verifyKey');
              // apply to httpService via appState
              appState.httpService.baseUrl = svc.serverUrl;
              // also set api key so HttpService will include Authorization header
              final newKey = await svc.getApiKey();
              appState.httpService.setApiKey(newKey);
              appState.addLog('✅ Settings saved - Server: ${svc.serverUrl}, API Key: ${newKey != null && newKey.isNotEmpty ? '${newKey.substring(0, 4)}...' : '<not set>'}');
            }
            navigator.pop();
          }, child: const Text('Save')),
          const SizedBox(height: 12),
          ElevatedButton(onPressed: () async {
            // Request permissions on-demand
            // Capture messenger before awaiting to avoid using BuildContext across async gaps
            final messenger = ScaffoldMessenger.of(context);
            final granted = await appState.requestSmsPermissions();
            if (!mounted) return;
            if (granted) {
              appState.addLog('Permissions granted from Settings');
              messenger.showSnackBar(const SnackBar(content: Text('SMS permissions granted')));
              try {
                await appState.startSmsListeners();
                if (!mounted) return;
                appState.addLog('SMS listeners started from Settings');
                messenger.showSnackBar(const SnackBar(content: Text('SMS listeners started')));
              } catch (e) {
                if (!mounted) return;
                appState.addLog('Failed to start listeners: $e');
                messenger.showSnackBar(SnackBar(content: Text('Failed to start listeners: $e')));
              }
            } else {
              appState.addLog('Permissions denied from Settings');
              messenger.showSnackBar(const SnackBar(content: Text('SMS permissions denied')));
            }
          }, child: const Text('Request SMS Permissions'))
        ]),
      ),
    );
  }
}
