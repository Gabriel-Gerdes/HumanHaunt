# HumanHaunt App Design Doc

## Overview

HumanHaunt is a mobile-first lockout game app for event settings where players may not have cell signal or reliable internet access. The mobile app will replicate the current gameplay from the Apps Script spike while replacing the sheet-backed server model with local-first storage and peer-to-peer propagation.

Players choose a team, view a shared list of tasks, and claim tasks for points. Claims and admin changes are exchanged between nearby devices over an offline mesh protocol modeled after the relay behavior of bitchat. Each device keeps its own SQLite copy of the game state and converges with other devices by exchanging event identifiers and requesting missing events.

The repository currently contains:

- `apps-script/`: the Google Apps Script spike backed by a Google Sheet.
- `mobile/`: a React Native skeleton using SQLite for local state and a simple peer sync service.

## Goals

- Show players a pre-seeded task list.
- Let a player select the team they are playing for.
- Let a team claim an open task and receive the task's points.
- Preserve lockout behavior: only one team should win a task in the derived game state.
- Work with no cell signal and no central internet service.
- Propagate claim events through nearby devices using an offline mesh.
- Store the full local claim event chain in SQLite on every node.
- Synchronize missing claim events during node handshakes.
- Support a dedicated Central Command app that creates signed admin packages.
- Propagate admin packages through the same mesh/event-chain mechanism.
- Allow admins to add tasks, reset false claims, rename teams, and perform other game operations.

## Non-Goals

- Real-time global consistency. Devices may temporarily disagree until mesh sync catches up.
- A traditional cloud backend for gameplay during the event.
- Strong identity proof for ordinary player devices in the first version.
- A full anti-cheat system in the first version.
- Preserving the Google Sheet as the production source of truth.

## Current Spike Behavior

The Apps Script spike models a lockout sheet with:

- A `Task` column.
- A `Points` column.
- One column per team.
- A claim button for each open task.
- First-write-wins locking through `LockService`.
- Team selection through large team buttons.
- Admin UI for adding, editing, deleting, resetting tasks, and renaming teams.

The mobile app should preserve the user-visible behavior, but its source of truth will be event-derived local state instead of live sheet cells.

## Product Surfaces

### Mobile Player App

The mobile app is used by players during the game.

Primary responsibilities:

- Initialize a game package with tasks, teams, and settings.
- Let the user choose their team.
- Display tasks, claim status, and score totals.
- Create local claim events.
- Store events in SQLite.
- Sync claim and admin events with nearby peers.
- Recompute task winners and scores from the local event chain.

### Central Command App

Central Command is used by game hosts/admins.

Primary responsibilities:

- Create the initial game package.
- Create admin packages during the event.
- Sign admin packages so player devices can verify they came from Central Command.
- Participate in the mesh to inject admin packages and collect game state.
- Optionally export the final event chain after the event.

Central Command can be implemented as a separate app surface after the mobile event model is stable. It may eventually be a React Native admin mode, desktop app, or local web app, but it should use the same event schema and verification rules.

## Architecture

HumanHaunt should be local-first and event-sourced.

High-level components:

- UI layer: React Native screens and components for team selection, tasks, scores, sync status, and admin status.
- Domain layer: pure logic for deriving winners, scores, active task lists, and conflict resolution from events.
- Persistence layer: SQLite tables for games, teams, tasks, devices, events, sync state, and peer metadata.
- Mesh transport layer: peer discovery, connection management, relaying, handshakes, and missing-event requests.
- Admin package layer: signed admin events and validation rules.

The app should avoid treating mutable task rows as the source of truth. Mutable views should be projections produced from the event log plus the initial game package.

## Data Model

The existing mobile schema already includes `games`, `teams`, `tasks`, `devices`, `claim_events`, and `sync_state`. The production model should extend this into a single event-chain model so claim events and admin packages can sync through the same protocol.

Recommended core tables:

### `games`

- `id`
- `name`
- `created_at`
- `active`

### `teams`

- `id`
- `game_id`
- `name`
- `color`
- `sort_order`
- `active`

### `tasks`

- `id`
- `game_id`
- `title`
- `points`
- `sort_order`
- `active`
- `created_by_event_id`
- `updated_by_event_id`

