# Crime Alert System for Zimbabwe 🚨

## Project Overview

A comprehensive web-based crime reporting platform designed for Zimbabwe, enabling citizens to report crimes safely and anonymously while providing law enforcement with tools for effective monitoring and response.

## Core Features

### Citizen Portal
- **Anonymous Crime Reporting**: Submit reports without revealing identity
- **Multimedia Evidence**: Upload images, record voice notes, share location
- **Multilingual Support**: Interface in English, Shona, and Ndebele
- **Offline Capability**: SMS/USSD integration for areas with limited internet
- **Real-time Updates**: Track report status and receive notifications

### Police Dashboard
- **Incident Management**: View, categorize, and respond to reports
- **Analytics & Insights**: Crime trends, hotspot mapping, statistics
- **Priority Queue**: AI-assisted report prioritization
- **Secure Communication**: Internal messaging and case assignment
- **Evidence Management**: View and manage submitted evidence

### AI-Powered Features
- **Speech-to-Text**: Converts voice reports to text (Multilingual)
- **Image Analysis**: Automatic tagging and classification of evidence
- **Smart Categorization**: AI categorizes reports by crime type
- **Trend Analysis**: Identifies patterns and emerging hotspots
- **Translation**: Automatic translation between supported languages

## Technology Stack

### Frontend
- **Framework**: React.js with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit / Zustand
- **Maps**: Leaflet / Mapbox GL JS
- **PWA**: Service Workers for offline capability
- **i18n**: react-i18next for multilingual support

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (primary) + Redis (caching/sessions)
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **File Storage**: AWS S3 / Cloudinary
- **SMS/USSD**: Africa's Talking API

### AI/ML Services
- **Speech-to-Text**: Google Cloud Speech-to-Text / OpenAI Whisper
- **Image Analysis**: Google Cloud Vision / AWS Rekognition
- **NLP**: OpenAI GPT (categorization) / HuggingFace models
- **Translation**: Google Cloud Translation

### DevOps & Security
- **Version Control**: Git
- **API Documentation**: Swagger/OpenAPI
- **Security**: Helmet.js, CORS, Rate Limiting
- **Logging**: Winston / Pino
- **Testing**: Jest, Supertest, React Testing Library

## Project Structure

```
crimealert/
├── backend/                 # API server
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helper functions
│   │   └── index.ts        # Entry point
│   ├── prisma/             # Database schema
│   ├── tests/              # Backend tests
│   └── package.json
│
├── frontend/               # Citizen portal
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # State management
│   │   ├── utils/          # Helper functions
│   │   ├── locales/        # Translation files
│   │   └── App.tsx
│   └── package.json
│
├── dashboard/              # Police dashboard
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   └── package.json
│
├── ai-services/            # AI microservices
│   ├── speech-to-text/
│   ├── image-analysis/
│   ├── categorization/
│   └── translation/
│
├── sms-gateway/            # SMS/USSD service
│   └── src/
│
├── docs/                   # Documentation
│   ├── api/               # API documentation
│   ├── architecture/      # System design
│   ├── deployment/        # Deployment guides
│   └── user-guide/        # User manuals
│
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Redis (optional, for production)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd crimealert
   ```

2. **Set up Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure your .env file
   npx prisma migrate dev
   npm run dev
   ```

3. **Set up Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm start
   ```

4. **Set up Dashboard**
   ```bash
   cd dashboard
   npm install
   cp .env.example .env
   npm start
   ```

## Security Considerations

- **Data Encryption**: End-to-end encryption for sensitive data
- **Anonymity Protection**: No IP logging for anonymous reports
- **Access Control**: Role-based permissions (Citizen, Officer, Admin)
- **Audit Trails**: Comprehensive logging of all police actions
- **Data Retention**: Automatic anonymization after case closure
- **GDPR/Privacy Compliance**: User data protection and right to deletion

## Ethical Guidelines

1. **User Privacy**: Maintain strict anonymity for reporters
2. **Data Minimization**: Collect only necessary information
3. **Transparency**: Clear communication about data usage
4. **Bias Prevention**: AI models trained to avoid demographic bias
5. **Accountability**: Clear audit trails for police actions
6. **Accessibility**: Interface accessible to users with disabilities

## Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup and architecture
- [ ] Database design and models
- [ ] Basic authentication system
- [ ] API structure and routing

### Phase 2: Core Features (Week 3-4)
- [ ] Citizen report submission
- [ ] File upload and storage
- [ ] Police dashboard basics
- [ ] Report management system

### Phase 3: AI Integration (Week 5-6)
- [ ] Speech-to-text service
- [ ] Image analysis service
- [ ] Report categorization
- [ ] Translation service

### Phase 4: Advanced Features (Week 7-8)
- [ ] SMS/USSD integration
- [ ] Analytics and reporting
- [ ] Crime hotspot mapping
- [ ] Notification system

### Phase 5: Polish & Testing (Week 9-10)
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Documentation completion
- [ ] Deployment preparation

## API Endpoints

### Public Endpoints
- `POST /api/reports` - Submit anonymous report
- `POST /api/reports/media` - Upload evidence
- `GET /api/reports/:id/status` - Check report status
- `POST /api/sms/webhook` - SMS gateway webhook

### Protected Endpoints (Police)
- `GET /api/dashboard/reports` - List all reports
- `PUT /api/dashboard/reports/:id` - Update report
- `GET /api/dashboard/analytics` - Get statistics
- `POST /api/dashboard/reports/:id/assign` - Assign case

### Admin Endpoints
- `GET /api/admin/users` - Manage users
- `GET /api/admin/audit-logs` - View audit trail
- `PUT /api/admin/settings` - Update system settings

## Testing

```bash
# Run backend tests
cd backend && npm test

# Run frontend tests
cd frontend && npm test

# Run e2e tests
npm run test:e2e
```

## Deployment

Detailed deployment instructions available in `docs/deployment/`

- **Development**: Local environment
- **Staging**: Testing server
- **Production**: Cloud platform (AWS/Azure/GCP)

## Contributing

This is an academic project. Contributions should focus on:
- Code quality and best practices
- Security improvements
- Accessibility enhancements
- Documentation clarity

## License

Academic Project - Zimbabwe University

## Contact

Project Team: [Your Team Information]

## Acknowledgments

- Zimbabwe Police Service (for requirements consultation)
- University Supervisors
- Open-source community
