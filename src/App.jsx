
import StatisticalIntegrity from "./StatisticalIntegrity.jsx";
import DataQualityMonitor from "./DataQualityMonitor.jsx";
import SessionInsights from "./SessionInsights.jsx";
import AnalyticsCharts from "./AnalyticsCharts.jsx";
import { useEffect, useState, useMemo } from "react";
import "./App.css";
import RouletteWheel from "./Roulettewheel.jsx";

const RED = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18,
  19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

function getColor(n) {
  if (n === 0) return "green";
  return RED.has(n) ? "red" : "black";
}

function getNumber(item) {
  if (typeof item === "number") return item;
  if (item.colorOnly) return null;
  return item.number;
}

function getResultColor(item) {
  if (item.colorOnly) return item.colorOnly;
  return getColor(getNumber(item));
}

function App() {
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("rouletteiq-history");
      const parsed = saved ? JSON.parse(saved) : [];

      if (!Array.isArray(parsed)) return [];

      return parsed
    
.map((item) => {
  // Support older history entries saved as plain numbers.
  if (typeof item === "number") {
    if (!Number.isInteger(item) || item < 0 || item > 36) {
      return null;
    }

    return {
      number: item,
      timestamp: Date.now(),
      sessionId: null,
    };
  }

  // Preserve session information for color-only results.
  if (
    item?.colorOnly &&
    ["red", "black", "green"].includes(item.colorOnly)
  ) {
    return {
      ...item,
      colorOnly: item.colorOnly,
      timestamp: item.timestamp || Date.now(),
      sessionId: item.sessionId || null,
    };
  }

  // Preserve session information for numbered results.
  if (
    Number.isInteger(item?.number) &&
    item.number >= 0 &&
    item.number <= 36
  ) {
    return {
      ...item,
      number: item.number,
      timestamp: item.timestamp || Date.now(),
      sessionId: item.sessionId || null,
    };
  }

  return null;
})

        .filter(Boolean)
        .slice(0, 200);
    } catch {
      return [];
    }
  });
   
const [sessions, setSessions] = useState(() => {
  try {
    return JSON.parse(
      localStorage.getItem("rouletteiq-sessions") || "[]"
    );
  } catch {
    return [];
  }
});

const [activeSessionId, setActiveSessionId] = useState(() => {
  return localStorage.getItem("rouletteiq-active-session") || "";
});

const [selectedSessionId, setSelectedSessionId] = useState("all");


const [auditLog, setAuditLog] = useState(() => {
  try {
    return JSON.parse(
      localStorage.getItem("rouletteiq-audit-log") || "[]"
    );
  } catch {
    return [];
  }
});





useEffect(() => {
  localStorage.setItem(
    "rouletteiq-audit-log",
    JSON.stringify(auditLog)
  );
}, [auditLog]);

const [dateFrom, setDateFrom] = useState("");
const [dateTo, setDateTo] = useState("");
useEffect(() => {
  localStorage.setItem(
    "rouletteiq-sessions",
    JSON.stringify(sessions)
  );
}, [sessions]);

useEffect(() => {
  localStorage.setItem(
    "rouletteiq-active-session",
    activeSessionId
  );
}, [activeSessionId]);

  const [selected, setSelected] = useState(null);
 const [editingId, setEditingId] = useState(null);