The current mobile `Task` type does not include points yet. Points should be added before score totals are treated as complete.

### `devices`

- `id`
- `name`
- `created_at`
- `last_seen_at`

### `events`

This should become the canonical append-only chain.

- `id`: globally unique event UID.
- `game_id`
- `type`: `claim_created`, `admin_task_added`, `admin_task_updated`, `admin_task_deleted`, `admin_claim_reset`, `admin_team_renamed`, etc.
- `created_at`: sender timestamp.
- `received_at`: local ingest timestamp.
- `device_id`: originating node.
- `team_id`: optional, required for player claim events.
- `payload_json`: typed payload.
- `signature`: optional for player claims, required for admin events.
- `hash`: canonical hash of the event body.
- `previous_hash`: optional link for events created by the same origin.
- `source`: `local`, `peer`, `seed`, or `admin`.

### `event_receipts`

Optional but useful later for diagnostics.

- `event_id`
- `peer_id`
- `first_seen_at`
- `last_seen_at`

### `sync_state`

- `peer_id`
- `peer_name`
- `last_seen_at`
- `last_event_count`
- `last_handshake_at`

## Event Types

### Claim Event

A claim event records a team claiming a task.

Payload:

```json
{
  "taskId": "task-biff-lime",
  "teamId": "team-1",
  "claimedAt": 1784131200000
}
```

Validation rules:

- `taskId` must reference a known active task at the time the event is applied.
- `teamId` must reference a known active team.
- Duplicate event IDs are ignored.
- If multiple teams claim the same task, the derived winner is the earliest valid claim by `claimedAt`, with event ID as the deterministic tie-breaker.

### Admin Package

An admin package is an event created by Central Command. It uses the same mesh propagation mechanics as claim events but requires admin signature verification.

Payload examples:

- Add task: `{ "taskId": "...", "title": "...", "points": 10, "sortOrder": 12 }`
- Reset claim: `{ "taskId": "...", "claimEventId": "...", "reason": "false claim" }`
- Rename team: `{ "teamId": "...", "name": "Team Ghost" }`
- Delete task: `{ "taskId": "..." }`

Validation rules:

- Admin events must be signed by a trusted Central Command key.
- Devices should ignore unsigned or invalidly signed admin events.
- Admin reset events should not delete historical claims. Instead, they should mark a specific claim event as invalid in the derived projection.
- Admin event ordering should be deterministic. Prefer `created_at`, then event ID, with a future option for admin sequence numbers.

## Claim Event Chain

The claim event chain is the set of event UIDs and event bodies known to a node. It is append-only at storage time and deterministic at projection time.

Every node stores:

- A UID list for all known events.
- Full event bodies for locally created and imported events.
- A local projection of tasks, winners, and scores.

The chain may contain conflicting claims. Conflicts are expected because devices can be offline and create claims before hearing about each other. Conflict resolution happens when deriving game state, not when inserting events.

Initial rule:

- For each task, the winning claim is the valid claim with the earliest `claimedAt`.
- Ties are resolved by lexicographic event ID.
- Admin reset events can invalidate a claim, causing the projection to choose the next earliest valid claim or reopen the task.

## Mesh Sync Protocol

The current skeleton has a TCP peer sync that sends all claim events to connected peers. The production protocol should evolve toward UID-based delta exchange.

### Handshake

When two nodes connect:

1. Node A sends `hello` with device metadata, game ID, protocol version, and known event UIDs.
2. Node B compares A's UID list to its local UID list.
3. Node B sends `request_events` for UIDs it is missing.
4. Node B sends its own UID list or a compact summary.
5. Node A requests missing UIDs from B.
6. Both nodes import valid events and update their projections.
7. Newly imported events are relayed to connected peers.

### Message Types

Recommended starting message set:

- `hello`: device metadata, game ID, protocol version, event UID list or digest.
- `request_events`: event UID list requested from a peer.
- `events`: full event bodies.
- `event_announcement`: newly available event UIDs.
- `admin_announcement`: optional high-priority admin event announcement.
- `error`: protocol or validation failure.

### Relay Rules

- Insert events idempotently by UID.
- Never relay events that fail validation.
- Relay newly imported valid events to peers that have not announced the UID.
- Limit message size by chunking UID lists and event payloads.
- Keep transport independent from domain rules so Bluetooth, Wi-Fi Direct, local TCP, or another bearer can be swapped in later.

