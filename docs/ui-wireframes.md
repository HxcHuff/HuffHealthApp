# HuffHealth UI Wireframes (Low-Fidelity Spec)

## Layout Legend
- Header: title, summary, primary CTA, secondary CTA.
- Toolbar: search, quick filters, saved views, bulk actions.
- Main: table/kanban/cards/calendar.
- Side panel: timeline preview, quick actions, status chips.

## 1) /dashboard (Command Center)
- Header: "Command Center", date, quick create.
- KPI strip: New leads, quote rate, bind rate, renewal risk, open SLA breaches.
- Panels:
  - Priority queue (today)
  - Team leaderboard
  - Appointment board
  - Renewal-at-risk list
  - Escalated ticket queue

## 2) /inbox
- Left column: filters (Unassigned, Mine, Team, Escalations, VIP).
- Middle: thread list with channel icon, SLA timer, owner.
- Right: conversation pane, templates, dispositions, reassign.
- Footer action bar: call, SMS, email, task, ticket.

## 3) /leads
- Toolbar filters: source, stage, state, age, owner, campaign.
- Main: high-density lead table with sticky columns.
- Side panel: lead summary + next best action.

## 4) /leads/pipeline
- 6-stage kanban with WIP counts.
- Card: name, source, days in stage, risk flag, owner avatar.
- Bulk stage moves and SLA warning badges.

## 5) /leads/:id
- Top strip: stage selector + call/text/email buttons.
- Tabs: Overview, Timeline, Quotes, Policies, Tasks, Tickets, Documents.
- Right panel: AI summary + playbook actions.

## 6) /clients
- Main list: client health score, renewal window, open service tasks.
- Saved views: Healthy, At Risk, Renewal 90 Days, Lapse Recovery.

## 7) /clients/:id
- 360 profile with household members.
- Tabs: Policies, Service, Communications, Billing, Documents.

## 8) /policies
- Queue tabs: Active, Pending, Renewal Due, Grace Period, Lapsed, Canceled.
- Columns: carrier, product, premium, renewal date, producer, status.

## 9) /policies/:id
- Policy timeline and servicing checklist.
- Renewal runway tracker (90/60/30/7 day markers).

## 10) /quotes
- Queue tabs: New, In Progress, Proposal Sent, Won, Lost.
- Priority chips: response due, missing documents, high fit.

## 11) /quotes/:id
- Side-by-side plan comparison cards.
- Recommendation panel with rationale and conversion CTA.

## 12) /tasks
- Split pane: My tasks + Team tasks.
- Group by due date, workflow, or priority.

## 13) /tickets
- SLA board with swimlanes by category.
- First-response and resolution timers on each ticket row.

## 14) /tickets/:id
- Ticket details, public/internal thread, related policy/client context.

## 15) /campaigns
- Campaign cards: status, audience size, response rate, booked appointments.

## 16) /campaigns/:id
- Flowchart-style sequence steps with per-step performance.

## 17) /calendar
- Week view with booking overlays and team load heatmap.

## 18) /documents
- Request queue + uploaded docs table + missing items panel.

## 19) /compliance
- Checklist board: license, CE, certs, SOA.
- Due-soon and blocked actions widgets.

## 20) /recruiting
- Producer recruiting kanban from candidate to active.

## 21) /analytics
- Executive summary row + deep-dive tabs:
  - Funnel
  - Retention
  - SLA
  - Team Productivity
  - Campaign ROI

## 22) /automations
- Rule builder canvas with trigger/condition/action columns.
- Simulation panel with "would trigger" preview list.

## 23) /integrations
- Cards by category (telephony, ads, quoting, policy admin).
- Health chips: connected/degraded/disconnected.

## 24) /settings
- Sections: users, permissions, routing, templates, custom fields, branding.

## Portal Routes
## 25) /portal
- Summary cards: policy count, open tickets, next appointment.

## 26) /portal/policies
- Client policy list with coverage snapshots and renewal dates.

## 27) /portal/tickets
- Ticket list with status and latest response.

## 28) /portal/documents
- Upload checklist with status and due dates.

## 29) /portal/appointments
- Available slots, booked appointments, reminders.
