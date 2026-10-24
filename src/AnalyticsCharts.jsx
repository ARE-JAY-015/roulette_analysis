
import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import "./AnalyticsCharts.css";

const COLORS = {
  red: "#e65363",
  black: "#64748b",
  green: "#10b981",
  gold: "#d8b45a",
};

function getResultColor(item) {
  if (item.colorOnly) return item.colorOnly;
  return getColor(getNumber(item));
}

function getNumber(item) {
  return typeof item === "number" ? item : item.number;
}

function getColor(number) {
  if (number === 0) return "green";

  const redNumbers = new Set([
    1, 3, 5, 7, 9, 12, 14, 16, 18,
    19, 21, 23, 25, 27, 30, 32, 34, 36,
  ]);

  return redNumbers.has(number) ? "red" : "black";
}

export default function AnalyticsCharts({
  history = [],
  sessions = [],
})  {
  const [colorFilter, setColorFilter] = useState("all");

  const sessionComparisonData = sessions.map((session) => {
  const sessionResults = history.filter(
    (item) => item.sessionId === session.id
  );

  const getCount = (color) =>
    sessionResults.filter(
      (item) => getResultColor(item) === color
    ).length;

  return {
    name: session.name,
    total: sessionResults.length,
    red: getCount("red"),
    black: getCount("black"),
    green: getCount("green"),
  };
});

const totalSessionOutcomes = sessionComparisonData.reduce(
  (sum, session) => sum + session.total,
  0
);

const averageOutcomesPerSession =
  sessionComparisonData.length > 0
    ? (totalSessionOutcomes / sessionComparisonData.length).toFixed(1)
    : "0.0";

const busiestSession = sessionComparisonData.reduce(
  (best, session) =>
    !best || session.total > best.total ? session : best,
  null
);

const filteredHistory =
  colorFilter === "all"
    ? history
    : history.filter(
        (item) => getResultColor(item) === colorFilter
      );

const numbers = filteredHistory
  .map(getNumber)
  .filter((n) => n !== null);

  const redCount = filteredHistory.filter(
  (item) => getResultColor(item) === "red"
).length;

const blackCount = filteredHistory.filter(
  (item) => getResultColor(item) === "black"
).length;

const greenCount = filteredHistory.filter(
  (item) => getResultColor(item) === "green"
).length;

  const colorData = [
    { name: "Red", value: redCount, color: COLORS.red },
    { name: "Black", value: blackCount, color: COLORS.black },
    { name: "Green", value: greenCount, color: COLORS.green },
  ];

  const frequencyData = Array.from({ length: 37 }, (_, number) => ({
    number: String(number),
    frequency: numbers.filter((n) => n === number).length,
    color: COLORS[getColor(number)],
  }));

  // History is newest first, so reverse it for chronological display.
  const trendData = numbers
    .slice()
    .reverse()
    .map((number, index) => ({
      spin: index + 1,
      result: number,
    }));
   


  return (
    <section className="panel analytics-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">05 / VISUAL ANALYTICS</p>
          <h3>Explore your spin data</h3>
        </div>
        <span className="small-label">
          {numbers.length} SPINS
        </span>
      </div>
      <div className="session-kpi-grid">
        <article className="chart-card session-kpi-card">
          <p>Total session outcomes</p>
          <strong>{totalSessionOutcomes}</strong>
          <span>Results linked to saved sessions</span>
        </article>

        <article className="chart-card session-kpi-card">
          <p>Average per session</p>
          <strong>{averageOutcomesPerSession}</strong>
          <span>Outcomes per saved session</span>
        </article>

        <article className="chart-card session-kpi-card">
          <p>Busiest session</p>
          <strong className="session-kpi-name">
            {busiestSession?.name || "No sessions"}
          </strong>
          <span>
            {busiestSession
              ? `${busiestSession.total} recorded outcomes`
              : "Create a session to begin"}
          </span>
        </article>
      </div>

      <div className="chart-filters">
  <span>Filter by color:</span>

  {["all", "red", "black", "green"].map((color) => (
    <button
      key={color}
      className={`filter-button ${
        colorFilter === color ? "active" : ""
      }`}
      onClick={() => setColorFilter(color)}
    >
      {color === "all"
        ? "All results"
        : color.charAt(0).toUpperCase() + color.slice(1)}
    </button>
  ))}
</div>

      <p className="helper-text">
        Hover over chart elements to inspect values. Charts update
        when you record or remove results.
      </p>

      {numbers.length === 0 ? (
        <div className="analytics-empty">
          <h4>No chart data yet</h4>
          <p>Record some roulette results to populate the charts.</p>
        </div>
      ) : (
        <>
          <div className="analytics-grid">
            <article className="chart-card">
              <h4>Color distribution</h4>
              <p>Recorded outcomes by color</p>

              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={colorData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius="75%"
                      paddingAngle={3}
                    >
                      {colorData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#151b19",
                        border: "1px solid #303936",
                        borderRadius: 8,
                        color: "#ffffff",
                      }}
                      formatter={(value, name) => [
                        `${value} spins (${(
                          (value / numbers.length) * 100
                        ).toFixed(1)}%)`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <p className="chart-disclaimer"></p>
                
         
              </div>

              <div className="chart-legend">
                {colorData.map((item) => (
                  <span key={item.name}>
                    <i style={{ background: item.color }} />
                    {item.name}: {item.value}
                  </span>
                ))}
              </div>
            </article>

            <article className="chart-card">
              <h4>Number frequency</h4>
              <p>Occurrences of each number from 0–36</p>

              <div className="chart-container frequency-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={frequencyData}
                    margin={{ top: 10, right: 8, left: -18, bottom: 5 }}
                  >
                    <CartesianGrid
                      stroke="#303936"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="number"
                      tick={{ fill: "#a5b1ac", fontSize: 10 }}
                      interval={2}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "#a5b1ac", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#151b19",
                        border: "1px solid #303936",
                        borderRadius: 8,
                        color: "#ffffff",
                      }}
                      formatter={(value) => [value, "Occurrences"]}
                      labelFormatter={(label) => `Number ${label}`}
                    />
                    <Bar dataKey="frequency" name="Occurrences" radius={[3, 3, 0, 0]}>
                      {frequencyData.map((item) => (
                        <Cell
                          key={item.number}
                          fill={item.color}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="chart-card chart-card-wide">
              <h4>Results over time</h4>
              <p>Each point represents one recorded spin, in chronological order</p>

              <div className="chart-container trend-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 12, right: 16, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      stroke="#303936"
                      strokeDasharray="3 3"
                    />
                    
                    <XAxis
                      dataKey="spin"
                      tick={{ fill: "#a5b1ac", fontSize: 11 }}
                      tickLine={false}
                      label={{
                        value: "Spin number",
                        position: "insideBottom",
                        offset: -2,
                        fill: "#a5b1ac",
                        fontSize: 11,
                      }}
                    />
                    <YAxis
                      domain={[0, 36]}
                      ticks={[0, 9, 18, 27, 36]}
                      tick={{ fill: "#a5b1ac", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#151b19",
                        border: "1px solid #303936",
                        borderRadius: 8,
                        color: "#ffffff",
                      }}
                      formatter={(value) => [value, "Result"]}
                      labelFormatter={(label) => `Spin ${label}`}
                    />
                    <Line
                      type="linear"
                      dataKey="result"
                      name="Result"
                      stroke={COLORS.gold}
                      strokeWidth={2}
                      dot={{ r: 3, fill: COLORS.gold }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>
          </div>
           
          {sessionComparisonData.length > 0 && (
            <div className="analytics-grid session-analytics-grid">
              <article className="chart-card">
                <h4>Session Totals</h4>
                <p>Total recorded outcomes per session</p>

                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sessionComparisonData}>
                      <CartesianGrid
                        stroke="#303936"
                        strokeDasharray="3 3"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#a5b1ac", fontSize: 11 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: "#a5b1ac", fontSize: 11 }}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="total"
                        name="Total outcomes"
                        fill={COLORS.gold}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="chart-card">
                <h4>Color Comparison by Session</h4>
                <p>Red, black, and green outcomes per session</p>

                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sessionComparisonData}>
                      <CartesianGrid
                        stroke="#303936"
                        strokeDasharray="3 3"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#a5b1ac", fontSize: 11 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: "#a5b1ac", fontSize: 11 }}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="red" name="Red" fill={COLORS.red} />
                      <Bar dataKey="black" name="Black" fill={COLORS.black} />
                      <Bar dataKey="green" name="Green" fill={COLORS.green} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </div>
          )}

          <p className="chart-disclaimer">
            These charts summarize historical results. Random variation
            is expected, and past outcomes do not predict future spins.
          </p>
        </>
      )}
    </section>
  );
}
