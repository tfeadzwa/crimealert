# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Citizen Portal (React)  │  Police Dashboard (React)  │ SMS/USSD │
└────────────┬─────────────┴──────────────┬──────────────┴─────────┘
             │                            │
             │         HTTPS/WSS          │
             │                            │
┌────────────┴────────────────────────────┴──────────────────────┐
│                     API GATEWAY / LOAD BALANCER                 │
└────────────┬────────────────────────────┬──────────────────────┘
             │                            │
┌────────────┴────────────────────────────┴──────────────────────┐
│                   APPLICATION LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Main API Server (Express.js/Node.js)                          │
│  ├── Authentication Service                                     │
│  ├── Report Management Service                                 │
│  ├── User Management Service                                   │
│  ├── Notification Service                                      │
│  └── Analytics Service                                         │
└────────────┬───────────────────┬────────────────┬──────────────┘
             │                   │                │
┌────────────┴─────────┐  ┌─────┴──────┐  ┌─────┴───────────────┐
│   AI/ML Services     │  │  SMS/USSD  │  │  Storage Services   │
│  ├── Speech-to-Text  │  │  Gateway   │  │  ├── File Storage   │
│  ├── Image Analysis  │  │ (Africa's  │  │  │   (S3/Cloud)    │
│  ├── Categorization  │  │  Talking)  │  │  └── Media CDN      │
│  └── Translation     │  └────────────┘  └─────────────────────┘
└──────────────────────┘
             │
┌────────────┴──────────────────────────────────────────────────┐
│                     DATA LAYER                                 │
├────────────────────────────────────────────────────────────────┤
│  PostgreSQL (Primary DB)  │  Redis (Cache/Sessions)            │
└────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Frontend Applications

#### Citizen Portal
- **Purpose**: Public-facing interface for crime reporting
- **Key Features**:
  - Anonymous submission flow
  - Multi-step form with validation
  - Media upload with preview
  - Location picker (map-based)
  - Language selector
  - Report tracking by reference number
  - PWA for offline capability

#### Police Dashboard
- **Purpose**: Law enforcement interface
- **Key Features**:
  - Secure login with 2FA
  - Real-time report feed
  - Case management system
  - Analytics and visualization
  - Evidence viewer
  - Search and filter capabilities
  - Export functionality

### 2. Backend API

#### Core Services

**Authentication Service**
- JWT-based authentication
- Role-based access control (RBAC)
- Session management
- Password hashing (bcrypt)
- Token refresh mechanism

**Report Management Service**
- Report CRUD operations
- Status workflow management
- Evidence attachment handling
- Report prioritization
- Assignment logic

**User Management Service**
- User registration (police officers)
- Profile management
- Role assignment
- Audit logging

**Notification Service**
- Email notifications
- SMS notifications
- In-app notifications
- WebSocket real-time updates

**Analytics Service**
- Crime statistics aggregation
- Trend analysis
- Hotspot identification
- Report generation

### 3. AI/ML Services

#### Speech-to-Text Service
```typescript
interface SpeechToTextService {
  transcribe(audioFile: Buffer, language: string): Promise<{
    text: string;
    confidence: number;
    language: string;
  }>;
}
```

#### Image Analysis Service
```typescript
interface ImageAnalysisService {
  analyze(imageFile: Buffer): Promise<{
    labels: string[];
    objects: DetectedObject[];
    explicitContent: boolean;
    dominantColors: Color[];
  }>;
}
```

#### Categorization Service
```typescript
interface CategorizationService {
  categorize(reportText: string): Promise<{
    category: CrimeCategory;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    keywords: string[];
  }>;
}
```

#### Translation Service
```typescript
interface TranslationService {
  translate(text: string, from: string, to: string): Promise<{
    translatedText: string;
    confidence: number;
  }>;
}
```

### 4. SMS/USSD Gateway

```
User → USSD Code (*XXX#)
  ↓
Africa's Talking API
  ↓
SMS Gateway Service
  ↓
Report Creation
  ↓
SMS Confirmation
```

