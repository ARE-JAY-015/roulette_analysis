
import "./SessionInsights.css";

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18,
  19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

function getNumber(item) {
  if (typeof item === "number") return item;
  if (item?.colorOnly) return null;

  return Number.isInteger(item?.number) ? item.number : null;
}

function getColor(item) {
  if (item?.colorOnly) return item.colorOnly;

  const number = getNumber(item);

  if (number === null) return "unknown";
  if (number === 0) return "green";

  return RED_NUMBERS.has(number) ? "red" : "black";
}

function percentage(count, total) {
  return total ? ((count / total) * 100).toFixed(1) : "0.0";
}

function formatDate(timestamp) {
  if (!timestamp) return "Not available";

  const date = new Date(timestamp);

  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleString();
}

export default function SessionInsights({
  history = [],
  sessions = [],
  auditLog = [],
}) {
  const validHistory = Array.isArray(history) ? history : [];
  const validSessions = Array.isArray(sessions) ? sessions : [];
  const validAuditLog = Array.isArray(auditLog) ? auditLog : [];

  const numberedResults = validHistory.filter(
    (item) => getNumber(item) !== null
  );

  const redCount = validHistory.filter(
    (item) => getColor(item) === "red"
  ).length;

  const blackCount = validHistory.filter(
    (item) => getColor(item) === "black"
  ).length;

  const greenCount = validHistory.filter(
    (item) => getColor(item) === "green"
  ).length;

  const sessionRows = validSessions
    .map((session) => {
      const results = validHistory.filter(
        (item) => item?.sessionId === session.id
      );

      const numbered = results.filter(
        (item) => getNumber(item) !== null
      );

      const reds = results.filter(
        (item) => getColor(item) === "red"
      ).length;

      const blacks = results.filter(
        (item) => getColor(item) === "black"
      ).length;

      const greens = results.filter(
        (item) => getColor(item) === "green"
      ).length;

      return {
        id: session.id,
        name: session.name || "Unnamed session",
        startedAt: session.startedAt,
        total: results.length,
        numbered: numbered.length,
        red: reds,
        black: blacks,
        green: greens,
      };
    })
    .sort((a, b) => b.total - a.total);

  const busiestSession = sessionRows.reduce(
    (best, session) =>
      !best || session.total > best.total ? session : best,
    null
  );

  const latestResults = validHistory.slice(0, 8);
  const averageOutcomesPerSession =
  validSessions.length > 0
    ? (
        validHistory.filter((item) =>
          validSessions.some(
            (session) => session.id === item?.sessionId
          )
        ).length / validSessions.length
      ).toFixed(1)
    : "0.0";

const unassignedOutcomes = validHistory.filter(
  (item) => !item?.sessionId
).length;

  const correctedSessionIds = new Set(
    validAuditLog.map((entry) => entry.sessionId).filter(Boolean)
  );

  return (
    <section className="panel session-insights-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">07 / SESSION INTELLIGENCE</p>
          <h3>Session Insights Dashboard</h3>
          <p className="helper-text">
            A historical overview of recorded outcomes and session activity.
          </p>
        </div>

        <span className="small-label">
          {validSessions.length} SESSIONS
        </span>
      </div>

      <div className="insights-summary-grid">
        <article className="stat-card">
          <p>Recorded outcomes</p>
          <strong>{validHistory.length}</strong>
          <span>Results in the supplied history</span>
        </article>

        <article className="stat-card">
          <p>Numbered results</p>
          <strong>{numberedResults.length}</strong>
          <span>Outcomes with a number from 0–36</span>
        </article>

        <article className="stat-card">
          <p>Red outcomes</p>
          <strong className="red-text">{redCount}</strong>
          <span>{percentage(redCount, validHistory.length)}% of outcomes</span>
        </article>

        <article className="stat-card">
          <p>Black outcomes</p>
          <strong>{blackCount}</strong>
          <span>{percentage(blackCount, validHistory.length)}% of outcomes</span>
        </article>

        <article className="stat-card">
          <p>Green outcomes</p>
          <strong className="green-text">{greenCount}</strong>
          <span>{percentage(greenCount, validHistory.length)}% of outcomes</span>
        </article>
      </div>

      <div className="insights-highlight">
        <div>
          <p className="eyebrow">SESSION ACTIVITY</p>

          <h4>
            {busiestSession && busiestSession.total > 0
              ? busiestSession.name
              : "No session activity yet"}
          </h4>

          <p className="helper-text">
            {busiestSession && busiestSession.total > 0
              ? `${busiestSession.total} recorded outcomes in this session.`
              : "Start a session and record outcomes to see activity insights."}
          </p>
        </div>

        <div className="insights-highlight-number">
          {busiestSession?.total ?? 0}
        </div>
      </div>

      <div className="insights-section">
        <div className="section-heading">
          <div>
            <h4>Session Performance</h4>
            <p className="helper-text">
              Compare the recorded outcomes associated with each saved session.
            </p>
          </div>
        </div>

        {sessionRows.length === 0 ? (
          <p className="helper-text">
            No saved sessions are available yet.
          </p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Started</th>
                  <th>Total</th>
                  <th>Numbered</th>
                  <th>Red</th>
                  <th>Black</th>
                  <th>Green</th>
                </tr>
              </thead>

              <tbody>
                {sessionRows.map((session) => (
                  <tr key={session.id}>
                    <td>{session.name}</td>
                    <td>{formatDate(session.startedAt)}</td>
                    <td>{session.total}</td>
                    <td>{session.numbered}</td>
                    <td className="red-text">{session.red}</td>
                    <td>{session.black}</td>
                    <td className="green-text">{session.green}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="insights-section">
        <div className="section-heading">
          <div>
            <h4>Latest Recorded Outcomes</h4>
            <p className="helper-text">
              The most recent results supplied to this dashboard.
            </p>
          </div>
        </div>

        {latestResults.length === 0 ? (
          <p className="helper-text">
            No outcomes have been recorded yet.
          </p>
        ) : (
          <div className="insights-results-list">
            {latestResults.map((item, index) => {
              const number = getNumber(item);
              const color = getColor(item);

              return (
                <div
                  className="insights-result-item"
                  key={item.id || `${item.timestamp || "result"}-${index}`}
                >
                  <span className={`result-ball ${color}`}>
                    {number === null ? color.toUpperCase() : number}
                  </span>

                  <div>
                    <strong>
                      {number === null
                        ? `${color.toUpperCase()} only`
                        : `Number ${number}`}
                    </strong>

                    <p className="helper-text">
                      {formatDate(item.timestamp)}
                    </p>
                  </div>

                  <span className="small-label">
                    {color.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="insights-section">
        <div className="section-heading">
          <div>
            <h4>Correction Audit Overview</h4>
            <p className="helper-text">
              Review how many correction records have been saved.
            </p>
          </div>
        </div>

        <div className="insights-summary-grid">
          <article className="stat-card">
            <p>Total corrections</p>
            <strong>{validAuditLog.length}</strong>
            <span>Saved correction audit entries</span>
          </article>

          <article className="stat-card">
            <p>Sessions with corrections</p>
            <strong>{correctedSessionIds.size}</strong>
            <span>Sessions represented in the audit log</span>
          </article>
        </div>
      </div>

      <p className="chart-disclaimer">
        These metrics summarize recorded history only. Roulette spins are
        random; past outcomes and session statistics do not predict future spins.
      </p>
    </section>
  );
}
