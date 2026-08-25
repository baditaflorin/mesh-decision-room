import { useRef, useState, type FormEvent } from "react";
import {
  MeshButton,
  MeshLaunch,
  MeshNameInput,
  MeshPresence,
  MeshStatusPill,
  MeshSurface,
  useFullscreen,
  useNamedPeer,
  useRankedBallot,
  useSharedCollection,
  type MeshConfig,
  type YRoom,
} from "@baditaflorin/mesh-common";

type Props = { room: YRoom | null; config: MeshConfig };
type Option = { id: string; label: string };

const STARTER_OPTIONS = ["Dinner at Luma", "A walk by the river", "The 8 pm film"];

function optionId(room: YRoom | null, suffix = ""): string {
  return `${room?.peerId ?? "local"}-${Date.now()}${suffix}`;
}

function isDuplicateOption(options: Option[], label: string): boolean {
  const comparable = label.trim().toLocaleLowerCase();
  return options.some((option) => option.label.trim().toLocaleLowerCase() === comparable);
}

/** A compact collaborative shortlist and ranked ballot for one shared room. */
export function Feature({ room, config }: Props) {
  const options = useSharedCollection<Option>(room, "decision-options", {
    validate: (item) => item.label.trim().length > 0 && item.label.length <= 80,
  });
  const ballot = useRankedBallot(room, "decision-ranks");
  const { name, setName } = useNamedPeer(config, room);
  const tallyRef = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen(tallyRef);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");

  const peopleHere = room ? room.peerCount + 1 : 0;
  const hasShortlist = options.items.length > 0;
  const rankedChoices = new Set(ballot.ballot);
  const rankedCount = options.items.filter((option) => rankedChoices.has(option.label)).length;
  const outcomeRows = options.items
    .map((option) => ({ option, score: ballot.result.scores[option.label] ?? 0 }))
    .sort((a, b) => b.score - a.score || a.option.label.localeCompare(b.option.label));
  const leadingChoice = outcomeRows.find((row) => row.score > 0) ?? null;

  const addDraft = (): boolean => {
    const label = draft.trim();
    if (!room || !label) return false;
    if (isDuplicateOption(options.items, label)) {
      setNotice(`“${label}” is already on the shortlist.`);
      return false;
    }
    const added = options.add({ id: optionId(room), label });
    if (!added) {
      setNotice("That option could not be added. Try a shorter, distinct name.");
      return false;
    }
    setDraft("");
    setNotice(`${label} is ready for the group to rank.`);
    return true;
  };

  const submitDraft = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addDraft();
  };

  const addStarterShortlist = () => {
    if (!room) return;
    let added = 0;
    STARTER_OPTIONS.forEach((label, index) => {
      if (!isDuplicateOption(options.items, label)) {
        if (options.add({ id: optionId(room, `-${index}`), label })) added += 1;
      }
    });
    setNotice(
      added
        ? `${added} starter ${added === 1 ? "option is" : "options are"} ready to rank.`
        : "Those starter options are already on this shortlist.",
    );
  };

  if (!hasShortlist) {
    return (
      <main className="decision-room decision-room-entry">
        <MeshLaunch
          className="decision-launch"
          eyebrow="Shared ranked choice"
          heading="What should we choose?"
          promise="Add the first real option, then let everyone in this room place it in their own order. The tally updates as choices arrive."
          presence={
            <MeshPresence
              count={peopleHere}
              state={room ? "connected" : "connecting"}
              label={peopleHere === 1 ? "person in this room" : "people in this room"}
              announce="polite"
            />
          }
          preview={
            <div className="decision-launch-preview">
              <div className="decision-launch-context">
                <MeshStatusPill tone={room ? "live" : "warning"} dot>
                  {room ? "Room ready" : "Connecting"}
                </MeshStatusPill>
                <span>First, build the shared shortlist.</span>
              </div>
              <form
                id="decision-first-option"
                onSubmit={submitDraft}
                className="decision-option-form"
              >
                <label className="decision-field" htmlFor="decision-first-option-input">
                  <span>First option</span>
                  <input
                    id="decision-first-option-input"
                    value={draft}
                    maxLength={80}
                    placeholder="e.g. Dinner at Luma"
                    onChange={(event) => setDraft(event.target.value)}
                    disabled={!room}
                    autoComplete="off"
                  />
                </label>
              </form>
              <MeshNameInput
                value={name}
                onChange={setName}
                label="Your name"
                placeholder="Optional, for your collaborators"
                maxLength={32}
                hint="Saved only on this device and shared with this room."
                disabled={!room}
              />
            </div>
          }
          primaryAction={{
            label: "Add this option",
            type: "submit",
            form: "decision-first-option",
            disabled: !room || !draft.trim(),
          }}
          secondaryAction={{
            label: "Add a starter shortlist",
            onClick: addStarterShortlist,
            disabled: !room,
          }}
          loading={!room}
          connectionHint={
            room
              ? peopleHere === 1
                ? "You are the first person here. Invite others when the shortlist is ready."
                : `${peopleHere} people can now shape this decision together.`
              : "Opening your room…"
          }
        />
        <p className="decision-live-note" role="status" aria-live="polite">
          {notice}
        </p>
      </main>
    );
  }

  return (
    <main className="decision-room">
      <header className="decision-header">
        <div className="decision-header-copy">
          <p className="decision-kicker">Shared shortlist</p>
          <h1>Make the call with clarity.</h1>
          <p>
            Add options once, rank them individually, and use the live tally to find the group’s
            leading choice.
          </p>
        </div>
        <div className="decision-header-meta">
          <MeshPresence
            count={peopleHere}
            state={room ? "connected" : "connecting"}
            label={peopleHere === 1 ? "person here" : "people here"}
            announce="polite"
          />
          <MeshStatusPill tone={leadingChoice ? "live" : "neutral"} dot>
            {leadingChoice ? "Live tally" : "Awaiting ranks"}
          </MeshStatusPill>
          <MeshNameInput
            value={name}
            onChange={setName}
            label="You"
            placeholder="Add your name"
            maxLength={32}
            className="decision-name-input"
          />
        </div>
      </header>

      <div className="decision-board">
        <MeshSurface
          as="section"
          tone="raised"
          padding="lg"
          className="decision-panel decision-shortlist"
        >
          <div className="decision-panel-heading">
            <div>
              <p className="decision-panel-label">The shared list</p>
              <h2>Shortlist</h2>
            </div>
            <MeshStatusPill tone="info">{options.items.length} options</MeshStatusPill>
          </div>

          <form onSubmit={submitDraft} className="decision-add-row">
            <label className="decision-field" htmlFor="decision-add-option-input">
              <span>Add another option</span>
              <input
                id="decision-add-option-input"
                value={draft}
                maxLength={80}
                placeholder="Name an option"
                onChange={(event) => setDraft(event.target.value)}
                autoComplete="off"
              />
            </label>
            <MeshButton type="submit" disabled={!draft.trim()}>
              Add option
            </MeshButton>
          </form>

          <ol className="decision-options" aria-label="Shared shortlist">
            {options.items.map((option, index) => (
              <li key={option.id} className="decision-option-row">
                <span className="decision-option-index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="decision-option-label">{option.label}</span>
                <MeshButton
                  variant="quiet"
                  size="sm"
                  onClick={() => options.remove(option.id)}
                  aria-label={`Remove ${option.label}`}
                >
                  Remove
                </MeshButton>
              </li>
            ))}
          </ol>
          <p className="decision-live-note" role="status" aria-live="polite">
            {notice}
          </p>
        </MeshSurface>

        <MeshSurface
          as="section"
          tone="base"
          padding="lg"
          className="decision-panel decision-ranking"
        >
          <div className="decision-panel-heading">
            <div>
              <p className="decision-panel-label">Your ballot</p>
              <h2>Rank your order</h2>
            </div>
            <MeshStatusPill tone={rankedCount ? "info" : "neutral"}>
              {rankedCount}/{options.items.length} ranked
            </MeshStatusPill>
          </div>
          <p className="decision-panel-intro">
            Select choices in the order you prefer them. Select one again to move it to the end.
          </p>
          <ol className="decision-rank-list" aria-label="Your ranked ballot">
            {options.items.map((option) => {
              const rank = ballot.ballot.indexOf(option.label);
              return (
                <li key={option.id} className={rank >= 0 ? "is-ranked" : undefined}>
                  <MeshButton
                    variant={rank >= 0 ? "secondary" : "quiet"}
                    fullWidth
                    onClick={() => ballot.rank(option.label)}
                    aria-label={
                      rank >= 0
                        ? `Move ${option.label} after rank ${rank + 1}`
                        : `Rank ${option.label}`
                    }
                  >
                    <span className="decision-rank-number" aria-hidden="true">
                      {rank >= 0 ? String(rank + 1).padStart(2, "0") : "—"}
                    </span>
                    <span className="decision-rank-label">{option.label}</span>
                    <span className="decision-rank-action" aria-hidden="true">
                      {rank >= 0 ? "Selected" : "Choose"}
                    </span>
                  </MeshButton>
                </li>
              );
            })}
          </ol>
          {rankedCount ? (
            <MeshButton variant="quiet" size="sm" onClick={ballot.clear}>
              Clear my ranking
            </MeshButton>
          ) : null}
        </MeshSurface>

        <div ref={tallyRef} className="decision-tally-wrap">
          <MeshSurface
            as="section"
            tone="accent"
            padding="lg"
            className="decision-panel decision-tally"
          >
            <div className="decision-panel-heading">
              <div>
                <p className="decision-panel-label">Shared result</p>
                <h2>Live tally</h2>
              </div>
              <MeshButton
                variant="quiet"
                size="sm"
                onClick={() => void fullscreen.toggle()}
                disabled={!fullscreen.supported}
              >
                {fullscreen.active ? "Exit full screen" : "Present tally"}
              </MeshButton>
            </div>

            {leadingChoice ? (
              <div className="decision-leading" data-testid="leading-choice" aria-live="polite">
                <span>Leading choice</span>
                <strong>{leadingChoice.option.label}</strong>
                <p>
                  {leadingChoice.score} {leadingChoice.score === 1 ? "point" : "points"} so far
                </p>
              </div>
            ) : (
              <div
                className="decision-leading decision-leading-empty"
                data-testid="leading-choice"
                aria-live="polite"
              >
                <span>Ready when you are</span>
                <strong>No ranking yet</strong>
                <p>Each person’s first pick carries the most weight.</p>
              </div>
            )}

            <ol className="decision-score-list" aria-label="Current Borda scores">
              {outcomeRows.map(({ option, score }, index) => (
                <li key={option.id}>
                  <span className="decision-score-position">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="decision-score-label">{option.label}</span>
                  <span className="decision-score-value">
                    {score} {score === 1 ? "pt" : "pts"}
                  </span>
                </li>
              ))}
            </ol>
          </MeshSurface>
        </div>
      </div>
    </main>
  );
}
