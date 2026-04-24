# SMS Gateway Flow Documentation

## Overview

The Crime Alert SMS Gateway integrates an Android-based SMS gateway application with the backend to enable bidirectional SMS communication. The system handles both inbound SMS (citizen reports) and outbound SMS (system notifications and acknowledgments).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Crime Alert Backend                          │
│                     (Node.js/Express)                            │
├─────────────────────────────────────────────────────────────────┤
│  Routes: /api/v1/incoming_sms                                   │
│          /api/v1/outgoing_sms                                   │
│          /api/v1/outgoing_sms/result                            │
├─────────────────────────────────────────────────────────────────┤
│  Database (PostgreSQL):                                          │
│  - SmsMessage                                                    │
│  - OutgoingSmsInstruction                                        │
│  - GatewayClient                                                 │
└─────────────────────────────────────────────────────────────────┘
         ↕ HTTP + Bearer Auth
┌─────────────────────────────────────────────────────────────────┐
│              Android SMS Gateway (Flutter App)                   │
│         Running on: Samsung A55 (or any Android device)          │
├─────────────────────────────────────────────────────────────────┤
│  Components:                                                     │
│  - SMS Receiver (BroadcastReceiver)                              │
│  - HTTP Service (polling client)                                 │
│  - Foreground Service (background SMS monitoring)                │
└─────────────────────────────────────────────────────────────────┘
         ↕ Android SMS API
