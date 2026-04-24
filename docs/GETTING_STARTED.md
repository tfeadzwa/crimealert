# Getting Started Guide

## Quick Start

This guide will help you set up and run the Crime Alert System on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher): [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **PostgreSQL** (v14 or higher): [Download here](https://www.postgresql.org/download/)
- **Git**: [Download here](https://git-scm.com/)

### Verify Installation

```bash
node --version  # Should show v18.0.0 or higher
npm --version   # Should show v9.0.0 or higher
psql --version  # Should show PostgreSQL 14.x or higher
```

## Step 1: Clone the Repository

```bash
cd ~/Documents/mywork
cd crimealert
```

## Step 2: Set Up the Database

### Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE crimealert;

# Create user (optional)
CREATE USER crimealert_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE crimealert TO crimealert_user;

# Exit PostgreSQL
\q
```

## Step 3: Set Up Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### Configure Backend Environment

Edit `backend/.env` file:

```env
# Minimal configuration for development
NODE_ENV=development
PORT=5000

# Update with your database credentials
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/crimealert?schema=public"

# Generate a random secret for JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# CORS - allow frontend
CORS_ORIGIN=http://localhost:3000

# File uploads
STORAGE_PROVIDER=local
MAX_FILE_SIZE=10485760
```

### Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

### Start Backend Server

```bash
# Development mode with auto-reload
npm run dev

# You should see:
# 🚀 Crime Alert API server running on port 5000
```

Test the API:
```bash
curl http://localhost:5000/health
```

## Step 4: Set Up Frontend

Open a **new terminal window**:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# You should see:
# Local: http://localhost:3000
```

Open your browser and navigate to: **http://localhost:3000**

## Step 5: Verify Everything Works

### Test Frontend
1. Go to http://localhost:3000
2. Click "Report a Crime"
3. Fill out the form
4. Submit and receive a reference number
5. Click "Track Your Report"
6. Enter the reference number

### Test Backend API
```bash
# Health check
curl http://localhost:5000/health

# API info
curl http://localhost:5000/api/v1/

# Create a report (POST)
curl -X POST http://localhost:5000/api/v1/reports \
  -H "Content-Type: application/json" \
  -d '{
    "type": "theft",
    "description": "Test report",
    "location": "Harare CBD"
  }'
```

## Project Structure Overview

```
crimealert/
├── backend/          # Express.js API
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── middleware/
│   │   └── utils/
│   ├── prisma/       # Database schema
│   └── package.json
│
├── frontend/         # React citizen portal
│   ├── src/
│   │   ├── pages/    # HomePage, ReportPage, TrackPage
│   │   └── i18n.ts   # Translations
│   └── package.json
│
└── docs/            # Documentation
```

## Common Issues & Solutions

### Issue: Port Already in Use

**Backend (Port 5000)**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <process_id> /F

# Alternative: Change PORT in backend/.env
PORT=5001
```

**Frontend (Port 3000)**
```bash
# The Vite dev server will automatically try port 3001 if 3000 is busy
```

### Issue: Database Connection Failed

1. Verify PostgreSQL is running:
   ```bash
   # Windows
   sc query postgresql-x64-14
   
   # Start if not running
   net start postgresql-x64-14
   ```

2. Check DATABASE_URL in `.env` is correct
3. Ensure database `crimealert` exists

### Issue: Prisma Migration Errors

```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Then re-run migrations
npx prisma migrate dev
```

### Issue: npm install fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

## Next Steps

Now that your development environment is running:

### 1. Explore the Documentation
- Read `docs/ARCHITECTURE.md` for system design
- Review `docs/DATABASE_SCHEMA.md` for data models
- Check `docs/AI_INTEGRATION.md` for AI features

### 2. Development Workflow

**Backend Development**
```bash
cd backend

# Run in watch mode (auto-reloads)
npm run dev

# Run tests
npm test

# Check code formatting
npm run lint
```

**Frontend Development**
```bash
cd frontend

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### 3. Add Sample Data

Create some test reports to work with:

```bash
cd backend
# Create a seed file (backend/prisma/seed.ts) with sample data
npx prisma db seed
```

### 4. Database Management

```bash
# View database in browser
npx prisma studio

# Create a new migration after schema changes
npx prisma migrate dev --name your_migration_name

# Generate Prisma client after schema changes
npx prisma generate
```

## Development Tips

### Hot Reload
Both frontend and backend support hot reload:
- Backend: Uses nodemon (saves trigger restart)
- Frontend: Uses Vite HMR (instant updates)

### Debugging

**Backend**
- Check terminal for error logs
- Logs are also saved to `backend/logs/`
- Use `console.log()` or debugging tools

**Frontend**
- Open browser DevTools (F12)
- Check Console tab for errors
- Use React DevTools extension

### API Testing Tools

**Postman/Insomnia**
- Import the API collection (create one in docs/)
- Test all endpoints easily

**VS Code REST Client**
- Install REST Client extension
- Create `.http` files with requests

### Git Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add: your feature description"

# Push to repository
git push origin feature/your-feature-name
```

## Performance Optimization

### Backend
- Use Redis for caching (optional in dev)
- Enable compression middleware
- Optimize database queries with indexes

### Frontend
- Lazy load components
- Optimize images
- Use production build for deployment

## Security Checklist

- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET
- [ ] Never commit .env files
- [ ] Use HTTPS in production
- [ ] Validate all inputs
- [ ] Sanitize user content
- [ ] Rate limit API endpoints

## Deployment Preparation

When ready to deploy:

1. **Environment Variables**
   - Set NODE_ENV=production
   - Use production database
   - Configure cloud storage

2. **Build Applications**
   ```bash
   # Backend
   cd backend && npm run build
   
   # Frontend
   cd frontend && npm run build
   ```

3. **Choose Hosting**
   - Backend: Heroku, Railway, Render, AWS
   - Frontend: Vercel, Netlify, Cloudflare Pages
   - Database: Railway, Supabase, AWS RDS

## Getting Help

### Documentation
- Check the `docs/` folder for detailed guides
- Read inline code comments
- Review the README.md

### Troubleshooting
- Check logs in `backend/logs/`
- Use browser DevTools
- Review error messages carefully

### Resources
- [Node.js Documentation](https://nodejs.org/docs/)
- [React Documentation](https://react.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Development Checklist

- [x] PostgreSQL installed and running
- [x] Node.js and npm installed
- [x] Backend dependencies installed
- [x] Frontend dependencies installed
- [x] Database created and migrated
- [x] Environment variables configured
- [x] Backend server running (port 5000)
- [x] Frontend server running (port 3000)
- [ ] Can submit a report
- [ ] Can track a report
- [ ] API endpoints responding

## What's Next?

Continue building features:
1. **Authentication System** - Police officer login
2. **Dashboard** - Police management interface
3. **File Uploads** - Image/audio/video evidence
4. **AI Integration** - Speech-to-text, categorization
5. **SMS/USSD** - Offline reporting
6. **Analytics** - Crime trends and insights

Refer to the project roadmap in README.md for the full development plan.

---

**Happy Coding! 🚀**

If you encounter any issues, check the troubleshooting section or review the logs.
