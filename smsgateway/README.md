# SMS Gateway Flutter App

A Flutter-based 2-way SMS Gateway application for Android devices with SIM cards. This app captures incoming SMS messages, forwards them to a backend server, and sends outgoing SMS based on server instructions. Designed for reliability in background scenarios, such as crime alert systems.

## Features

- **Incoming SMS Capture**: Listens for incoming SMS and forwards to a configurable backend server.
- **Outgoing SMS Sending**: Polls the server for outgoing instructions and sends SMS accordingly.
- **Background Reliability**: Uses native Android components (BroadcastReceiver, platform channels) for message persistence when the app is not running.
- **Retry Mechanism**: Failed posts are queued and retried periodically.
- **Settings Management**: Configurable server URL and API key via secure storage.
- **Permissions Handling**: Runtime permission requests for SMS-related operations.
- **Clean Architecture**: Modular design with services, repositories, providers, and models.
- **Local Storage**: Hive-based persistence for messages and retry queues.
- **Foreground Service**: Planned for enhanced background processing (currently stubbed).

## Architecture

The app follows Clean Architecture principles:

- **Presentation Layer**: Flutter UI with Provider for state management (`AppState`, `HomePage`, `SettingsPage`).
- **Domain Layer**: Models (`SmsMessageModel`) and business logic.
- **Data Layer**: Repositories (`MessageRepository`) for local storage, Services (`SmsService`, `HttpService`, `SettingsService`) for external interactions.
- **Platform Layer**: Native Android Kotlin code for SMS handling (`SmsReceiver`, `MainActivity` with platform channels).

### Key Components

- **SmsService**: Wraps platform channels for sending/receiving SMS.
- **HttpService**: Handles HTTP POST/GET to backend for incoming/outgoing SMS.
- **AppState**: Central state manager with timers for retry/polling.
- **MessageRepository**: Hive-based storage for messages and retry queue.
- **AndroidSmsService**: Dart wrapper for MethodChannel/EventChannel.
- **SmsReceiver**: Native BroadcastReceiver to capture SMS and persist to JSONL file.
- **MainActivity**: Registers platform channels and dynamic receivers.

## API Endpoints

The app communicates with a backend server via HTTP:

- **POST /incoming_sms**: Send incoming SMS data (address, body, date).
- **GET /outgoing_sms**: Poll for outgoing SMS instructions (returns list of {id, to, body}).
- **POST /outgoing_sms/result**: Report send result (id, status, error).

Configure the server URL and API key in the app's Settings page.

## Technologies Used

- **Flutter**: Cross-platform UI framework (Dart).
- **Android Native**: Kotlin for SMS handling (BroadcastReceiver, platform channels).
- **State Management**: Provider.
- **Local Storage**: Hive (NoSQL database).
- **HTTP Client**: http package.
- **Permissions**: permission_handler.
- **Secure Storage**: flutter_secure_storage for API keys.
- **Notifications**: flutter_local_notifications (planned).
- **Connectivity**: connectivity_plus (planned).
- **Foreground Service**: flutter_foreground_task (stubbed).
- **Testing**: Flutter test framework with mock HTTP server.

## Permissions Required

The app requires the following Android permissions:

- `RECEIVE_SMS`: To capture incoming SMS.
- `SEND_SMS`: To send outgoing SMS.
- `READ_SMS`: To read SMS content.
- `INTERNET`: For HTTP communication.
- `FOREGROUND_SERVICE`: For background processing (planned).
- `RECEIVE_BOOT_COMPLETED`: To restart on boot (planned).
- `WAKE_LOCK`: To keep device awake for processing (planned).

Permissions are requested at runtime via `permission_handler`.

## Security Considerations

- **API Key Storage**: Server API key stored securely using `flutter_secure_storage`.
- **HTTPS**: Always use HTTPS for backend communication.
- **Permission Justification**: SMS permissions are only used for gateway functionality; no data is shared externally without user consent.
- **Data Encryption**: Local Hive storage is encrypted; consider additional encryption for sensitive data.
- **Background Processing**: Native persistence ensures messages aren't lost, but avoid storing sensitive data in plain JSONL.
- **Input Validation**: Validate SMS content and server responses to prevent injection attacks.

## Installation

1. **Prerequisites**:
   - Flutter SDK (^3.10.1)
   - Android SDK (API 21+)
   - Android device or emulator with SIM card support

2. **Clone and Setup**:
   ```bash
   git clone <repo-url>
   cd smsgateway
   flutter pub get
   ```

3. **Android Configuration**:
   - Ensure `android/app/build.gradle.kts` has core library desugaring enabled.
   - Permissions are declared in `AndroidManifest.xml`.

4. **Run**:
   ```bash
   flutter run
   ```

5. **Testing**:
   ```bash
   flutter test
   ```

## Usage

1. **Launch App**: Open the app on an Android device.
2. **Grant Permissions**: Tap "Request SMS Permissions" in Settings if not auto-granted.
3. **Configure Server**: In Settings, enter server URL and API key.
4. **Start Listening**: Tap "Start Listener" to begin capturing incoming SMS.
5. **Monitor Logs**: View logs in the main screen for status and errors.
6. **Outgoing SMS**: The app polls the server periodically for send instructions.

### Background Behavior

- Incoming SMS are captured by `SmsReceiver` even when the app is closed.
- Messages are persisted to `sms_queue.jsonl` and imported when the app starts.
- Failed posts are retried every 20 seconds.
- Outgoing polls every 30 seconds.

## Development Phases

The project was developed in phases:

1. **Setup**: Scaffold app structure, dependencies, basic UI.
2. **SMS Receiving**: Implement incoming SMS capture via native platform channels.
3. **SMS Sending**: Add outgoing SMS sending and server polling.
4. **Retry & Persistence**: Add retry queue and local storage.
5. **Background Service**: Enhance reliability with foreground service (in progress).
6. **Permissions & UI**: Runtime permissions and improved UX.
7. **Testing**: Unit and widget tests.
8. **Production Hardening**: Error handling, logging, security.

## Contributing

- Follow Clean Architecture principles.
- Add tests for new features.
- Update documentation for API changes.
- Use `flutter analyze` and `flutter test` before PRs.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
