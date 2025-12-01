# SignNova Backend

A comprehensive backend API for SignNova, a sign language learning platform. Built with Express.js, TypeScript, MongoDB, and modern authentication.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Prisma ORM
- **Authentication**: Better Auth
- **File Storage**: UploadThing (for avatar images, sign videos, user uploads)
- **Real-time**: WebSocket (Socket.io)
- **API**: OpenAI Whisper (audio transcription)

## Features

- 🔐 User authentication and authorization
- 📝 Sign language dictionary management
- 🎤 Audio-to-text transcription (Whisper API)
- 🔄 Text-to-sign translation
- ⭐ Favorites system
- 📊 Learning progress tracking
- 🎯 Achievement system
- 📤 File uploads (avatars, sign videos)
- 🔌 Real-time WebSocket support

## Prerequisites

- Node.js 18+ and npm
- MongoDB database (local or MongoDB Atlas)
- OpenAI API key
- UploadThing account

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd signnova-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   
   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/signnova
   
   BETTER_AUTH_SECRET=your-secret-key-min-32-chars
   BETTER_AUTH_URL=http://localhost:5000
   
   OPENAI_API_KEY=sk-your-openai-key
   
   UPLOADTHING_SECRET=sk_live_your-uploadthing-secret
   UPLOADTHING_APP_ID=your-app-id
   
   FRONTEND_URL=http://localhost:3000
   ```

4. **Set up Prisma**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## Mobile App Authentication

This backend is optimized for mobile applications using Bearer token authentication.

### Bearer Token Flow

1. **Sign Up / Login**: After successful authentication, the API returns a Bearer token in:
   - Response header: `set-auth-token`
   - Response body: `token` field (for convenience)

2. **Store Token**: Mobile apps should store the token securely (e.g., SecureStore in React Native, Keychain in iOS, Keystore in Android)

3. **Authenticate Requests**: Include the token in the `Authorization` header:
   ```
   Authorization: Bearer <your-token>
   ```

4. **Token Refresh**: Use `/api/auth/refresh` to refresh expired tokens

### Example Mobile Request

```typescript
// After login, store the token
const token = response.data.token; // or response.headers['set-auth-token']

// Use token in subsequent requests
fetch('https://api.signnova.com/api/users/me', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user (returns Bearer token)
- `POST /api/auth/login` - Login user (returns Bearer token)
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/session` - Get current session
- `POST /api/auth/refresh` - Refresh token (returns new Bearer token)

**Note**: Better Auth's built-in endpoints are also available at `/api/auth/better-auth/*` for advanced use cases.

### Users
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update profile
- `PATCH /api/users/preferences` - Update preferences

### Signs
- `GET /api/signs` - List signs (with filters: language, category, difficulty)
- `GET /api/signs/:id` - Get sign by ID
- `GET /api/signs/search?q=query` - Search signs by word
- `POST /api/signs/favorites` - Add to favorites
- `DELETE /api/signs/favorites/:id` - Remove from favorites
- `GET /api/signs/favorites/all` - Get user favorites

### Translation
- `POST /api/translate/transcribe` - Audio to text (Whisper)
- `POST /api/translate/text-to-sign` - Text to sign data
- `GET /api/translate/history` - Get translation history
- `WebSocket ws://api/translate/stream` - Real-time transcription

### Progress
- `GET /api/progress` - Get user progress
- `POST /api/progress/update` - Update progress
- `POST /api/progress/streak` - Update streak
- `GET /api/progress/achievements` - Get achievements

### Upload
- `POST /api/upload/avatar` - Upload avatar image
- `POST /api/upload/sign-video` - Upload sign video

## WebSocket Events

### Client → Server
- `transcribe:start` - Start transcription session
- `transcribe:audio` - Send audio chunk for transcription
- `transcribe:stop` - Stop transcription session

### Server → Client
- `transcribe:ready` - Transcription ready
- `transcribe:result` - Transcription result
- `transcribe:error` - Transcription error
- `transcribe:stopped` - Transcription stopped

## Project Structure

```
signnova-backend/
├── src/
│   ├── config/          # Configuration files
│   ├── routes/          # API route handlers
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   ├── websocket/       # Socket.io handlers
│   ├── app.ts           # Express app setup
│   └── server.ts         # Entry point
├── prisma/
│   └── schema.prisma    # Database schema
└── package.json
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:push` - Push schema to database
- `npm run prisma:studio` - Open Prisma Studio

## Database Schema

The application uses MongoDB with Prisma ORM. Key models:

- **User** - User accounts and preferences
- **Sign** - Sign language dictionary entries
- **Progress** - User learning progress
- **Favorite** - User favorite signs
- **Translation** - Translation history

## Development

### Adding New Routes

1. Create controller in `src/controllers/`
2. Create route file in `src/routes/`
3. Add route to `src/routes/index.ts`
4. Add validation schemas in `src/utils/validators.ts`

### Error Handling

All errors are handled by the error middleware. Use custom error classes from `src/utils/errors.ts`:

```typescript
import { NotFoundError, BadRequestError } from "../utils/errors";

throw new NotFoundError("Resource not found");
```

## Testing Checklist

- ✅ Auth: Signup, login, logout working
- ✅ Protected routes require valid session
- ✅ File uploads to UploadThing succeed
- ✅ Audio transcription via Whisper works
- ✅ Database CRUD operations function
- ✅ WebSocket connections stable
- ✅ Error handling returns proper status codes
- ✅ CORS configured for frontend

## Deployment

### Environment Variables

Ensure all environment variables are set in your production environment.

### Database

- Use MongoDB Atlas for production
- Configure IP whitelist
- Enable connection string authentication

### Security

- Set `requireEmailVerification: true` in Better Auth config
- Enable rate limiting
- Use HTTPS in production
- Set secure cookie flags

### Monitoring

Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- Application performance monitoring (APM)

## License

ISC

## Support

For issues and questions, please open an issue on the repository.