## Offline and Consistency Model

HumanHaunt is eventually consistent.

Expected behavior:

- A phone can create a claim with no network connection.
- Nearby phones may not see the claim immediately.
- When phones connect, they exchange missing events.
- Each phone recomputes winners and scores from the same deterministic rules.
- Once all devices have the same valid event set, they show the same game state.

The UI should communicate sync status clearly. A task can show that a local claim is pending mesh propagation, and conflict notices can explain when multiple claims exist but only the earliest valid claim wins.

## Security Model

First version:

- Claim events are trusted enough for gameplay but auditable after the fact.
- Admin events must be signed by Central Command.
- Devices store the Central Command public key in the initial game package.
- Invalid signatures are rejected and not relayed.
- Event IDs and hashes prevent accidental duplication and make tampering visible.

Future hardening:

- Sign player claim events with per-device keys.
- Use QR or NFC enrollment for trusted devices.
- Add event hash chaining per origin device.
- Add admin sequence numbers to prevent replay of stale admin changes.
- Encrypt mesh payloads if game data or participant identity needs privacy.

## Central Command Flow

### Before the Game

1. Host creates a game package with tasks, teams, points, colors, and admin public key.
2. Player devices import the package before entering the no-signal environment.
3. Each device creates or loads its local device ID.
4. Each device initializes SQLite with the game package.

### During the Game

1. Players claim tasks locally.
2. Devices exchange claim events through the mesh.
3. Central Command creates admin events as needed.
4. Admin events propagate through the mesh.
5. Devices verify admin signatures and update projections.

### After the Game

1. Central Command gathers event chains from nearby devices.
2. Hosts inspect conflicts, invalidated claims, and final scores.
3. The final chain can be exported as JSON or CSV.

## Implementation Plan

### Phase 1: Match the Spike Locally

- Add points to the mobile task model and SQLite schema.
- Add score totals to the mobile UI.
- Add explicit team selection instead of claim buttons for every team.
- Preserve first-claim-wins behavior in the domain projection.
- Keep the current simple peer sync as a development aid.

### Phase 2: Event Chain Unification

- Replace `claim_events`-only sync with a generic `events` table.
- Represent claim events and admin packages with a common envelope.
- Make projections derive tasks, claims, resets, team names, and scores from events.
- Add deterministic validation and conflict resolution tests.

### Phase 3: UID-Based Mesh Sync

- Change handshakes to exchange event UID lists or digests.
- Add missing-event requests.
- Add event announcements and relaying.
- Add chunking for large chains.
- Track peer sync metadata in SQLite.

### Phase 4: Central Command Admin Packages

- Define admin event schemas.
- Add signing in Central Command.
- Add signature verification in the mobile app.
- Implement task add/update/delete, team rename, and claim reset projections.
- Add host-facing export/import tooling.

### Phase 5: Production Hardening

- Decide the production mesh bearer for Android and iOS.
- Add reconnect, retry, and backoff behavior.
- Add protocol versioning.
- Add migration strategy for SQLite schema changes.
- Add test fixtures for multi-device conflict scenarios.
- Add event log diagnostics for hosts.

## Testing Strategy

- Domain unit tests for claim ordering, score totals, task resets, task admin events, and invalid event handling.
- SQLite tests for migrations, idempotent imports, and projection queries.
- Protocol tests for handshake diffing, missing UID requests, duplicate imports, and relay behavior.
- Device/manual tests with at least three phones to verify multi-hop propagation.
- Admin package tests for valid signatures, invalid signatures, replay attempts, and reset behavior.

## Open Questions

- What mesh bearer should be used first for the no-signal environment: Bluetooth LE, Wi-Fi Direct, local Wi-Fi TCP, or a hybrid?
- Should Central Command be a separate app, an admin mode in the React Native app, or a desktop/local web app?
- How will devices receive the initial game package: QR code, file import, local network, or pre-bundled seed data?
- Do player claim events need signatures in the first playable version?
- Should claim ordering use device timestamps only, or should Central Command/admin review have the final say for close conflicts?
- How large can the game get in expected use: task count, player count, team count, and event count?