┌─────────────────────────────────────────────────────────────────┐
│           Android Device SMS Modem                               │
│        (Device's native SMS capability)                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Case 1: Inbound SMS (Citizen Report)

### Flow Diagram

```
Citizen sends SMS
    ↓
Android SMS Modem receives SMS
    ↓
BroadcastReceiver captures SMS
    ↓
Gateway app extracts: sender, body, timestamp
    ↓
Gateway POSTs to: /api/v1/incoming_sms
    ├─ Authorization: Bearer test-key
    └─ Body: {id, address, body, date}
    ↓
Backend validateApiKey() check
    ↓
Backend stores in SmsMessage table
    ├─ sender: citizen phone number
    ├─ body: SMS text
    ├─ receivedAt: timestamp
    └─ externalId: gateway's SMS ID
    ↓
Backend auto-creates OutgoingSmsInstruction (ACK SMS)
    ├─ to: citizen phone number
    ├─ body: "CrimeAlert: We received your report..."
    └─ status: "pending"
    ↓
Backend responds with {messageId, ackInstructionId, ackRef}
    ↓
Response logged: "Incoming SMS stored" {id, sender}
```

### Endpoint Details

**POST `/api/v1/incoming_sms`**

**Request:**
```typescript
{
  id?: string;              // External SMS ID from gateway
  address: string;          // Sender phone number
  body: string;            // SMS content
  date?: number;           // Timestamp (ms since epoch)
}
```

**Headers:**
```
Authorization: Bearer test-key
Content-Type: application/json
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "messageId": "4a821f42-b0f9-4d21-847e-3e5541e51430",
    "ackInstructionId": "cd09dc3d-0f17-4d5b-a9f9-a868bbe8f989",
    "ackRef": "SMS-A1B2C3"
  }
}
```

### Database Impact

**Table: `SmsMessage`**
| Column | Value | Example |
|--------|-------|---------|
| id | UUID | `4a821f42-b0f9-4d21-847e-3e5541e51430` |
| sender | Citizen phone | `+263771234567` |
| body | SMS text | `A group of youth is blocking the road...` |
| receivedAt | ISO 8601 datetime | `2024-12-16T18:10:12Z` |
| externalId | Gateway's ID | `android_msg_12345` |
| processed | boolean | `false` (initially) |
| attempts | int | `0` |
| rawPayload | JSON | Full request body |
| createdAt | ISO 8601 datetime | `2024-12-16T18:10:12Z` |

**Table: `OutgoingSmsInstruction`** (ACK created automatically)
| Column | Value | Example |
|--------|-------|---------|
| id | UUID | `cd09dc3d-0f17-4d5b-a9f9-a868bbe8f989` |
| to | Citizen phone | `+263771234567` |
| body | Confirmation message | `CrimeAlert: We received your report (ref SMS-A1B2C3). Thank you.` |
| status | string | `pending` (will be `sent` after gateway processes) |
| attempts | int | `0` |
| platformId | string | null (initially) |
| error | string | null |
| createdAt | ISO 8601 datetime | `2024-12-16T18:10:12Z` |

---

## Case 2: Outbound SMS (System Notification)

### Flow Overview

Outbound SMS has **three stages**:

1. **Create** - Admin/system creates instruction
2. **Poll & Fetch** - Gateway polls for pending instructions
3. **Report & Update** - Gateway reports send status back

### Stage 1: Create Instruction

**Manual creation by admin or system:**
```typescript
// Typically done via API or admin panel
const instruction = await prisma.outgoingSmsInstruction.create({
  data: {
    to: "+263771234567",
    body: "Alert: Crime reported in your area. Stay safe.",
    status: "pending"
  }
});
```

**Table: `OutgoingSmsInstruction` (newly created)**
| Column | Value |
|--------|-------|
| id | `abc12345-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| to | `+263771234567` |
| body | `Alert: Crime reported in your area...` |
| status | `pending` |
| attempts | `0` |
| platformId | null |
| error | null |
| createdAt | `2024-12-16T18:10:30Z` |

---

### Stage 2: Gateway Polls for Instructions

**Flow:**
```
Timer fires (every 5-30 seconds)
    ↓
Gateway app calls: GET /api/v1/outgoing_sms
    ├─ Authorization: Bearer test-key
    └─ Query: status = "pending", limit 50
    ↓
Backend validateApiKey() check
    ↓
Backend queries OutgoingSmsInstruction table
    ├─ where: status = 'pending'
    ├─ orderBy: createdAt ascending
    └─ take: 50 (up to 50 items)
    ↓
Backend returns lightweight payload
    └─ [{id, to, body}, ...]
    ↓
Response logged: "GET /api/v1/outgoing_sms" {ip, userAgent}
```

**Endpoint Details:**

**GET `/api/v1/outgoing_sms`**

**Headers:**
```
Authorization: Bearer test-key
Accept: application/json
```

**Response (200):**
```json
[
  {
    "id": "abc12345-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "to": "+263771234567",
    "body": "Alert: Crime reported in your area..."
  }
]
```

---

### Stage 3: Gateway Sends & Reports Result

**Flow:**
```
Gateway receives pending instructions
    ↓
For each instruction:
  └─ Use Android SMS API to send SMS
    ├─ SmsManager.sendTextMessage()
    └─ Returns success/failure
    ↓
Gateway POSTs to: POST /api/v1/outgoing_sms/result
    ├─ Authorization: Bearer test-key
    └─ Body: {id, status, platform_id, error}
    ↓
Backend validateApiKey() check
    ↓
Backend updates OutgoingSmsInstruction
    ├─ Set status: "sent" or "failed"
    ├─ Set platformId: Android message ID (if success)
    ├─ Set error: error message (if failed)
    └─ Increment attempts: +1
    ↓
Response logged: "Outgoing send result updated" {id, status}
    ↓
Response: {success: true, data: {id, status}}
```

**Endpoint Details:**

**POST `/api/v1/outgoing_sms/result`**

**Request:**
```typescript
{
  id: string;              // Instruction ID from /outgoing_sms
  status: "sent" | "failed" | "pending";
  platform_id?: string;    // Android SMS message ID
  error?: string;          // Error message if failed
}
```

**Headers:**
```
Authorization: Bearer test-key
Content-Type: application/json
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "abc12345-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "status": "sent"
  }
}
```

**Database Impact - `OutgoingSmsInstruction` Updated:**
| Column | Before | After |
|--------|--------|-------|
| id | `abc12345...` | `abc12345...` |
| status | `pending` | `sent` |
| platformId | null | `android_sms_67890` |
| attempts | `0` | `1` |
| error | null | null |
| createdAt | `2024-12-16T18:10:30Z` | `2024-12-16T18:10:30Z` |

---

## API Routes Summary

| Route | Method | Initiated By | Purpose | Tables |
|-------|--------|--------------|---------|--------|
| `/incoming_sms` | POST | Gateway (SMS receiver) | Citizen sends SMS to backend | **Write:** `SmsMessage`, `OutgoingSmsInstruction` |
| `/outgoing_sms` | GET | Gateway (polling loop) | Fetch pending SMS to send | **Read:** `OutgoingSmsInstruction` |
| `/outgoing_sms/result` | POST | Gateway (after send) | Report SMS send status | **Update:** `OutgoingSmsInstruction` |
| `/sms_messages` | GET | Admin web UI | View inbound SMS | **Read:** `SmsMessage` |
| `/sms_messages/:id/mark_processed` | POST | Admin web UI | Mark SMS as processed | **Update:** `SmsMessage` |

---

## Authentication

All SMS gateway endpoints require **API Key Authentication** via Bearer token:

```
Authorization: Bearer {apiKey}
```

**Validation Flow:**
1. Extract `Authorization` header
2. Split by space: `["Bearer", "{apiKey}"]`
3. Query `GatewayClient` table: `findUnique({ where: { apiKey } })`
4. Check `isActive = true`
5. Return 401 if invalid or inactive

**Current Test Key:**
```
apiKey: test-key
id: 3be0eea6-9446-42b5-bc01-c86d688343a6
isActive: true
```

---

## Database Schema Reference

### `SmsMessage` (Inbound SMS)
```prisma
model SmsMessage {
  id          String   @id @default(uuid())
  externalId  String?  // Gateway's SMS ID
  sender      String   // Citizen phone number
  body        String   @db.Text
  receivedAt  DateTime // When SMS was received
  processed   Boolean  @default(false)
  attempts    Int      @default(0)
  rawPayload  Json?    // Full request data
  createdAt   DateTime @default(now())
  
  @@index([sender])
  @@index([processed])
}
```

### `OutgoingSmsInstruction` (Outbound SMS)
```prisma
model OutgoingSmsInstruction {
  id          String   @id @default(uuid())
  to          String   // Recipient phone number
  body        String   @db.Text
  status      String   @default("pending") // pending, sent, failed
  attempts    Int      @default(0)
  platformId  String?  // Android SMS message ID
  error       String?  @db.Text
  createdAt   DateTime @default(now())
  scheduledAt DateTime?
  
  @@index([status])
}
```

### `GatewayClient` (API Credentials)
```prisma
model GatewayClient {
  id        String   @id @default(uuid())
  name      String   // e.g., "Samsung A55 Gateway"
  apiKey    String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  
  @@index([apiKey])
}
```

---

## Example: Complete SMS Lifecycle

### Scenario: Citizen reports crime via SMS, system sends acknowledgment

```
T=0s: Citizen sends SMS "Robbery at Corner Store"
      ↓
