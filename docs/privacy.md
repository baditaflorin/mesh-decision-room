# Privacy — Decision Room

## Threat model

This app is a peer-to-peer mesh. Any data that is shared via Yjs (the CRDT) or awareness is **visible to every other peer in the same room**. Treat the contents of a mesh room as semi-public among the people you share the room ID with.

### What other peers can see

- All shared Decision Room state: shortlist options and each peer's ranked ballot.
- Optional display names, when a person enters one. They are stored on that device and mirrored to peers in the room.
- Per-peer awareness state needed to show room presence for the duration of the connection.
- Your peer ID, a transient WebRTC client ID. Not tied to a user account.

### What the self-hosted infra can see

- The signaling server (`wss://turn.0docker.com/ws`) sees connection metadata: IP address, room ID hash, time of connection. It does **not** see message contents — all peer messages go directly over the WebRTC data channel.
- The TURN relay (`turn:turn.0docker.com:3479`) is only used when direct peer connection fails (strict NATs). When relayed, traffic flows through the TURN box but remains end-to-end encrypted (DTLS-SRTP).

### What stays local

- Settings: signaling/TURN overrides, room ID, and your optional display name — all in localStorage.
- Nothing is persisted server-side. When all peers leave the room, the CRDT state evaporates.

## Capabilities used by this app

<!-- mesh:capabilities-block:start -->

Decision Room uses WebRTC, Yjs shared state, and local device storage for room settings and an optional display name. It does not request camera, microphone, location, contacts, or motion permissions.
<!-- mesh:capabilities-block:end -->

## No accounts, no analytics

No login. No tracking pixels. No third-party analytics. No service worker error beacons.

## If you want stronger anonymity

This app does not use a secret ballot or commit-reveal scheme. If anonymity matters for your group, do not use a shared Decision Room as the final voting mechanism.
