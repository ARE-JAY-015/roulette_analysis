
import "./ResultsDashboard.css";

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18,
  19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

function getColor(number) {
  if (number === 0) return "green";
  return RED_NUMBERS.has(number) ? "red" : "black";
}

export default function ResultsDashboard({ results = [], onClear }) {
  const total = results.length;
  const reds = results.filter((n) => n === 0 ? false : RED_NUMBERS.has(n)).length;
  const blacks = results.filter((n) => n !== 0 && !RED_NUMBERS.has(n)).length;
  const zeros = results.filter((n) => n === 0).length;

  return (
    <section className="results-dashboard">
      <div className="dashboard-heading">
        <div>
          <p className="dashboard-eyebrow">ROULETTEIQ ANALYTICS</p>
          <h2>Live Results</h2>
          <p className="dashboard-subtitle">
            Track results from your current session.
          </p>
        </div>

        <span className="session-badge">LIVE SESSION</span>
      </div>

      <div className="dashboard-stats">
        <article className="stat-card">
          <span>Total spins</span>
          <strong>{total}</strong>
        </article>

        <article className="stat-card">
          <span>Red</span>
          <strong className="red-text">{reds}</strong>
        </article>

        <article className="stat-card">
          <span>Black</span>
          <strong>{blacks}</strong>
        </article>

        <article className="stat-card">
          <span>Zero</span>
          <strong className="green-text">{zeros}</strong>
        </article>
      </div>

      <div className="recent-results">
        <div className="section-heading">
          <div>
            <h3>Recent numbers</h3>
            <p>Newest result first</p>
          </div>

          {total > 0 && (
            <button className="clear-results" onClick={onClear}>
              Clear history
            </button>
          )}
        </div>

        {total === 0 ? (
          <div className="empty-results">
            <span className="empty-icon">↻</span>
            <h3>No spins yet</h3>
            <p>Spin the roulette wheel to see your results here.</p>
          </div>
        ) : (
          <div className="result-list">
            {results.slice(0, 20).map((number, index) => (
              <div className="result-item" key={`${index}-${number}`}>
                <span className={`number-ball ${getColor(number)}`}>
                  {number}
                </span>
                <span className="result-number-label">
                  {index === 0 ? "Latest result" : `Spin ${total - index}`}
                </span>
                <span className="result-color-label">
                  {getColor(number).toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="dashboard-note">
        Statistics describe past results and do not predict future spins.
      </p>
    </section>
  );
}