const [correctionValue, setCorrectionValue] = useState("");
const [correctionReason, setCorrectionReason] = useState("");

  const getLocalDate = (timestamp) => {
  const date = new Date(timestamp);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const filteredHistory = history.filter((item) => {
  const sessionId = item.sessionId || null;
  const timestamp = item.timestamp || Date.now();
  const resultDate = getLocalDate(timestamp);

  const matchesSession =
    selectedSessionId === "all" ||
    (selectedSessionId === "legacy" && !sessionId) ||
    sessionId === selectedSessionId;

  const matchesFrom = !dateFrom || resultDate >= dateFrom;
  const matchesTo = !dateTo || resultDate <= dateTo;

  return matchesSession && matchesFrom && matchesTo;
});

const historyNumbers = filteredHistory
  .map(getNumber)
  .filter((number) => number !== null);
  useEffect(() => {
    localStorage.setItem(
      "rouletteiq-history",
      JSON.stringify(history)
    );
  }, [history]);

  useEffect(() => {
    setSelected(history.length ? getNumber(history[0]) : null);
  }, [history]);


  const [editingResultKey, setEditingResultKey] = useState(null);

 
const addResult = (number) => {
  if (!Number.isInteger(number) || number < 0 || number > 36) {
    return;
  }

  const result = {
    id: crypto.randomUUID(),
    number,
    timestamp: Date.now(),
    sessionId: activeSessionId || null,
    source: "manual",
  };

  setHistory((old) => [result, ...old].slice(0, 2000));
  setSelected(number);
};


  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
const [newSessionName, setNewSessionName] = useState("");

const handleCreateSession = (e) => {
  e.preventDefault();
  if (!newSessionName.trim()) return;

  const session = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: newSessionName.trim(),
    startedAt: Date.now(),
  };

  setSessions((old) => [...old, session]);
  setActiveSessionId(session.id);
  setSelectedSessionId(session.id);
  setNewSessionName("");
  setIsSessionModalOpen(false);
};

const endSession = () => {
  setActiveSessionId("");
};


const addColorResult = (color) => {
  if (!["red", "black", "green"].includes(color)) {
    return;
  }

  const result = {
    id: crypto.randomUUID(),
    colorOnly: color,
    timestamp: Date.now(),
    sessionId: activeSessionId || null,
    source: "manual-color",
  };

  setHistory((old) => [result, ...old].slice(0, 200));
  setSelected(null);
};

  const removeLatest = () => {
    setHistory((old) => old.slice(1));
  };

  const clearHistory = () => {
    setHistory([]);
  };
  
 const startCorrection = (item) => {
  setEditingId(item.id);
  setCorrectionValue(item.colorOnly ? item.colorOnly : String(item.number));
  setCorrectionReason("");
};

const cancelCorrection = () => {
  setEditingId(null);
  setCorrectionValue("");
  setCorrectionReason("");
};


const saveCorrection = (item) => {
  const reason = correctionReason.trim();
  if (!reason) {
    alert("Please enter a reason for the correction.");
    return;
  }

  let updatedFields;
  let correctedNumber = null;
  let correctedColor = null;

  if (item.colorOnly) {
    const color = correctionValue.toLowerCase();
    if (!["red", "black", "green"].includes(color)) return;
    updatedFields = { colorOnly: color };
    correctedColor = color;
  } else {
    const num = Number(correctionValue);
    if (!Number.isInteger(num) || num < 0 || num > 36) return;
    updatedFields = { number: num };
    correctedNumber = num;
    correctedColor = getColor(num);
  }

  // Record into audit log
  setAuditLog((prev) => [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      originalNumber: getNumber(item),
      originalColor: getResultColor(item),
      correctedNumber,
      correctedColor,
      reason,
      originalTimestamp: item.timestamp,
      correctedAt: Date.now(),
      sessionId: item.sessionId || null,
    },
    ...prev,
  ]);

  // Update item in history by unique ID
  setHistory((prev) =>
    prev.map((rec) => (rec.id === item.id ? { ...rec, ...updatedFields } : rec))
  );

  cancelCorrection();
};



