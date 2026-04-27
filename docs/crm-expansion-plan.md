# HuffHealth CRM Expansion Plan

## Goal
Close the biggest product gaps versus Ringy/DFY/AgencyBloc/Agent CRM while preserving the current working lead, task, ticket, and portal flows.

## Phase 1 (Build Now): Communications Hub
- Add Twilio voice + SMS integration.
- Add contact-level conversation timeline (`CALL`, `SMS`, `EMAIL`) with outcomes.
- Add click-to-call and one-click SMS from lead/contact detail.
- Add basic call queue and assignment routing.

## Phase 2: Scheduling + Automation
- Add booking links per staff user.
- Add round-robin assignment rules by lead source/state.
- Add reminder automations (SMS/email) for appointments and follow-ups.
- Add no-show and reschedule workflows.

## Phase 3: Insurance Operations
- Add policy records as first-class entities (carrier, premium, effective/renewal dates).
- Add renewal pipeline and grace/lapse rescue automations.
- Add compliance tracking (SOA date, license expiry, cert status).

## Phase 4: Quote + Enrollment Integrations
- Add adapter-based integration layer for quoting/enrollment providers.
- Add webhook ingestion for quote status changes and policy issuance.
- Map quote lifecycle to lead and policy entities.

## Phase 5: Commission Visibility
- Add commissions ledger and statement reconciliation.
- Add producer split rules and payout tracking.
- Add variance reporting and exception queue.

## Data Model Additions (Initial)
- `ConversationThread`
- `ConversationMessage`
- `CallLog`
- `Appointment`
- `Policy`
- `ComplianceItem`
- `QuoteRecord`
- `CommissionEntry`

## Delivery Notes
- Use feature flags per module so sandbox testing stays isolated.
- Keep existing lead import, dashboard, and portal behavior unchanged during Phase 1.
- Build phase-by-phase with migration scripts per module.
