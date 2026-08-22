import { useState } from "react";
import {
  useFullscreen,
  useRankedBallot,
  useSharedCollection,
  type MeshConfig,
  type YRoom,
} from "@baditaflorin/mesh-common";
type Props = { room: YRoom | null; config: MeshConfig };
type Option = { id: string; label: string };
export function Feature({ room, config }: Props) {
  const options = useSharedCollection<Option>(room, "decision-options", {
    validate: (item) => item.label.trim().length > 0 && item.label.length <= 80,
  });
  const ballot = useRankedBallot(room, "decision-ranks");
  const fullscreen = useFullscreen();
  const [draft, setDraft] = useState("");
  const add = () => {
    const label = draft.trim();
    if (label) {
      options.add({ id: `${room?.peerId ?? "local"}-${Date.now()}`, label });
      setDraft("");
    }
  };
  return (
    <main className="feature-placeholder">
      <p className="feature-status">{room ? `${room.peerCount} peer(s) ranking` : "Connecting…"}</p>
      <h1>{config.appName}</h1>
      <p>
        Add options, then choose in preference order. The visible result uses deterministic Borda
        scoring.
      </p>
      <label>
        Option{" "}
        <input value={draft} maxLength={80} onChange={(event) => setDraft(event.target.value)} />
      </label>
      <button onClick={add}>Add</button>
      <button onClick={() => void fullscreen.toggle()}>
        {fullscreen.active ? "Exit fullscreen" : "Fullscreen result"}
      </button>
      <ol>
        {options.items.map((option) => (
          <li key={option.id}>
            <button onClick={() => ballot.rank(option.label)}>
              {ballot.ballot.indexOf(option.label) >= 0
                ? `Rank ${ballot.ballot.indexOf(option.label) + 1}`
                : "Rank"}
            </button>{" "}
            {option.label}
          </li>
        ))}
      </ol>
      <p aria-live="polite">
        {ballot.result.winner ? `Leading choice: ${ballot.result.winner}` : "No votes yet."}
      </p>
      <button onClick={ballot.clear}>Clear my ranking</button>
    </main>
  );
}