const exportAuditLog = () => {
  if (auditLog.length === 0) {
    alert("There are no correction records to export.");
    return;
  }

  const headers = [
    "Original_Result",
    "Original_Color",
    "Corrected_Result",
    "Corrected_Color",
    "Reason",
    "Correction_Time",
    "Original_Timestamp",
    "Session_ID",
  ];

  const rows = auditLog.map((entry) => [
    entry.originalNumber ?? "",
    entry.originalColor,
    entry.correctedNumber ?? "",
    entry.correctedColor,
    entry.reason,
    new Date(entry.correctedAt).toISOString(),
    entry.originalTimestamp
      ? new Date(entry.originalTimestamp).toISOString()
      : "",
    entry.sessionId || "Unassigned",
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((value) =>
          `"${String(value).replace(/"/g, '""')}"`
        )
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `rouletteiq-audit-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};



  const exportHistory = () => {
  if (filteredHistory.length === 0) {
  alert("No results available in the current filters.");
  return;
}

   const headers = [
  "Spin_Number",
  "Result",
  "Color",
  "Parity",
  "Timestamp",
  "Session_ID",
];

   const rows = filteredHistory.map((item, index) => {
  const number = getNumber(item);
  const color = getResultColor(item);
  

  return [
    filteredHistory.length - index,
    number === null ? "" : number,
    color,
    parity,
    new Date(item.timestamp).toISOString(),
    item.sessionId || "Unassigned",
  ];
});

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `rouletteiq-history-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };


 const redCount = filteredHistory.filter(
  (item) => getResultColor(item) === "red"
).length;

const blackCount = filteredHistory.filter(
  (item) => getResultColor(item) === "black"
).length;

const zeroCount = filteredHistory.filter(
  (item) => getNumber(item) === 0
).length;

  const oddCount = historyNumbers.filter(
    (n) => n !== 0 && n % 2 === 1
  ).length;
  const evenCount = historyNumbers.filter(
    (n) => n !== 0 && n % 2 === 0
  ).length;
  const lowCount = historyNumbers.filter(
    (n) => n >= 1 && n <= 18
  ).length;
  const highCount = historyNumbers.filter(
    (n) => n >= 19 && n <= 36
  ).length;


  const counts = useMemo(() => {
  return Array.from({ length: 37 }, (_, number) => ({
    number,
    count: historyNumbers.filter((n) => n === number).length,
  }));
}, [historyNumbers]);

// Separate total records from numbered records
const numberedSpins = filteredHistory.filter((item) => getNumber(item) !== null);
const totalRecords = filteredHistory.length;
const totalNumbered = numberedSpins.length;

// Colors use all records (including color-only entries)
const percentage = (count) =>
  totalRecords ? ((count / totalRecords) * 100).toFixed(1) : "0.0";

// Parity and Range only divide by numbered spins (prevents deflated stats)
const numberPercentage = (count) =>
  totalNumbered ? ((count / totalNumbered) * 100).toFixed(1) : "0.0";
   
const reportSession =
  sessions.find((session) => session.id === selectedSessionId) || null;

const reportHistory = filteredHistory;

const reportTotal = reportHistory.length;

const reportNumbered = reportHistory.filter(
  (item) => getNumber(item) !== null
);

const reportRed = reportHistory.filter(
  (item) => getResultColor(item) === "red"
).length;

const reportBlack = reportHistory.filter(
  (item) => getResultColor(item) === "black"
).length;

const reportGreen = reportHistory.filter(
  (item) => getResultColor(item) === "green"
).length;

const reportPercentage = (count) =>
  reportTotal > 0
    ? ((count / reportTotal) * 100).toFixed(1)
    : "0.0";

const reportStartedAt = reportSession?.startedAt
  ? new Date(reportSession.startedAt).toLocaleString()
  : "Not available";


  
const sessionComparison = sessions.map((session) => {
  const sessionResults = history.filter(
    (item) => item.sessionId === session.id
  );

  const numbered = sessionResults.filter(
    (item) => getNumber(item) !== null
  );

  const red = sessionResults.filter(
    (item) => getResultColor(item) === "red"
  ).length;

  const black = sessionResults.filter(
    (item) => getResultColor(item) === "black"
  ).length;

  const green = sessionResults.filter(
    (item) => getResultColor(item) === "green"
  ).length;

  // Simulates a batch of spins to test Chi-Square anomaly detection
const simulateBatch = (count = 500, biased = false) => {
  const newSpins = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    let outcome;
    if (biased && Math.random() < 0.15) {
      // 15% biased weighting toward the '0' pocket and neighboring pockets 26 and 32
      const biasPockets = [0, 26, 32];
      outcome = biasPockets[Math.floor(Math.random() * biasPockets.length)];
    } else {
      // True fair uniform distribution (0 to 36)
      outcome = Math.floor(Math.random() * 37);
    }

    newSpins.push({
      id: crypto.randomUUID(),
      number: outcome,
      timestamp: now - (count - i) * 1000,
      sessionId: activeSessionId || null,
      source: biased ? "simulated-bias" : "simulated-fair",
    });
  }

  setHistory((old) => [...newSpins.reverse(), ...old].slice(0, 2000));
};

  return {
    id: session.id,
    name: session.name,
    total: sessionResults.length,
    numbered: numbered.length,
    red,
    black,
    green,
    startedAt: session.startedAt,
  };
}).sort((a, b) => b.total - a.total);

const busiestSession = sessionComparison.reduce(
  (best, session) =>
    !best || session.total > best.total ? session : best,
  null
);




const exportSessionReport = () => {
  if (reportTotal === 0) {
    alert("No results available to export for this report.");
    return;
  }

  const reportRows = [
    ["Report_Type", "Session_Management_Report"],
    ["Session_Name", reportSession?.name || "All / Filtered Sessions"],
    ["Session_ID", reportSession?.id || selectedSessionId],
    ["Session_Started_At", reportStartedAt],
    ["Report_Generated_At", new Date().toLocaleString()],
    ["Total_Recorded_Outcomes", reportTotal],
    ["Numbered_Results", reportNumbered.length],
    ["Red_Count", reportRed],
    ["Red_Percentage", `${reportPercentage(reportRed)}%`],
    ["Black_Count", reportBlack],
    ["Black_Percentage", `${reportPercentage(reportBlack)}%`],
    ["Green_Count", reportGreen],
    ["Green_Percentage", `${reportPercentage(reportGreen)}%`],
    ["Date_From", dateFrom || "Not set"],
    ["Date_To", dateTo || "Not set"],
  ];

  const csv = reportRows
    .map((row) =>
      row
        .map((value) =>
          `"${String(value).replace(/"/g, '""')}"`
        )
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `rouletteiq-session-report-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};


  
  const highest = Math.max(0, ...counts.map((item) => item.count));

  // Batch simulation for testing Chi-Square and charts
  const simulateBatch = (count = 500, biased = false) => {
    const newSpins = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      let outcome;
      if (biased && Math.random() < 0.15) {
        // 15% biased weighting toward pockets 0, 26, and 32
        const biasPockets = [0, 26, 32];
        outcome = biasPockets[Math.floor(Math.random() * biasPockets.length)];
      } else {
        // Fair random pocket (0 to 36)
        outcome = Math.floor(Math.random() * 37);
      }

      const id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${i}`;

      newSpins.push({
        id,
        number: outcome,
        timestamp: now - (count - i) * 1000,
        sessionId: activeSessionId || null,
        source: biased ? "simulated-bias" : "simulated-fair",
      });
    }

    setHistory((old) => [...newSpins.reverse(), ...old].slice(0, 2000));
  };

  const mostFrequent = highest
    ? counts.filter((item) => item.count === highest)
    : [];

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">R</div>
          <div>
            <h1>
              ROULETTE<span>IQ</span>
            </h1>
            <p>ROULETTE STATISTICS &amp; ANALYTICS</p>
          </div>
        </div>

        <div className="live-label">
          <span className="status-dot" /> MANUAL DATA MODE
        </div>
      </header>

      <section className="wheel-section">
        <RouletteWheel onResult={addResult} />
      </section>

      <section className="intro">
        <p className="eyebrow">EUROPEAN ROULETTE · 0–36</p>
        <h2>Understand the numbers.</h2>
        <p className="subtitle">
          Record spin results and explore the statistics behind your data.
        </p>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <p>Total spins recorded</p>
          <strong>{history.length}</strong>
          <span>Maximum 2,000 recent results</span>
        </article>

        <article className="stat-card">
          <p>Red outcomes</p>
          <strong className="red-text">{redCount}</strong>
          <span>{percentage(redCount)}% of recorded spins</span>
        </article>

        <article className="stat-card">
          <p>Black outcomes</p>
          <strong>{blackCount}</strong>
          <span>{percentage(blackCount)}% of recorded spins</span>
        </article>

        <article className="stat-card">
          <p>Green outcomes</p>
          <strong className="green-text">{zeroCount}</strong>
          <span>{percentage(zeroCount)}% of recorded spins</span>
        </article>
      </section>

      <section className="panel session-panel">
  <div className="section-heading">
    <div>
      <p className="eyebrow">SESSION MANAGEMENT</p>
      <h3>Spin sessions</h3>
    </div>
    <span className="small-label">
      {activeSessionId ? "SESSION ACTIVE" : "NO ACTIVE SESSION"}
    </span>
  </div>


<div className="session-actions">
  <button
  type="button"
  className="secondary-button"
  onClick={() => setIsSessionModalOpen(true)}
  disabled={Boolean(activeSessionId)}
>
  Start Session
</button>


<button
  type="button"
  className="secondary-button"
  onClick={() => simulateBatch(500, false)}
  style={{ borderColor: "#10b981", color: "#10b981" }}
>
  + 500 Fair Spins
</button>



  <button
    type="button"
    className="danger-button"
    onClick={() => {
      console.log("End Session clicked");
      endSession();
    }}
    disabled={!activeSessionId}
  >
    End Session
  </button>

  <button
  type="button"
  className="secondary-button"
  onClick={() => simulateBatch(500, true)}
  style={{ borderColor: "#fa6670", color: "#fa6670" }}
>
  + 500 Biased Spins (Test Anomaly)
</button>


</div>



  <div className="session-filters">
    <label>
      View session
      <select
        value={selectedSessionId}
        onChange={(event) => setSelectedSessionId(event.target.value)}
      >
        <option value="all">All sessions</option>
        <option value="legacy">Legacy / Unassigned</option>
        {sessions.map((session) => (
          <option key={session.id} value={session.id}>
            {session.name}
          </option>
        ))}
      </select>
    </label>

    <label>
      From date
      <input
        type="date"
        value={dateFrom}
        max={dateTo || undefined}
        onChange={(event) => setDateFrom(event.target.value)}
      />
    </label>

    <label>
      To date
      <input
        type="date"
        value={dateTo}
        min={dateFrom || undefined}
        onChange={(event) => setDateTo(event.target.value)}
      />
    </label>

    <button
      className="secondary-button"
      onClick={() => {
        setSelectedSessionId("all");
        setDateFrom("");
        setDateTo("");
      }}
    >
      Reset Filters
    </button>
  </div>

  <p className="helper-text">
    New numbered and color-only results are assigned to the active session.
    Existing unassigned records remain available under Legacy / Unassigned.
  </p>
</section>

      <section className="panel entry-panel">
        
        <div className="section-heading">
          <div>
            <p className="eyebrow">01 / INPUT</p>
            <h3>Record a roulette result</h3>
          </div>
          <span className="small-label">SELECT 0–36</span>
        </div>

        <div className="number-grid">
          <button
        
            className="number-button green"
            onClick={() => addResult(0)}
          >
            0
          </button>

          {Array.from({ length: 36 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className={`number-button ${getColor(n)}`}
              onClick={() => addResult(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="color-entry">
  <p className="helper-text">Or record a color without a number</p>

  <div className="color-entry-buttons">
    <button
      className="color-choice red"
      onClick={() => addColorResult("red")}
    >
      Red only
    </button>

    <button
      className="color-choice black"
      onClick={() => addColorResult("black")}
    >
      Black only
    </button>

    <button
      className="color-choice green"
      onClick={() => addColorResult("green")}
    >
      Green only
    </button>
  </div>
</div>

        {selected !== null && (
          <p className="selection-message">
            Latest recorded result: <b>{selected}</b> ({getColor(selected)})
          </p>
        )}
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">02 / HISTORY</p>
              <h3>Recent results</h3>
            </div>
            <span className="small-label">{history.length} RESULTS</span>
          </div>

          {filteredHistory.length === 0? (
            <div className="empty-state">
              <div className="empty-icon">↻</div>
              <p>No results recorded yet</p>
              <span>Select a number above to begin.</span>
            </div>
          ) : (
            <div className="history-list">
             {filteredHistory.slice(0, 30).map((item, i) => {
  const number = getNumber(item);
  const color = getResultColor(item);
  
<div className="history-list">
              {filteredHistory.slice(0, 30).map((item, i) => {
                const number = getNumber(item);
                const color = getResultColor(item);

                return (
                  <div
                    className="history-item"
                    key={`${item.timestamp}-${i}`}
                  >
                    <span className={`result-ball ${color}`}>
                      {number === null ? color.toUpperCase() : number}
                    </span>

                    <span>Spin {filteredHistory.length - i}</span>
                    <span className="history-color">{color}</span>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => startCorrection(item, i)}
                    >
                      Correct
                    </button>

                    {editingResultKey === `${item.timestamp}-${i}` && (
                      <div className="correction-form">
                        <h4>Correct this result</h4>

                        <label>
                          {item.colorOnly ? "Correct color" : "Correct number"}
                          {item.colorOnly ? (
                            <select
                              value={correctionValue}
                              onChange={(event) =>
                                setCorrectionValue(event.target.value)
                              }
                            >
                              <option value="red">Red</option>
                              <option value="black">Black</option>
                              <option value="green">Green</option>
                            </select>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              max="36"
                              value={correctionValue}
                              onChange={(event) =>
                                setCorrectionValue(event.target.value)
                              }
                            />
                          )}
                        </label>

                        <label>
                          Reason for correction
                          <textarea
                            value={correctionReason}
                            onChange={(event) =>
                              setCorrectionReason(event.target.value)
                            }
                            placeholder="e.g. Incorrect result entered"
                          />
                        </label>

                        <div className="button-row">
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => saveCorrection(item, i)}
                          >
                            Save Correction
                          </button>

                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => setEditingResultKey(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>


  return (
    <div
      className="history-item"
      key={`${item.timestamp}-${i}`}
    >
      <span className={`result-ball ${color}`}>
        {number === null ? color.toUpperCase() : number}
      </span>

      <span>Spin {history.length - i}</span>
      
      <span className="history-color">{color}</span>

      <button
        type="button"
        className="secondary-button"
        onClick={() => startCorrection(item, i)}
      >
        Correct
      </button>

      {editingResultKey === `${item.timestamp}-${i}` && (
        <div className="correction-form">
          <h4>Correct this result</h4>

          <label>
            {item.colorOnly ? "Correct color" : "Correct number"}
            {item.colorOnly ? (
              <select
                value={correctionValue}
                onChange={(event) =>
                  setCorrectionValue(event.target.value)
                }
              >
                <option value="red">Red</option>
                <option value="black">Black</option>
                <option value="green">Green</option>
              </select>
            ) : (
              <input
                type="number"
                min="0"
                max="36"
                value={correctionValue}
                onChange={(event) =>
                  setCorrectionValue(event.target.value)
                }
              />
            )}
          </label>

          <label>
            Reason for correction
            <textarea
              value={correctionReason}
              onChange={(event) =>
                setCorrectionReason(event.target.value)
              }
              placeholder="e.g. Incorrect result entered"
            />
          </label>

          
<div className="button-row">
  <button
    type="button"
    className="secondary-button"
    onClick={() => saveCorrection(item, i)}
  >
    Save Correction
  </button>

  <button
    type="button"
    className="secondary-button"
    onClick={() => setEditingResultKey(null)}
  >
    Cancel
  </button>
</div>

        </div>
      )}
    </div>


  );
})}
            </div>

            
          )}

          <div className="button-row">
            <button
              className="secondary-button"
              onClick={removeLatest}
              disabled={!history.length}
            >
              Undo latest
            </button>

            <button
              className="secondary-button"
              onClick={exportHistory}
              disabled={!history.length}
            >
              Export CSV
            </button>

            <button
              className="danger-button"
              onClick={clearHistory}
              disabled={!history.length}
            >
              Clear history
            </button>
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">03 / DISTRIBUTION</p>
              <h3>Number frequency</h3>
            </div>
          </div>

          <p className="helper-text">
            Counts from your recorded results, not predictions of the next spin.
          </p>

          <div className="frequency-list">
            {counts
              .filter((item) => item.count > 0)
              .sort((a, b) => b.count - a.count || a.number - b.number)
              .slice(0, 10)
              .map((item) => (
                <div className="frequency-row" key={item.number}>
                  <span className={`mini-ball ${getColor(item.number)}`}>
                    {item.number}
                  </span>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${getColor(item.number)}`}
                      style={{
                        width: `${
                          highest ? (item.count / highest) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                  <strong>{item.count}</strong>
                </div>
              ))}

            {!history.length && (
              <p className="muted">Frequency data will appear here.</p>
            )}
          </div>

          {history.length > 0 && (
            <div className="leaderboard">
              <h4>Most frequent in this sample</h4>
              {mostFrequent.map((item) => (
                <span key={item.number} className="leader-chip">
                  {item.number} · {item.count} times
                </span>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="panel breakdown-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">04 / OUTCOMES</p>
            <h3>Result breakdown</h3>
          </div>
        </div>

        <div className="breakdown-grid">
          {[
            { label: "Red", count: redCount, color: "red" },
            { label: "Black", count: blackCount, color: "black" },
            { label: "Odd (excluding zero)", count: oddCount, color: "gold" },
            { label: "Even (excluding zero)", count: evenCount, color: "gold" },
            { label: "Low (1–18)", count: lowCount, color: "gold" },
            { label: "High (19–36)", count: highCount, color: "gold" },
          ].map((item) => (
            <div className="breakdown-item" key={item.label}>
              <span>{item.label}</span>
              <strong>{percentage(item.count)}%</strong>
              <div className="bar-track">
                <div
                  className={`bar-fill ${item.color}`}
                  style={{ width: `${percentage(item.count)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="footnote">
          Percentages use all recorded spins as the denominator. Zero is neither
          red nor black, odd nor even, and is excluded from Low and High.
          A fair European roulette spin has a 1/37 chance of each individual
          number, regardless of previous results.
        </p>
      </section>
      
<section className="panel session-report-panel">
  <div className="section-heading">
    <div>
      <p className="eyebrow">06 / MANAGEMENT</p>
      <h3>Session Management Report</h3>
    </div>
   
<button
  type="button"
  className="secondary-button"
  onClick={exportSessionReport}
  disabled={reportTotal === 0}
>
  Export Session Report
</button>

    <span className="small-label">
      {reportSession ? reportSession.name : "FILTERED RESULTS"}
    </span>
  </div>

  <p className="helper-text">
    {reportSession
      ? `Session started: ${reportStartedAt}`
      : selectedSessionId === "legacy"
        ? "Report for unassigned legacy results."
        : "Report for the currently selected sessions and date range."}
  </p>

  

  <div className="stats-grid">
    <article className="stat-card">
      <p>Total recorded outcomes</p>
      <strong>{reportTotal}</strong>
    </article>

    <article className="stat-card">
      <p>Numbered results</p>
      <strong>{reportNumbered.length}</strong>
    </article>

    <article className="stat-card">
      <p>Red outcomes</p>
      <strong className="red-text">{reportRed}</strong>
      <span>{reportPercentage(reportRed)}%</span>
    </article>

    <article className="stat-card">
      <p>Black outcomes</p>
      <strong>{reportBlack}</strong>
      <span>{reportPercentage(reportBlack)}%</span>
    </article>

    <article className="stat-card">
      <p>Green outcomes</p>
      <strong className="green-text">{reportGreen}</strong>
      <span>{reportPercentage(reportGreen)}%</span>
    </article>
  </div>

  <section className="session-comparison-panel">
    <div className="section-heading">
      <div>
        <h3>Session Performance Comparison</h3>
        <p className="helper-text">
          Compare recorded outcomes across saved sessions.
        </p>
      </div>
      <span className="small-label">
        {sessionComparison.length} SESSIONS
      </span>
    </div>

    {sessionComparison.length === 0 ? (
      <p className="helper-text">
        No saved sessions yet. Start a session and record results to see a comparison.
      </p>
    ) : (
      <>
        {busiestSession && busiestSession.total > 0 && (
          <p className="helper-text">
            Most recorded outcomes: <strong>{busiestSession.name}</strong>
            {" "}({busiestSession.total} outcomes)
          </p>
        )}

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Session</th>
                <th>Total</th>
                <th>Numbered</th>
                <th>Red</th>
                <th>Black</th>
                <th>Green</th>
              </tr>
            </thead>
            <tbody>
              {sessionComparison.map((session) => (
                <tr key={session.id}>
                  <td>{session.name}</td>
                  <td>{session.total}</td>
                  <td>{session.numbered}</td>
                  <td>{session.red}</td>
                  <td>{session.black}</td>
                  <td>{session.green}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )}
  </section>

  {reportTotal === 0 && (
    <p className="helper-text">
      No recorded outcomes match these filters yet.
    </p>
  )}
</section>

   <AnalyticsCharts
  history={filteredHistory}
  sessions={sessions}
/>

<DataQualityMonitor
  history={history}
  sessions={sessions}
/>

<StatisticalIntegrity
  history={history}
/>



<SessionInsights
  history={history}
  sessions={sessions}
  auditLog={auditLog}
/>


      
<section className="panel audit-panel">
  <div className="section-heading">
    <div>
      <p className="eyebrow">05 / RECORD KEEPING</p>
      <h3>Correction History</h3>
    </div>
    
<div className="audit-actions">
  <span className="small-label">
    {auditLog.length} CORRECTIONS
  </span>

  <button
    type="button"
    className="secondary-button"
    onClick={exportAuditLog}
    disabled={auditLog.length === 0}
  >
    Export Audit Log
  </button>
</div>

  </div>

  {auditLog.length === 0 ? (
    <p className="helper-text">
      No corrections have been recorded yet.
    </p>
  ) : (
    <div className="audit-list">
      {auditLog.map((entry) => (
        <article className="audit-item" key={entry.id}>
          <div className="audit-heading">
            <strong>
              {entry.originalNumber === null
                ? entry.originalColor.toUpperCase()
                : `${entry.originalNumber} (${entry.originalColor})`}
              {" → "}
              {entry.correctedNumber === null
                ? entry.correctedColor.toUpperCase()
                : `${entry.correctedNumber} (${entry.correctedColor})`}
            </strong>
          </div>

          <p>
            <strong>Reason:</strong> {entry.reason}
          </p>

          <p>
            <strong>Corrected at:</strong>{" "}
            {new Date(entry.correctedAt).toLocaleString()}
          </p>

          <p>
            <strong>Session:</strong>{" "}
            {entry.sessionId || "Unassigned"}
          </p>
        </article>
      ))}
    </div>
  )}
</section>


      <footer>
        ROULETTEIQ · STATISTICAL ANALYSIS ONLY · NO BETTING OR GUARANTEED PREDICTIONS
      </footer>

      {isSessionModalOpen && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.75)",
      display: "grid",
      placeItems: "center",
      zIndex: 1000,
    }}
  >
    <form
      onSubmit={handleCreateSession}
      className="panel"
      style={{ width: "90%", maxWidth: "400px", padding: "24px" }}
    >
      <h3 style={{ margin: "0 0 12px 0" }}>Create New Session</h3>
      <p className="helper-text" style={{ marginBottom: "16px" }}>
        Assign incoming spins to an operational table shift.
      </p>
      <input
        type="text"
        autoFocus
        placeholder="e.g. Table 4 - Evening Shift"
        value={newSessionName}
        onChange={(e) => setNewSessionName(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "16px",
          background: "#151b19",
          border: "1px solid #303936",
          color: "white",
          borderRadius: "8px",
        }}
      />
      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setIsSessionModalOpen(false)}
        >
          Cancel
        </button>
        <button type="submit" className="secondary-button" style={{ borderColor: "#d5b66a", color: "#d5b66a" }}>
          Create Session
        </button>
      </div>
    </form>
  </div>
)}
    </main>
  );
}

export default App;
