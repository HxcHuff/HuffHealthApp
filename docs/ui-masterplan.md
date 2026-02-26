# HuffHealth UI Masterplan

## Objective
Design a complete UI that outperforms Ringy, DFY CRM, AgencyBloc, and Agent CRM on speed, clarity, and insurance-specific workflows before backend expansion.

## Product Promise
- One command center for lead generation, enrollment, policy servicing, retention, and agency performance.
- Reduce context switching with a unified inbox, unified timeline, and action-first workflows.
- Support solo agents, teams, and agency owners with role-specific views.

## Primary Personas
- Agency Owner: Needs pipeline, production, compliance, recruiting, and commissions visibility.
- Sales Manager: Needs team pipeline, SLA adherence, coaching, and conversion diagnostics.
- Producer/Agent: Needs fast daily work queue, communication tools, and policy lifecycle tasks.
- Service/Retention Rep: Needs tickets, policy changes, renewals, and client communication history.
- Client/Policyholder: Needs portal for tickets, documents, updates, and appointment requests.

## UX Principles
- Action-first pages with “next best actions” at top.
- Every record has one timeline for calls, SMS, emails, notes, tickets, tasks, documents.
- Insurance workflows are pre-structured, not generic CRM forms.
- Mobile-first productivity for field agents.
- Consistent table + pipeline + detail triad across modules.

## Global Information Architecture
1. Command Center
2. Inbox
3. Leads
4. Clients
5. Policies
6. Quotes
7. Tasks
8. Tickets
9. Campaigns
10. Calendar
11. Documents
12. Compliance
13. Recruiting
14. Analytics
15. Automations
16. Integrations
17. Settings

## Role-Based Navigation
### Admin/Owner
- Full navigation with Recruiting, Analytics, Compliance, Automations, Integrations, Settings.

### Staff/Manager
- Full operations except advanced billing, user admin, and some integration/security controls.

### Agent
- Command Center, Inbox, Leads, Clients, Policies, Quotes, Tasks, Calendar, Tickets, Documents.

### Client Portal
- Home, My Policies, My Tickets, My Documents, Appointments, Updates, Profile.

## Workspace Shell
- Left rail: Role-aware primary navigation.
- Top bar: Global search, quick create, notifications, profile, environment badge.
- Right utility panel: Context actions, activity feed, AI assistant, pinned items.
- Command palette: `Cmd/Ctrl + K` for global navigation and quick actions.

## Core UI Systems
### 1) Command Center
- Purpose: Daily mission control.
- Blocks: KPI strip, today’s priorities, overdue queue, appointment board, SLA risk panel, team leaderboard.
- Key actions: Call next lead, send SMS batch, assign workload, create campaign, escalate ticket.

### 2) Unified Inbox
- Channels: SMS, call logs, email threads, internal mentions, webhook alerts.
- Views: Unassigned, Mine, Team, Escalations, VIP.
- Features: Priority scoring, SLA timers, macros, dispositions, handoff notes.

### 3) Leads Workspace
- Views: Kanban pipeline, list table, map view.
- Filters: Source, age, state, life event, stage age, producer, campaign, product type.
- Record detail tabs: Overview, Timeline, Quotes, Policies, Tasks, Tickets, Documents.
- Actions: Call, text, email, book meeting, set follow-up, move stage, assign owner.

### 4) Clients Workspace
- Views: Client health list, household view, renewal board.
- Health indicators: Renewal window, payment risk, open service tasks, NPS sentiment.
- Record detail tabs: Policies, Servicing, Communications, Claims notes, Family/Dependents, Billing summary.

### 5) Policies Workspace
- Views: Active, pending, renewal due, grace period, lapsed, cancelled.
- Policy card: Carrier, premium, effective date, renewal date, status, producer, commission class.
- Actions: Renewal outreach, change request, reinstatement flow, document request.

### 6) Quotes Workspace
- Views: New quote requests, in progress, proposal sent, won, lost.
- Compare panel: Plan options, premium deltas, deductible, network fit.
- Actions: Generate proposal packet, request missing info, convert quote to policy.

### 7) Tasks Workspace
- Views: My queue, team queue, board by due date, board by process.
- Task types: Follow-up, renewal call, SOA check, document collection, escalation.
- Features: Auto-priority score, SLA clock, one-click completion templates.

### 8) Tickets Workspace
- Views: Service queue, escalations, policy-change queue, billing queue.
- SLA layer: First response timer, resolution timer, breach predictors.
- Features: Public/internal comments, templates, assignment rules, CSAT capture.

### 9) Campaigns Workspace
- Campaign types: Lead nurture, renewal rescue, cross-sell, win-back.
- Builder UI: Audience, sequence steps, channel mix, scheduling, suppressions.
- Performance: Delivery, response, appointment rate, conversion, unsubscribe.

### 10) Calendar Workspace
- Views: Day, week, agenda, agent availability heatmap.
- Features: Booking links, round-robin routing, confirmation and reminder templates.

### 11) Documents Workspace
- Buckets: Applications, SOA, IDs, policy docs, service forms, compliance docs.
- Features: Request list, upload status, expiration tracking, e-sign launch points.

### 12) Compliance Workspace
- Modules: License expiration, CE credits, product certs, SOA records.
- Alerts: Due soon, overdue, blocked sales actions.
- Audit timeline: Who changed what and when.

### 13) Recruiting Workspace
- Funnel: Prospecting, interview, onboarding, licensed, active producer.
- Features: Scorecards, checklist automation, mentor assignment.

