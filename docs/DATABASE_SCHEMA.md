# Database Schema Design

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Reports   │────────<│    Media     │         │    Users    │
│             │         │              │         │             │
│  PK: id     │         │  PK: id      │         │  PK: id     │
│  reference  │         │  FK: report  │         │  email      │
│  type       │         │  type        │         │  password   │
│  desc       │         │  url         │         │  role       │
│  location   │         │  analysis    │         │  profile    │
│  status     │         └──────────────┘         │             │
│  priority   │                                  └──────┬──────┘
│  FK: assign │                                         │
└──────┬──────┘                                         │
       │                                                │
       │                                                │
       │         ┌──────────────┐                       │
       └────────>│ Assignments  │<──────────────────────┘
                 │              │
                 │  FK: report  │
                 │  FK: user    │
                 │  assigned_at │
                 └──────────────┘

┌──────────────┐         ┌──────────────┐
│ Audit_Logs   │         │ Notifications│
│              │         │              │
│  PK: id      │         │  PK: id      │
│  FK: user    │         │  FK: user    │
│  action      │         │  type        │
│  resource    │         │  message     │
│  timestamp   │         │  read        │
└──────────────┘         └──────────────┘

┌──────────────┐
│  Categories  │
│              │
│  PK: id      │
│  name        │
│  desc        │
│  severity    │
└──────────────┘
```

## Table Definitions

### Reports Table
Primary table for storing crime reports.

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number VARCHAR(20) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200),
  description TEXT NOT NULL,
  
  -- Location data
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  landmark TEXT,
  
  -- Report metadata
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  occurred_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  
  -- Anonymity
  is_anonymous BOOLEAN DEFAULT TRUE,
  contact_method VARCHAR(20), -- 'none', 'email', 'phone', 'sms'
  contact_value_encrypted TEXT, -- Encrypted contact info
  
  -- Language and translation
  original_language VARCHAR(5) DEFAULT 'en',
  translated_versions JSONB, -- {en: "...", sn: "...", nd: "..."}
  
  -- AI analysis
  ai_category VARCHAR(50),
  ai_severity VARCHAR(20),
  ai_keywords TEXT[],
  ai_confidence DECIMAL(3, 2),
  
  -- Assignment
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMP,
  
  -- Resolution
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  
  -- Soft delete
  deleted_at TIMESTAMP,
  
  -- Indexes
  INDEX idx_reference_number (reference_number),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_location (latitude, longitude),
  INDEX idx_submitted_at (submitted_at),
  INDEX idx_assigned_to (assigned_to)
);
```

### Users Table
Police officers and administrators.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'admin', 'supervisor', 'officer'
  
  -- Profile
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  badge_number VARCHAR(50) UNIQUE,
  station VARCHAR(100),
  department VARCHAR(100),
  phone VARCHAR(20),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  
  -- 2FA
  two_factor_secret VARCHAR(255),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  
  -- Soft delete
  deleted_at TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_badge_number (badge_number),
  INDEX idx_role (role)
);
```

### Media Table
Files attached to reports (images, audio, video).

```sql
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  
  -- File info
  type VARCHAR(20) NOT NULL, -- 'image', 'audio', 'video'
  original_filename VARCHAR(255),
  file_size BIGINT, -- bytes
  mime_type VARCHAR(100),
  
  -- Storage
  storage_provider VARCHAR(50), -- 's3', 'cloudinary'
  storage_key VARCHAR(500),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- AI analysis
  analysis_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  analysis_result JSONB, -- {labels: [], objects: [], explicit: false, etc.}
  transcription TEXT, -- For audio/video
  transcription_language VARCHAR(5),
  
  -- Metadata
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  
  INDEX idx_report_id (report_id),
  INDEX idx_type (type)
);
```

### Assignments Table
Track report assignments to officers.

```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by UUID REFERENCES users(id), -- Supervisor who assigned
  
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'reassigned'
  notes TEXT,
  
  completed_at TIMESTAMP,
  
  INDEX idx_report_id (report_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);
```

### Audit Logs Table
Track all actions for accountability.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  
  action VARCHAR(100) NOT NULL, -- 'view_report', 'update_status', 'assign', etc.
  resource_type VARCHAR(50), -- 'report', 'user', 'media'
  resource_id UUID,
  
  details JSONB, -- Additional action details
  ip_address INET,
  user_agent TEXT,
  
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_resource (resource_type, resource_id),
  INDEX idx_timestamp (timestamp)
);
```

