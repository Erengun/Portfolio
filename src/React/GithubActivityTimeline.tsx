import React, { useEffect, useMemo, useState } from "react";

type GitHubEvent = {
  id: string;
  type: string;
  created_at: string;
  repo: { name: string; url: string };
  payload: any;
  actor?: { login: string };
};

type Props = {
  username?: string;
  limit?: number;
};

const timeAgo = (dateStr: string) => {
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  const w = Math.floor(d / 7);
  if (w > 0) return `${w}w ago`;
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
};

const RepoLink: React.FC<{ fullName: string }> = ({ fullName }) => (
  <a
    href={`https://github.com/${fullName}`}
    target="_blank"
    rel="noreferrer"
    className="text-[var(--sec)] hover:underline"
  >
    {fullName}
  </a>
);

const ItemIcon: React.FC<{ type: string; merged?: boolean }> = ({ type, merged }) => {
  const base = "w-5 h-5 mr-3 flex items-center justify-center rounded-full bg-[#1e1e1e] border border-[#30363d] text-[var(--white)]";
  switch (type) {
    case "PushEvent":
      return <div className={base}>⬆️</div>;
    case "PullRequestEvent":
      return <div className={base}>{merged ? "🔀" : "🟩"}</div>;
    case "IssuesEvent":
      return <div className={base}>❗</div>;
    case "WatchEvent":
      return <div className={base}>⭐</div>;
    case "ForkEvent":
      return <div className={base}>🍴</div>;
    case "CreateEvent":
      return <div className={base}>🆕</div>;
    case "ReleaseEvent":
      return <div className={base}>🏷️</div>;
    default:
      return <div className={base}>📌</div>;
  }
};

const GithubActivityTimeline: React.FC<Props> = ({ username = "Erengun", limit = 100 }) => {
  const [events, setEvents] = useState<GitHubEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`https://api.github.com/users/${username}/events?per_page=100`);
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(`${resp.status} ${resp.statusText}: ${text}`);
        }
        const data: GitHubEvent[] = await resp.json();
        if (!cancelled) {
          setEvents(data);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to load activity");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [username, limit]);

  const items = useMemo(() => {
    const out: Array<{ id: string; content: React.ReactNode; ts: string }> = [];
    for (const ev of events) {
      const repo = ev.repo?.name;
      if (!repo) continue;
      switch (ev.type) {
        case "PushEvent": {
          const commits = ev.payload?.commits?.length || 0;
          if (commits === 0) break;
          out.push({
            id: ev.id,
            ts: ev.created_at,
            content: (
              <div className="flex items-start">
                <ItemIcon type={ev.type} />
                <div className="text-sm text-[var(--white)]">
                  Pushed <span className="text-[var(--sec)] font-medium">{commits}</span> commit{commits > 1 ? "s" : ""} to <RepoLink fullName={repo} />
                </div>
              </div>
            ),
          });
          break;
        }
        case "PullRequestEvent": {
          const action = ev.payload?.action;
          const pr = ev.payload?.pull_request;
          const number = pr?.number || ev.payload?.number;
          const title = pr?.title;
          const isMerged = pr?.merged === true;
          let verb = "updated";
          if (isMerged) verb = "merged";
          else if (action === "opened") verb = "opened";
          else if (action === "closed") verb = "closed";
          out.push({
            id: ev.id,
            ts: ev.created_at,
            content: (
              <div className="flex items-start">
                <ItemIcon type={ev.type} merged={isMerged} />
                <div className="text-sm text-[var(--white)]">
                  {verb} PR <span className="text-[var(--sec)]">#{number}</span> in <RepoLink fullName={repo} />{title ? <>: <span className="text-[var(--white-icon)]">{title}</span></> : null}
                </div>
              </div>
            ),
          });
          break;
        }
        case "IssuesEvent": {
          const action = ev.payload?.action;
          const issue = ev.payload?.issue;
          const number = issue?.number;
          const title = issue?.title;
          out.push({
            id: ev.id,
            ts: ev.created_at,
            content: (
              <div className="flex items-start">
                <ItemIcon type={ev.type} />
                <div className="text-sm text-[var(--white)]">
                  {action} issue <span className="text-[var(--sec)]">#{number}</span> in <RepoLink fullName={repo} />{title ? <>: <span className="text-[var(--white-icon)]">{title}</span></> : null}
                </div>
              </div>
            ),
          });
          break;
        }
        case "WatchEvent": {
          // Skipped: No need to show starred events
          break;
        }
        case "ForkEvent": {
          // Skipped: No need to show forked events
          break;
        }
        case "CreateEvent": {
          const refType = ev.payload?.ref_type;
          const ref = ev.payload?.ref;
          const what = refType === "repository" ? "repository" : `${refType} ${ref}`;
          out.push({
            id: ev.id,
            ts: ev.created_at,
            content: (
              <div className="flex items-start">
                <ItemIcon type={ev.type} />
                <div className="text-sm text-[var(--white)]">
                  Created {what} in <RepoLink fullName={repo} />
                </div>
              </div>
            ),
          });
          break;
        }
        case "ReleaseEvent": {
          const rel = ev.payload?.release;
          const tag = rel?.tag_name || "release";
          out.push({
            id: ev.id,
            ts: ev.created_at,
            content: (
              <div className="flex items-start">
                <ItemIcon type={ev.type} />
                <div className="text-sm text-[var(--white)]">
                  Published <span className="text-[var(--sec)]">{tag}</span> in <RepoLink fullName={repo} />
                </div>
              </div>
            ),
          });
          break;
        }
        default:
          if (ev.type === "PublicEvent") {
            // Skipped: No need to show publicized events
            break;
          }
          out.push({
            id: ev.id,
            ts: ev.created_at,
            content: (
              <div className="flex items-start">
                <ItemIcon type={ev.type} />
                <div className="text-sm text-[var(--white)]">
                  {ev.type.replace(/Event$/, "").replace(/([a-z])([A-Z])/g, "$1 $2")} in <RepoLink fullName={repo} />
                </div>
              </div>
            ),
          });
      }
      if (out.length >= limit) break;
    }
    return out;
  }, [events, limit]);

  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-[var(--white)] mb-2">Latest activity</h3>
      <div className="relative pl-4">
        {/* timeline line */}
        <div className="absolute left-2 top-0 bottom-0 w-px bg-[#30363d]" />
        {loading && (
          <div className="text-[var(--white-icon)] text-sm">Loading timeline…</div>
        )}
        {error && (
          <div className="text-red-400 text-sm">{error.includes('403') ? 'GitHub API rate limit reached. Try again later.' : error}</div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="text-[var(--white-icon)] text-sm">No recent public activity.</div>
        )}
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it.id} className="relative flex items-start">
              <span className="absolute -left-[7px] mt-1 w-3 h-3 rounded-full bg-[var(--sec)] ring-2 ring-[#1e1e1e]" />
              <div className="ml-2 flex-1">
                {it.content}
                <div className="text-[10px] text-[var(--white-icon)] mt-1">{timeAgo(it.ts)}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default GithubActivityTimeline;
