
import "./DataQualityMonitor.css";

function isValidResult(item) {
  if (!item || typeof item !== "object") return false;

  const hasNumber = Object.prototype.hasOwnProperty.call(item, "number");
  const hasColorOnly = Object.prototype.hasOwnProperty.call(item, "colorOnly");

  // A record must contain exactly one result type.
  if (hasNumber === hasColorOnly) return false;

  if (hasNumber) {
    return (
      Number.isInteger(item.number) &&
      item.number >= 0 &&
      item.number <= 36
    );
  }

  return ["red", "black", "green"].includes(item.colorOnly);
}

export default function DataQualityMonitor({
  history = [],
  sessions = [],
}) {
  const validResults = history.filter(isValidResult);
  const invalidResults = history.length - validResults.length;

  const colorOnlyResults = history.filter(
    (item) =>
      item &&
      typeof item === "object" &&
      ["red", "black", "green"].includes(item.colorOnly) &&
      !Object.prototype.hasOwnProperty.call(item, "number")
  ).length;

  const missingTimestamps = history.filter(
    (item) =>
      !item ||
      typeof item.timestamp !== "number" ||
      !Number.isFinite(item.timestamp) ||
      item.timestamp <= 0
  ).length;

  const ids = history
    .map((item) => item?.id)
    .filter((id) => id !== undefined && id !== null && id !== "");

  const duplicateIds = ids.length - new Set(ids).size;

  const sessionIds = new Set(
    sessions.map((session) => session.id)
  );

  const orphanedSessionReferences = history.filter(
    (item) =>
      item?.sessionId &&
      !sessionIds.has(item.sessionId)
  ).length;

  const checks = [
    {
      label: "Valid results",
      value: validResults.length,
      detail: "Numbered or valid color-only outcomes",
      status: "good",
    },
    {
      label: "Invalid results",
      value: invalidResults,
      detail: "Missing, malformed, or out-of-range outcomes",
      status: invalidResults > 0 ? "warning" : "good",
    },
    {
      label: "Missing timestamps",
      value: missingTimestamps,
      detail: "Records without a valid timestamp",
      status: missingTimestamps > 0 ? "warning" : "good",
    },
    {
      label: "Duplicate record IDs",
      value: duplicateIds,
      detail: "Repeated IDs that may cause record conflicts",
      status: duplicateIds > 0 ? "warning" : "good",
    },
    {
      label: "Unmatched session references",
      value: orphanedSessionReferences,
      detail: "Records linked to a session that no longer exists",
      status: orphanedSessionReferences > 0 ? "warning" : "good",
    },
  ];

  const issueCount =
    invalidResults +
    missingTimestamps +
    duplicateIds +
    orphanedSessionReferences;

  return (
    <section className="panel data-quality-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">07 / DATA RELIABILITY</p>
          <h3>Data Quality Monitor</h3>
        </div>

        <span
          className={`quality-status ${
            issueCount === 0 ? "quality-good" : "quality-warning"
          }`}
        >
          {issueCount === 0 ? "NO ISSUES DETECTED" : "REVIEW REQUIRED"}
        </span>
      </div>

      <p className="helper-text">
        Checks the complete recorded history for basic data consistency.
        Unassigned legacy results are allowed.
      </p>

      <div className="quality-summary-grid">
        <article className="chart-card quality-summary-card">
          <span>Total records</span>
          <strong>{history.length}</strong>
        </article>

        <article className="chart-card quality-summary-card">
          <span>Valid results</span>
          <strong>{validResults.length}</strong>
        </article>

        <article className="chart-card quality-summary-card">
          <span>Color-only results</span>
          <strong>{colorOnlyResults}</strong>
        </article>

        <article className="chart-card quality-summary-card">
          <span>Issues detected</span>
          <strong>{issueCount}</strong>
        </article>
      </div>

      <div className="quality-check-list">
        {checks.map((check) => (
          <div className="quality-check-row" key={check.label}>
            <div className="quality-check-info">
              <span
                className={`quality-indicator ${
                  check.status === "good" ? "indicator-good" : "indicator-warning"
                }`}
              />
              <div>
                <strong>{check.label}</strong>
                <p>{check.detail}</p>
              </div>
            </div>

            <strong className="quality-check-value">{check.value}</strong>
          </div>
        ))}
      </div>

      <p className="chart-disclaimer">
        This monitor checks basic record consistency. It does not prove that
        recorded outcomes are accurate or that a roulette wheel is fair.
      </p>
    </section>
  );
}
