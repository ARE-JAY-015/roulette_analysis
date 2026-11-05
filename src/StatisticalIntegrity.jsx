import "./StatisticalIntegrity.css";

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18,
  19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

const EXPECTED_PROBABILITIES = {
  red: 18 / 37,
  black: 18 / 37,
  green: 1 / 37,
};

function getResultColor(item) {
  if (!item || typeof item !== "object") return null;

  const hasNumber = Object.prototype.hasOwnProperty.call(item, "number");
  const hasColorOnly = Object.prototype.hasOwnProperty.call(item, "colorOnly");

  // Reject records containing both result types or neither.
  if (hasNumber === hasColorOnly) return null;

  if (hasColorOnly) {
    return ["red", "black", "green"].includes(item.colorOnly)
      ? item.colorOnly
      : null;
  }

  if (!Number.isInteger(item.number) || item.number < 0 || item.number > 36) {
    return null;
  }

  if (item.number === 0) return "green";

  return RED_NUMBERS.has(item.number) ? "red" : "black";
}

function formatNumber(value) {
  return value.toFixed(2);
}

function formatPercentage(value) {
  return `${value.toFixed(2)}%`;
}

function downloadStatisticalReport({
  rows,
  total,
  observed,
  expected,
  chiSquare,
  pValue,
  minimumSampleReached,
  invalidRecords,
}) {
  const testStatus = !minimumSampleReached
    ? "Insufficient sample size"
    : pValue <= 0.05
    ? "Statistically significant deviation"
    : "No statistically significant deviation";

  const reportRows = [
    ["ROULETTIQ - STATISTICAL INTEGRITY REPORT"],
    ["Generated at", new Date().toLocaleString()],
    ["Roulette type", "European roulette"],
    ["Total valid results", total],
    ["Invalid or unclassified records", invalidRecords],
    [],
    ["COLOR DISTRIBUTION"],
    ["Color", "Observed", "Expected", "Observed %", "Expected %"],
    ...rows.map((row) => [
      row.color.toUpperCase(),
      row.observed,
      row.expected.toFixed(2),
      `${row.observedPercentage.toFixed(2)}%`,
      `${row.expectedPercentage.toFixed(2)}%`,
    ]),
    [],
    ["CHI-SQUARE GOODNESS-OF-FIT TEST"],
    ["Test status", testStatus],
    [
      "Chi-square statistic",
      minimumSampleReached ? chiSquare.toFixed(4) : "Not evaluated",
    ],
    [
      "P-value",
      minimumSampleReached ? pValue.toFixed(6) : "Not evaluated",
    ],
    ["Significance level", "0.05"],
    ["Degrees of freedom", "2"],
    ["Minimum recommended sample", "185"],
    [],
    ["THEORETICAL PROBABILITIES"],
    ["Red", "18/37"],
    ["Black", "18/37"],
    ["Green", "1/37"],
    [],
    [
      "Disclaimer",
      "Roulette spins are independent. Historical results do not predict future outcomes. This test cannot establish that a wheel is fair or unfair.",
    ],
  ];

  const escapeCsv = (value) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };

  const csvContent = reportRows
    .map((row) => row.map(escapeCsv).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `RouletteIQ_Statistical_Report_${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export default function StatisticalIntegrity({
  history = [],
}) {
  const observed = {
    red: 0,
    black: 0,
    green: 0,
  };

  let invalidRecords = 0;

  history.forEach((item) => {
    const color = getResultColor(item);

    if (color) {
      observed[color] += 1;
    } else {
      invalidRecords += 1;
    }
  });

  const total = observed.red + observed.black + observed.green;

  const expected = {
    red: total * EXPECTED_PROBABILITIES.red,
    black: total * EXPECTED_PROBABILITIES.black,
    green: total * EXPECTED_PROBABILITIES.green,
  };

  const rows = ["red", "black", "green"].map((color) => {
    const observedCount = observed[color];
    const expectedCount = expected[color];

    return {
      color,
      observed: observedCount,
      expected: expectedCount,
      observedPercentage:
        total > 0 ? (observedCount / total) * 100 : 0,
      expectedPercentage: EXPECTED_PROBABILITIES[color] * 100,
    };
  });

  // Chi-square statistic:
  // Sum of (observed - expected)^2 / expected
  const chiSquare =
    total > 0
      ? rows.reduce((sum, row) => {
          if (row.expected === 0) return sum;

          return (
            sum +
            Math.pow(row.observed - row.expected, 2) /
              row.expected
          );
        }, 0)
      : null;

  // For 3 categories, degrees of freedom = 3 - 1 = 2.
  // The survival probability for Chi-square(df = 2) is exp(-x / 2).
  const pValue =
    chiSquare !== null ? Math.exp(-chiSquare / 2) : null;

  // Green's expected count is the limiting category.
  // N / 37 must be at least 5, so N must be at least 185.
  const minimumSampleReached = total >= 185;

  let testStatus = "insufficient";

  if (minimumSampleReached && pValue !== null) {
    testStatus = pValue <= 0.05 ? "significant" : "not-significant";
  }

  return (
    <section className="panel statistical-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">08 / STATISTICAL VALIDATION</p>
          <h3>Statistical Integrity Dashboard</h3>
        </div>

        <span className="statistical-sample-badge">
          {total} VALID RESULTS
        </span>
      </div>

      <p className="helper-text">
        Compares your recorded color distribution with the theoretical
        probabilities of a European roulette wheel.
      </p>

      <div className="statistical-export-row">
  <button
    className="statistical-export-button"
    onClick={() =>
      downloadStatisticalReport({
        rows,
        total,
        observed,
        expected,
        chiSquare,
        pValue,
        minimumSampleReached,
        invalidRecords,
      })
    }
  >
    Download Statistical Report (CSV)
  </button>
</div>

      <div className="statistical-summary-grid">
        <article className="chart-card statistical-summary-card">
          <span>Observed results</span>
          <strong>{total}</strong>
        </article>

        <article className="chart-card statistical-summary-card">
          <span>Red outcomes</span>
          <strong>{observed.red}</strong>
        </article>

        <article className="chart-card statistical-summary-card">
          <span>Black outcomes</span>
          <strong>{observed.black}</strong>
        </article>

        <article className="chart-card statistical-summary-card">
          <span>Green outcomes</span>
          <strong>{observed.green}</strong>
        </article>
      </div>

      <div className="statistical-table-wrapper">
        <h4>Observed vs Expected Distribution</h4>

        <table className="statistical-table">
          <thead>
            <tr>
              <th>Color</th>
              <th>Observed</th>
              <th>Expected</th>
              <th>Observed %</th>
              <th>Expected %</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.color}>
                <td>
                  <span className="statistical-color-name">
                    <span
                      className={`statistical-color-dot ${row.color}`}
                    />
                    {row.color.toUpperCase()}
                  </span>
                </td>
                <td>{row.observed}</td>
                <td>{formatNumber(row.expected)}</td>
                <td>{formatPercentage(row.observedPercentage)}</td>
                <td>{formatPercentage(row.expectedPercentage)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="statistical-test-card">
        <div className="statistical-test-heading">
          <div>
            <p className="eyebrow">GOODNESS-OF-FIT TEST</p>
            <h4>Chi-square Statistical Test</h4>
          </div>

          <span
            className={`statistical-test-status ${
              testStatus === "insufficient"
                ? "test-insufficient"
                : testStatus === "significant"
                ? "test-significant"
                : "test-not-significant"
            }`}
          >
            {testStatus === "insufficient"
              ? "MORE DATA REQUIRED"
              : testStatus === "significant"
              ? "STATISTICALLY SIGNIFICANT"
              : "NO SIGNIFICANT DEVIATION"}
          </span>
        </div>

        <div className="statistical-metrics">
  <div>
    <span>Chi-square statistic</span>
    <strong>
      {minimumSampleReached
        ? formatNumber(chiSquare)
        : "Not evaluated"}
    </strong>
  </div>

  <div>
    <span>P-value</span>
    <strong>
      {minimumSampleReached
        ? formatNumber(pValue)
        : "Not evaluated"}
    </strong>
  </div>

  <div>
    <span>Significance level</span>
    <strong>0.05</strong>
  </div>

  <div>
    <span>Degrees of freedom</span>
    <strong>2</strong>
  </div>
</div>

        {!minimumSampleReached ? (
  <p className="statistical-explanation">
    Statistical testing is currently unavailable because your
    sample size is too small. The Chi-square test requires an
    expected count of at least 5 in every category.

    For European roulette, you need at least 185 valid results.
    You currently have {total}.

    Continue recording results to unlock statistical evaluation.
  </p>
        ) : testStatus === "significant" ? (
          <p className="statistical-explanation">
            The observed distribution differs from the theoretical
            distribution at the 5% significance level. This is a reason
            to investigate the data and collection process, not proof
            that the wheel is biased.
          </p>
        ) : (
          <p className="statistical-explanation">
            The test did not find sufficient evidence of a difference
            from the theoretical distribution at the 5% significance
            level. This does not prove that the wheel is fair.
          </p>
        )}
      </div>

      {invalidRecords > 0 && (
        <p className="statistical-warning">
          {invalidRecords} record(s) were excluded because they could not
          be classified as valid roulette outcomes.
        </p>
      )}

      <p className="chart-disclaimer">
        European roulette theoretical probabilities: red 18/37, black
        18/37, green 1/37. Each spin is independent. Historical results
        do not predict future outcomes. This statistical test cannot
        establish that a wheel is fair or unfair.
      </p>
    </section>
  );
}




