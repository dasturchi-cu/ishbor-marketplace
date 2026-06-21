# USERS_AUTH — Domain Specification

## Purpose & business value

Identity, authentication, workspace roles, and account settings for Ishbor's multi-persona marketplace (client, freelancer, agency, admin). Enables secure access to escrow-protected transactions.

## User journey

1. Guest → `/register` → verify email/OTP → `/welcome` → onboarding wizard
2. Returning → `/login` → `loginSession` → HttpOnly cookie → dashboard by role
3. Settings → `/settings` tabs: account, security, payment, verification, referral, alerts
4. Role switch → nav RoleSwitcher → `setActiveRole` → redirect to role dashboard

## Entities

| Entity | Source | Key fields |
|--------|--------|------------|
| AuthUser | auth.ts / server users | id, email, fullName, userType, username, companySlug, isAdmin, verified |
| AuthSession | auth.ts | user, remember, loggedInAt |
| UserProfile | profile-store | skills, categories, availability, onboardingComplete |
| UserSettings | settings-store | notifications, appearance, language, timezone |
| SecurityState | security-store | twoFAEnabled, sessions[], lastPasswordChange |
| WorkspaceRole | active-role-store | client \| freelancer \| agency |

## Lifecycle & states

**Account status:** `active` | `suspended` | `banned` | `pending` (user-status-store, DB enum)

**Session:** created on login → cookie `ishbor_sid` → destroyed on logout or expiry

**Registration:** pending password (sessionStorage) → OTP verified → DB user or dev registry

## Permissions

| Action | Guest | Auth | Admin |
|--------|-------|------|-------|
| Login/register | ✅ | redirect if session | ✅ |
| Settings | ❌ | own account | ✅ |
| Suspend user | ❌ | ❌ | ✅ |

## Validations

- Email: normalize lowercase, must contain `@`
- Password login: ≥6 chars; registration: ≥8 + strength meter
- OTP demo: exactly `123456`
- Rate limit: 5 attempts / 15 min per email + client bucket

## Current implementation

| Component | Path |
|-----------|------|
| Client auth | `src/lib/auth.ts` |
| Server session | `src/lib/api/session.functions.ts` |
| Credentials | `server/lib/credentials.ts` |
| Guards | `src/lib/guards.ts`, `AuthGate`, `auth-bootstrap.js` |
| Hook | `src/hooks/use-auth.ts` |
| DB schema | `server/db/schema.ts` (users, sessions, user_profiles, active_role_preferences) |

## Database requirements

Tables: `users`, `sessions`, `user_profiles`, `active_role_preferences` (implemented)  
Future: `password_reset_tokens`, `email_verification_tokens`, `oauth_accounts`, `login_attempts`

See DATABASE_SCHEMA.md migrations 001–005.

## API requirements

| Endpoint | Status |
|----------|--------|
| POST /auth/login | via loginSession ✅ |
| POST /auth/logout | via logoutSession ✅ |
| GET /auth/me | via getServerSession ✅ |
| POST /auth/register | via completeRegistrationSession ✅ |
| POST /auth/forgot-password | ❌ |
| POST /auth/reset-password | ❌ |
| GET /auth/oauth/google | ❌ |

## WebSocket / notifications

- `UserLoggedIn`, `AccountSuspended` → notification to user email (target)
- Force logout event on ban (target WS)

## Analytics

Events: `login`, `signup` via analytics-events-store

## Security

- HttpOnly `ishbor_sid`, bcrypt passwords, constant-time compare for unknown emails
- **Removed:** arbitrary email auto-account on login
- **Open:** SSR guard gap, localStorage mirror, demo OTP

## Admin

`suspendAdminUser`, `banAdminUser`, `verifyAdminUser` → syncAccountStatusFromAdmin

## Scalability (100k users)

- Session table indexed on token_hash, user_id
- Session cleanup cron for expired rows
- Redis session cache optional for hot path
- Partition login_attempts by date

## Edge cases

| Case | Recovery |
|------|----------|
| Cookie valid, localStorage empty | hydrateAuthFromServer restores mirror |
| DB down | Demo users via SERVER_DEMO_USERS + memory sessions |
| Suspended while browsing | logout on syncAccountStatusFromAdmin |
| Multi-tab role switch | storage event on active-role key |
