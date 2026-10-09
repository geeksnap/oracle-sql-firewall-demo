# Spec Delta

## Purpose

Gives presenters a server-verifiable break-glass grant that works on the HTTP demo host, and failure copy that never pretends a database rollback happened when no mutation was attempted.

## ADDED Requirements

### Requirement: Grant cookies are usable on HTTP demo hosts
When demo seed reset is explicitly enabled, successful break-glass login SHALL set a server-verifiable HttpOnly grant cookie that the browser can store and send on the demo origin. The cookie SHALL use the Secure flag only when the login request is HTTPS (or an explicit secure-cookie override is set). HTTP production `NODE_ENV` SHALL NOT cause the cookie to be dropped.

#### Scenario: HTTP demo login issues a sendable grant
- **WHEN** demo seed reset is enabled and the presenter logs in over `http://` on the demo host
- **THEN** the login response includes `seedGrantIssued: true`
- **AND** the grant cookie is set without the Secure flag
- **AND** a same-origin seed initialization request includes that cookie

#### Scenario: HTTPS login keeps Secure cookies
- **WHEN** the presenter logs in over `https://`
- **THEN** the grant cookie is set with the Secure flag

### Requirement: Client treats seedGrantIssued as the grant
The Aegis Vault client SHALL open the demo seed confirmation only after the login response reports `seedGrantIssued: true` (or an existing server grant remains valid). A successful break-glass login that did not issue a seed grant SHALL NOT open the confirmation modal.

#### Scenario: Login without seed grant
- **WHEN** the presenter activates **Initialize Demo Seed Data** and break-glass login succeeds with `seedGrantIssued: false`
- **THEN** the seed confirmation is not shown
- **AND** the presenter sees that demo seed initialization is not enabled
- **AND** no initialization request is sent

#### Scenario: Login with seed grant
- **WHEN** the presenter activates **Initialize Demo Seed Data** and break-glass login succeeds with `seedGrantIssued: true`
- **THEN** the typed confirmation for `RESET LUMINAFORGE DEMO DATA` is shown

### Requirement: Pre-mutation failures do not claim rollback
Authorization, same-origin, confirmation, and configuration rejections SHALL return a sanitized error and SHALL NOT report rollback status as if a database transaction ran. Rollback copy is reserved for failures after a mutation was attempted.

#### Scenario: Missing grant
- **WHEN** the initialization endpoint is called without a valid grant cookie
- **THEN** the response is an authorization error
- **AND** the presenter-visible message does not include “Rollback could not be confirmed”

#### Scenario: Database mutation fails after starting
- **WHEN** seed initialization reaches the database and then fails
- **THEN** the presenter sees a sanitized failure message plus rollback status