### Notifications Table
System notifications for users.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  
  type VARCHAR(50) NOT NULL, -- 'new_report', 'assignment', 'status_update'
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  
  related_resource_type VARCHAR(50),
  related_resource_id UUID,
  
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
);
```

### Categories Table
Crime categories with metadata.

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en VARCHAR(100) NOT NULL,
  name_sn VARCHAR(100),
  name_nd VARCHAR(100),
  
  description_en TEXT,
  description_sn TEXT,
  description_nd TEXT,
  
  default_severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
  icon VARCHAR(50),
  color VARCHAR(20),
  
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_is_active (is_active)
);
```

### SMS Reports Table
Track reports submitted via SMS/USSD.

```sql
CREATE TABLE sms_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id),
  
  phone_number_hash VARCHAR(255), -- Hashed for privacy
  session_id VARCHAR(100),
  
  raw_message TEXT,
  parsed_data JSONB,
  
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  processing_status VARCHAR(20) DEFAULT 'pending',
  
  response_sent TEXT,
  response_sent_at TIMESTAMP,
  
  INDEX idx_session_id (session_id),
  INDEX idx_received_at (received_at)
);
```

## Sample Data for Categories

```sql
INSERT INTO categories (name_en, name_sn, name_nd, description_en, default_severity, icon, color) VALUES
('Theft', 'Kuba', 'Ukwebiwa', 'Stealing of property or goods', 'medium', 'theft', '#FF9800'),
('Assault', 'Kurohwa', 'Ukushaywa', 'Physical violence against a person', 'high', 'assault', '#F44336'),
('Vandalism', 'Kuparadza', 'Ukonakalisa', 'Deliberate destruction of property', 'medium', 'vandalism', '#9C27B0'),
('Burglary', 'Kupaza', 'Ukugqekeza', 'Breaking and entering property', 'high', 'burglary', '#E91E63'),
('Vehicle Theft', 'Kuba Mota', 'Ukuntshontshwa Kwemoto', 'Theft of vehicles', 'high', 'car-theft', '#FF5722'),
('Robbery', 'Kupamba', 'Ukuphanqa', 'Theft using force or threat', 'critical', 'robbery', '#D32F2F'),
('Fraud', 'Kunyengera', 'Ukukhohlisa', 'Deception for financial gain', 'medium', 'fraud', '#FFC107'),
('Drug Related', 'Zvinonetsa Zvinodhaka', 'Okuphathelene Nezidakamizwa', 'Drug possession or trafficking', 'high', 'drugs', '#673AB7'),
('Domestic Violence', 'Kurohwa Mumba', 'Udlakelo Ekhaya', 'Violence in domestic settings', 'critical', 'domestic', '#C62828'),
('Other', 'Zvimwe', 'Okunye', 'Other types of incidents', 'low', 'other', '#607D8B');
```

## Indexes for Performance

```sql
-- Full-text search on descriptions
CREATE INDEX idx_reports_description_fulltext ON reports USING gin(to_tsvector('english', description));

-- Geospatial queries
CREATE INDEX idx_reports_location_gist ON reports USING gist(point(longitude, latitude));

-- Composite indexes for common queries
CREATE INDEX idx_reports_status_priority ON reports(status, priority, submitted_at DESC);
CREATE INDEX idx_reports_assigned_status ON reports(assigned_to, status) WHERE assigned_to IS NOT NULL;
```

## Views for Common Queries

```sql
-- View for dashboard statistics
CREATE VIEW dashboard_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'pending') as pending_reports,
  COUNT(*) FILTER (WHERE status = 'investigating') as investigating_reports,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_reports,
  COUNT(*) FILTER (WHERE priority = 'critical') as critical_reports,
  COUNT(*) FILTER (WHERE submitted_at > CURRENT_DATE - INTERVAL '24 hours') as reports_today,
  COUNT(*) FILTER (WHERE submitted_at > CURRENT_DATE - INTERVAL '7 days') as reports_this_week
FROM reports
WHERE deleted_at IS NULL;

-- View for officer workload
CREATE VIEW officer_workload AS
SELECT
  u.id,
  u.first_name,
  u.last_name,
  COUNT(a.id) as active_cases,
  COUNT(a.id) FILTER (WHERE r.priority = 'critical') as critical_cases,
  MAX(a.assigned_at) as last_assignment
FROM users u
LEFT JOIN assignments a ON u.id = a.user_id AND a.status = 'active'
LEFT JOIN reports r ON a.report_id = r.id
WHERE u.role = 'officer' AND u.is_active = TRUE
GROUP BY u.id, u.first_name, u.last_name;
```

## Privacy and Security Notes

1. **Anonymity**: Anonymous reports have no user identification
2. **Encryption**: Contact information is encrypted at application level
3. **Phone Hashing**: Phone numbers from SMS are hashed, not stored plain
4. **Audit Trail**: All officer actions are logged
5. **Data Retention**: Reports can be anonymized after resolution
6. **Access Control**: Row-level security can be implemented for multi-station deployment