T=1s: Android receives SMS via modem
      ↓
T=2s: Gateway app captures in BroadcastReceiver
      ↓
T=3s: Gateway POSTs /api/v1/incoming_sms
      ├─ sender: +263771234567
      ├─ body: "Robbery at Corner Store"
      └─ Response: messageId=MSG123, ackInstructionId=ACK456
      ↓
T=4s: Backend creates:
      ├─ SmsMessage(id=MSG123, sender=+263771234567, body=..., status=unprocessed)
      ├─ OutgoingSmsInstruction(id=ACK456, to=+263771234567, body=ack_msg, status=pending)
      └─ Log: "Incoming SMS stored {MSG123, +263771234567}"
      ↓
T=5s: Gateway polling loop fires
      ├─ GETs /api/v1/outgoing_sms
      └─ Response: [{id: ACK456, to: +263771234567, body: ack_msg}]
      ↓
T=6s: Gateway uses Android SMS API to send ACK SMS
      ├─ SmsManager.sendTextMessage(...)
      └─ Returns: platformId=ANDROID_MSG_789
      ↓
T=7s: Gateway POSTs /api/v1/outgoing_sms/result
      ├─ id: ACK456
      ├─ status: "sent"
      ├─ platform_id: ANDROID_MSG_789
      └─ Response: {success: true, data: {id: ACK456, status: sent}}
      ↓
