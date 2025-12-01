# SignNova Backend - Setup Instructions

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Initialize database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Environment Variables Required

- `DATABASE_URL` - MongoDB connection string
- `BETTER_AUTH_SECRET` - Secret key for Better Auth (min 32 characters)
- `BETTER_AUTH_URL` - Base URL of your API (e.g., http://localhost:5000)
- `OPENAI_API_KEY` - OpenAI API key for Whisper transcription
- `UPLOADTHING_SECRET` - UploadThing secret key
- `UPLOADTHING_APP_ID` - UploadThing app ID
- `FRONTEND_URL` - Frontend/mobile app URL for CORS

## Mobile App Integration

See [MOBILE_AUTH.md](./MOBILE_AUTH.md) for detailed mobile app integration guide.

## Testing the API

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Sign Up
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Get User Profile (with Bearer token)
```bash
curl http://localhost:5000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Project Structure

- `src/config/` - Configuration files (database, auth, uploadthing)
- `src/routes/` - API route definitions
- `src/controllers/` - Request handlers
- `src/services/` - Business logic (transcription, translation, upload)
- `src/middleware/` - Express middleware (auth, validation, error handling)
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions (errors, logger, validators)
- `src/websocket/` - Socket.io handlers for real-time features

## Common Issues

### Better Auth API Methods
If you encounter issues with `auth.api.signUpEmail` or `auth.api.signInEmail`, you can use Better Auth's built-in endpoints directly:
- `/api/auth/better-auth/sign-up/email`
- `/api/auth/better-auth/sign-in/email`

These endpoints automatically handle Bearer tokens for mobile apps.

### Database Connection
Ensure MongoDB is running and the connection string is correct. For MongoDB Atlas, whitelist your IP address.

### CORS Issues
Make sure `FRONTEND_URL` in `.env` matches your mobile app's API base URL.

## Next Steps

1. Set up production environment variables
2. Configure rate limiting
3. Set up monitoring (Sentry, LogRocket)
4. Enable email verification in production
5. Configure HTTPS
6. Set up CI/CD pipeline