## Data Models

### Report Model
```typescript
interface Report {
  id: string;
  referenceNumber: string; // For tracking
  type: 'theft' | 'assault' | 'vandalism' | 'other';
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  submittedAt: Date;
  status: 'pending' | 'reviewing' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  isAnonymous: boolean;
  language: 'en' | 'sn' | 'nd';
  media: Media[];
  assignedTo?: string; // Officer ID
  aiAnalysis?: {
    category: string;
    severity: string;
    keywords: string[];
  };
}
```

### User Model
```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'officer' | 'supervisor';
  profile: {
    firstName: string;
    lastName: string;
    badgeNumber: string;
    station: string;
  };
  createdAt: Date;
  lastLogin: Date;
  isActive: boolean;
}
```

### Media Model
```typescript
interface Media {
  id: string;
  reportId: string;
  type: 'image' | 'audio' | 'video';
  url: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  analysis?: {
    labels: string[];
    transcription?: string;
  };
}
```

## Security Architecture

### Authentication Flow
1. User submits credentials
2. Server validates and generates JWT
3. JWT contains: userId, role, expiration
4. Client stores JWT in httpOnly cookie
5. Every request includes JWT
6. Server validates JWT on protected routes

### Anonymous Reporting
- No user identification required
- Generate unique reference number
- No IP address logging
- Optional contact method (encrypted)

### Data Protection
- Encryption at rest (database level)
- Encryption in transit (HTTPS/TLS)
- Sensitive data hashing
- Regular security audits

## API Design

### RESTful Principles
- Resource-based URLs
- HTTP methods (GET, POST, PUT, DELETE)
- Status codes (200, 201, 400, 401, 403, 404, 500)
- JSON response format

### Example Endpoints
```
POST   /api/v1/reports              - Create report
GET    /api/v1/reports/:id          - Get report details
PUT    /api/v1/reports/:id          - Update report
GET    /api/v1/reports/:id/status   - Check status
POST   /api/v1/reports/:id/media    - Upload media

POST   /api/v1/auth/login           - Officer login
POST   /api/v1/auth/refresh         - Refresh token
POST   /api/v1/auth/logout          - Logout

GET    /api/v1/dashboard/reports    - List reports (filtered)
GET    /api/v1/dashboard/analytics  - Get statistics
PUT    /api/v1/dashboard/reports/:id/assign - Assign case
```

## Scalability Considerations

### Horizontal Scaling
- Stateless API servers
- Load balancer distribution
- Database read replicas
- Caching layer (Redis)

### Performance Optimization
- Database indexing
- Query optimization
- CDN for static assets
- Lazy loading images
- Pagination for large datasets

### Monitoring
- Application logs (Winston)
- Error tracking (Sentry)
- Performance metrics (New Relic)
- Uptime monitoring

## Deployment Strategy

### Development Environment
- Local PostgreSQL
- Local Redis (optional)
- Mock AI services
- ngrok for SMS testing

### Production Environment
- Cloud hosting (AWS/Azure/Heroku)
- Managed database (RDS/Cloud SQL)
- Managed Redis (ElastiCache)
- CDN (CloudFront/Cloudflare)
- SSL certificates

## Technology Justification

### Why React?
- Component reusability
- Large ecosystem
- Strong TypeScript support
- Active community

### Why Node.js/Express?
- JavaScript full-stack
- Non-blocking I/O
- Rich package ecosystem
- Easy API development

### Why PostgreSQL?
- ACID compliance
- Complex query support
- JSON support
- Reliability

### Why Redis?
- Fast caching
- Session storage
- Real-time features
- Pub/sub capabilities

## Future Enhancements

1. **Mobile Apps**: Native iOS/Android apps
2. **Real-time Chat**: WebSocket-based chat with officers
3. **Blockchain**: Tamper-proof evidence chain
4. **Advanced AI**: Predictive policing (ethically)
5. **IoT Integration**: CCTV feed integration
6. **Multi-tenancy**: Support multiple cities
