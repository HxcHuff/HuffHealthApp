# HuffHealth Component API Contracts

## Conventions
- Common props: `loading`, `error`, `emptyState`, `onRefresh`.
- All list components accept `items`, `page`, `pageSize`, `total`, `onPageChange`.
- All actionable components expose callback events and optimistic update hooks.

## 1) `CommandCenterLayout`
- Props: `kpis`, `priorityQueue`, `renewalRisks`, `slaAlerts`, `teamStats`.
- Events: `onOpenQueueItem`, `onCreateTask`, `onEscalate`.

## 2) `UnifiedInbox`
- Props: `threads`, `selectedThreadId`, `filters`, `templates`.
- Events: `onSelectThread`, `onAssign`, `onSendMessage`, `onApplyTemplate`, `onSetDisposition`.

## 3) `LeadStageBoard`
- Props: `stages`, `cards`, `wipLimits`, `loading`.
- Events: `onMoveCard`, `onOpenCard`, `onBulkMove`.

## 4) `RecordTimeline`
- Props: `events`, `composerEnabled`, `channels`.
- Events: `onCreateNote`, `onCreateTask`, `onStartCall`, `onSendSms`, `onSendEmail`.

## 5) `PolicyStatusTable`
- Props: `rows`, `statuses`, `sort`, `filters`.
- Events: `onFilterChange`, `onSortChange`, `onOpenPolicy`, `onBulkAction`.

## 6) `QuoteComparePanel`
- Props: `plans`, `selectedPlanId`, `recommendation`.
- Events: `onSelectPlan`, `onMarkRecommended`, `onConvertToPolicy`.

## 7) `SlaTicketQueue`
- Props: `tickets`, `slaThresholds`, `ownerOptions`.
- Events: `onAssignOwner`, `onUpdateStatus`, `onEscalate`.

## 8) `CampaignBuilder`
- Props: `audience`, `steps`, `schedule`, `suppressions`.
- Events: `onAddStep`, `onReorderStep`, `onRunTest`, `onPublish`, `onPause`.

## 9) `AutomationRuleBuilder`
- Props: `trigger`, `conditions`, `actions`, `cooldown`.
- Events: `onSaveDraft`, `onRunSimulation`, `onActivate`, `onDeactivate`.

## 10) `IntegrationHealthGrid`
- Props: `integrations`, `categories`, `statusMap`.
- Events: `onConnect`, `onReconnect`, `onDisconnect`, `onViewLogs`.

## 11) `ClientPortalPolicyList`
- Props: `policies`, `renewalWindowDays`.
- Events: `onOpenPolicy`, `onRequestService`, `onDownloadDoc`.

## 12) `SavedViewToolbar`
- Props: `views`, `activeViewId`, `filters`.
- Events: `onSelectView`, `onSaveView`, `onDeleteView`, `onResetFilters`.

## Cross-Cutting State Contracts
- `AsyncState<T>`:
  - `data: T | null`
  - `loading: boolean`
  - `error: string | null`
- `PagedResult<T>`:
  - `items: T[]`
  - `page: number`
  - `pageSize: number`
  - `total: number`

## Design-System Tokens (Implementation Target)
- Spacing: `4/8/12/16/24/32`
- Radius: `8/12/16`
- Font scale: `12/14/16/20/24/32`
- Semantic colors: `primary/success/warning/danger/info/muted`

## Acceptance for Component Completion
- Has loading, empty, error, and success states.
- Keyboard accessible interactions.
- Mobile behavior defined.
- Emits all required events for backend integration phase.