### 14) Analytics Workspace
- Executive: Revenue trend, conversion funnel, retention, lapse risk, team productivity.
- Operational: Lead aging, SLA breaches, campaign ROI, source quality.
- Agent scorecard: Activities, appointments, quotes, closes, persistency.

### 15) Automations Workspace
- Builder: Trigger, conditions, actions, cooldown, failover.
- Templates: Renewal reminders, missed call response, no-show re-engagement, lapse prevention.
- Simulation: Preview who would trigger and why.

### 16) Integrations Workspace
- Categories: Telephony, SMS, email, quoting platforms, policy admin, accounting, ad platforms.
- Features: Connection health, token status, webhook logs, retry queue.

### 17) Settings Workspace
- Modules: Team roles, routing rules, templates, dispositions, custom fields, branding, permissions.

## Screen Inventory (Build Targets)
1. `/dashboard`
2. `/inbox`
3. `/leads`
4. `/leads/pipeline`
5. `/leads/:id`
6. `/clients`
7. `/clients/:id`
8. `/policies`
9. `/policies/:id`
10. `/quotes`
11. `/quotes/:id`
12. `/tasks`
13. `/tickets`
14. `/tickets/:id`
15. `/campaigns`
16. `/campaigns/:id`
17. `/calendar`
18. `/documents`
19. `/compliance`
20. `/recruiting`
21. `/analytics`
22. `/automations`
23. `/integrations`
24. `/settings`
25. `/portal`
26. `/portal/policies`
27. `/portal/tickets`
28. `/portal/documents`
29. `/portal/appointments`

## Standard Page Pattern
- Header row: Title, context chips, primary CTA, secondary CTA.
- Action row: Search, filter presets, saved views, bulk actions.
- Main area: Table or board.
- Side panel: Record preview, quick edit, AI summary, timeline snippet.
- Footer tools: Export, sync status, pagination, keyboard shortcut hints.

## Shared Components Library
- `KPIStatCard`
- `PriorityQueueCard`
- `ChannelInboxList`
- `TimelineComposer`
- `TimelineEventItem`
- `LeadStageBoard`
- `PolicyStatusBadge`
- `SlaTimerChip`
- `RiskScorePill`
- `SavedViewToolbar`
- `BulkActionBar`
- `SmartFilterBuilder`
- `RecordSidePanel`
- `WorkflowStepper`
- `ComplianceChecklist`
- `CommissionBreakdownCard`
- `CarrierHealthWidget`

## Visual Direction
- Tone: Professional, energetic, high-contrast action surfaces.
- Color strategy: Blue for navigation, emerald for success, amber for caution, red for breach/risk, slate for passive data.
- Typography: Distinct heading and UI text pairing with high scanability.
- Motion: Fast list-to-detail transitions and staged dashboard reveals.
- Density modes: Comfortable and Compact toggle.

## Critical Process Maps
### Lead to Policy Issued
1. Lead enters via source.
2. Routed by rules.
3. Contact sequence starts.
4. Qualification + needs capture.
5. Quote generated and compared.
6. Proposal sent.
7. Application started.
8. Document checklist completed.
9. Policy issued.
10. Renewal workflow scheduled.

### Policy Service Lifecycle
1. Client request opens ticket.
2. Categorize request type.
3. Assign by SLA policy.
4. Work task checklist.
5. Client update cadence.
6. Resolution confirmation.
7. CSAT capture.
8. Timeline archive.

### Renewal Retention Cycle
1. Renewal enters 90-day window.
2. Risk score generated.
3. Segment by policy type and risk.
4. Automated outreach sequence.
5. Agent intervention tasks.
6. Offer and recommendation.
7. Renewal completed or lapse rescue path.

## Frontend-First Build Sequence
### Sprint A: App Shell + Design System
- Build new navigation shell.
- Build shared components and page scaffolds.
- Add feature flag gates for new workspaces.

### Sprint B: Inbox + Lead/Client Detail V2
- Build unified timeline UI and inbox queue.
- Build new detail tabs and quick-action panel.
- Keep existing backend data bindings and mock missing modules.

### Sprint C: Policies + Quotes + Calendar UI
- Build list/detail pages with mock adapters.
- Implement quote compare visual and renewal board UI.

### Sprint D: Campaigns + Automations + Compliance UI
- Build builders and monitoring screens.
- Add simulation UIs with static/mock execution results.

### Sprint E: Analytics + Recruiting + Portal V2
- Build executive dashboards and scorecards.
- Build recruiting funnel and upgraded client portal pages.

## Backend Readiness Contracts (UI First)
- Every new workspace uses typed mock contracts now and adapter interfaces later.
- Standard data primitives: `id`, `status`, `owner`, `priority`, `riskScore`, `createdAt`, `updatedAt`.
- All lists support server pagination, sorting, and saved views from day one.

## Success Metrics
- Daily active agent actions per user.
- Time-to-first-contact for new leads.
- Quote-to-bind conversion rate.
- Ticket first response and resolution SLA attainment.
- Renewal retention rate.
- Lapse recovery rate.
- Producer ramp time.

## Immediate Next Artifacts
1. Low-fidelity wireframes for all 29 routes.
2. Component API spec (`props`, states, empty/loading/error variants).
3. Clickable prototype for Command Center, Inbox, Leads, and Policy detail.
4. Frontend ticket backlog with acceptance criteria per screen.
