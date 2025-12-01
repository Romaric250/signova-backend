# Mobile App Authentication Guide

This guide explains how to integrate SignNova Backend with mobile applications (React Native, Flutter, etc.).

## Authentication Flow

### 1. Sign Up

```typescript
const response = await fetch('https://api.signnova.com/api/auth/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword123',
    name: 'John Doe',
  }),
});

const data = await response.json();

// Get Bearer token from response
const token = data.token || response.headers.get('set-auth-token');

// Store token securely
await SecureStore.setItemAsync('auth_token', token);
```

### 2. Login

```typescript
const response = await fetch('https://api.signnova.com/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword123',
  }),
});

const data = await response.json();

// Get Bearer token
const token = data.token || response.headers.get('set-auth-token');

// Store token securely
await SecureStore.setItemAsync('auth_token', token);
```

### 3. Making Authenticated Requests

```typescript
// Get stored token
const token = await SecureStore.getItemAsync('auth_token');

// Make authenticated request
const response = await fetch('https://api.signnova.com/api/users/me', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

const userData = await response.json();
```

### 4. Refresh Token

```typescript
const token = await SecureStore.getItemAsync('auth_token');

const response = await fetch('https://api.signnova.com/api/auth/refresh', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const data = await response.json();

// Update stored token
if (data.token) {
  await SecureStore.setItemAsync('auth_token', data.token);
}
```

### 5. Logout

```typescript
const token = await SecureStore.getItemAsync('auth_token');

await fetch('https://api.signnova.com/api/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

// Clear stored token
await SecureStore.deleteItemAsync('auth_token');
```

## React Native Example

```typescript
// authService.ts
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://api.signnova.com';

export const authService = {
  async signUp(email: string, password: string, name: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    
    const data = await response.json();
    const token = data.token || response.headers.get('set-auth-token');
    
    if (token) {
      await SecureStore.setItemAsync('auth_token', token);
    }
    
    return { user: data.user, token };
  },

  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    const token = data.token || response.headers.get('set-auth-token');
    
    if (token) {
      await SecureStore.setItemAsync('auth_token', token);
    }
    
    return { user: data.user, token };
  },

  async getAuthHeaders() {
    const token = await SecureStore.getItemAsync('auth_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  },

  async logout() {
    const headers = await this.getAuthHeaders();
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers,
    });
    await SecureStore.deleteItemAsync('auth_token');
  },
};
```

## Error Handling

The API returns standard HTTP status codes:

- `200` - Success
- `201` - Created (signup)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `409` - Conflict (email already exists)
- `500` - Internal Server Error

Error response format:
```json
{
  "error": "Error message here"
}
```

## Token Expiration

Tokens expire after 7 days. Implement automatic token refresh:

```typescript
async function makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
  let token = await SecureStore.getItemAsync('auth_token');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
  
  // If token expired, refresh and retry
  if (response.status === 401) {
    const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      token = refreshData.token;
      await SecureStore.setItemAsync('auth_token', token);
      
      // Retry original request
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
        },
      });
    } else {
      // Refresh failed, redirect to login
      await SecureStore.deleteItemAsync('auth_token');
      throw new Error('Session expired');
    }
  }
  
  return response;
}
```

