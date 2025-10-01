---
title: Authentication Implementation
tags: [authentication, oauth, security, backend]
category: features
related:
  - api/auth-endpoints.md
  - database/users.md
  - troubleshooting/auth-errors.md
summary: Complete OAuth 2.0 implementation with Google and GitHub providers, including session management and token refresh
---

# Authentication Implementation

This document describes the authentication system implementation for the video-dubbing platform.

## Overview

We use OAuth 2.0 for authentication with support for multiple providers:
- Google OAuth
- GitHub OAuth
- Email/Password (fallback)

## Architecture

### Components

1. **Auth Service** (`src/services/auth.ts`)
   - Handles OAuth flow
   - Manages JWT tokens
   - Validates user sessions

2. **Auth Middleware** (`src/middleware/auth.ts`)
   - Protects API routes
   - Validates bearer tokens
   - Injects user context

3. **Token Store** (`src/services/token-store.ts`)
   - Redis-backed token storage
   - Automatic token refresh
   - Revocation support

## Implementation Details

### OAuth Flow

```typescript
// Initiate OAuth
GET /auth/oauth/:provider

// Callback handler
GET /auth/callback/:provider
```

The callback handler:
1. Exchanges code for access token
2. Fetches user profile
3. Creates or updates user in database
4. Issues JWT session token
5. Redirects to application

### Session Management

Sessions are managed using JWT tokens with the following claims:

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "provider": "google",
  "iat": 1234567890,
  "exp": 1234657890
}
```

Tokens expire after 7 days and must be refreshed.

## Security Considerations

- All tokens are signed with RS256
- Refresh tokens are stored in HTTP-only cookies
- CSRF protection via state parameter
- Rate limiting on auth endpoints (10 req/min per IP)

## Related Documentation

See also:
- [Auth API Endpoints](../api/auth-endpoints.md) - Complete API reference
- [User Database Schema](../database/users.md) - Database structure
- [Troubleshooting Auth Issues](../troubleshooting/auth-errors.md) - Common problems

## Configuration

Required environment variables:

```bash
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_secret
JWT_SECRET=your_jwt_secret
JWT_PUBLIC_KEY=path/to/public.pem
JWT_PRIVATE_KEY=path/to/private.pem
```

## Testing

Run auth tests:

```bash
npm test -- src/services/auth.test.ts
```

## Future Improvements

- [ ] Add support for SAML/SSO
- [ ] Implement 2FA
- [ ] Add biometric authentication
- [ ] Support for passwordless login