T=8s: Backend updates:
      ├─ OutgoingSmsInstruction(id=ACK456, status=sent, platformId=ANDROID_MSG_789, attempts=1)
      └─ Log: "Outgoing send result updated {ACK456, sent}"
      ↓
T=9s: Citizen receives ACK SMS: "CrimeAlert: We received your report (ref SMS-ABC123). Thank you."
```

---

## Error Scenarios

### Scenario 1: Invalid API Key

```
Gateway POSTs /api/v1/incoming_sms
├─ Authorization: Bearer invalid-key
│
Backend validateApiKey():
├─ Queries GatewayClient.findUnique({apiKey: "invalid-key"})
├─ Returns null
└─ Responds 401: {success: false, message: "Invalid API key"}
│
Result: SMS NOT stored, gateway receives 401
```

### Scenario 2: SMS Send Fails

```
Gateway receives instruction to send SMS
├─ SmsManager.sendTextMessage(...) fails
│   └─ e.g., No network, incorrect phone number, SIM error
│
Gateway POSTs /api/v1/outgoing_sms/result
├─ id: ACK456
├─ status: "failed"
└─ error: "No network service available"
│
Backend updates:
├─ OutgoingSmsInstruction(id=ACK456, status=failed, error=..., attempts=1)
└─ Log: "Outgoing send result updated {ACK456, failed}"
│
Result: Attempt count incremented, admin can retry or investigate
```

---

## Monitoring & Debugging

### Logs to Watch

**Inbound SMS received:**
```
[info]: Incoming SMS stored {"id":"4a821f42-b0f9-4d21-847e-3e5541e51430","sender":"12345"}
```

**Outbound SMS polled:**
```
[info]: GET /api/v1/outgoing_sms {"ip":"192.168.1.240","userAgent":"Dart/3.10 (dart:io)"}
```

**Outbound SMS result reported:**
```
[info]: POST /api/v1/outgoing_sms/result {"ip":"192.168.1.240","userAgent":"Dart/3.10 (dart:io)"}
[info]: Outgoing send result updated {"id":"cd09dc3d-0f17-4d5b-a9f9-a868bbe8f989","status":"sent"}
```

### Database Queries for Debugging

**View all incoming SMS:**
```sql
SELECT * FROM sms_messages ORDER BY created_at DESC;
```

**View pending outgoing SMS:**
```sql
SELECT * FROM outgoing_sms_instructions WHERE status = 'pending' ORDER BY created_at ASC;
```

**View sent SMS with attempts:**
```sql
SELECT id, to, status, attempts, error FROM outgoing_sms_instructions WHERE status = 'sent' ORDER BY created_at DESC;
```

**View failed SMS:**
```sql
SELECT id, to, error, attempts FROM outgoing_sms_instructions WHERE status = 'failed';
```

---

## Future Enhancements

- [ ] Retry mechanism for failed SMS
- [ ] SMS scheduling (scheduledAt field unused)
- [ ] Multiple gateway clients (load balancing)
- [ ] SMS rate limiting
- [ ] Delivery receipts from carrier
- [ ] Two-way conversation tracking
- [ ] Admin dashboard for SMS analytics
