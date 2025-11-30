const { useState, useMemo } = React;

const screens = [
  "home",
  "taxes",
  "spending",
  "systems",
  "prelaunch",
  "results1",
  "results2",
  "results3",
];

const taxInputs = [
  { key: "income_basic", label: "Income Tax - Basic Rate", min: 0, max: 60, defaultValue: 20, unit: "%" },
  { key: "income_higher", label: "Income Tax - Higher Rate", min: 0, max: 80, defaultValue: 40, unit: "%" },
  { key: "income_additional", label: "Income Tax - Additional Rate", min: 0, max: 95, defaultValue: 45, unit: "%" },
  { key: "personal_allowance", label: "Personal Allowance", min: 0, max: 20000, defaultValue: 12570, unit: "£" },
  { key: "capital_gains", label: "Capital Gains Tax", min: 0, max: 50, defaultValue: 20, unit: "%" },
  { key: "corporation_tax", label: "Corporation Tax", min: 0, max: 60, defaultValue: 25, unit: "%" },
  { key: "vat_standard", label: "VAT Standard Rate", min: 0, max: 35, defaultValue: 20, unit: "%" },
  { key: "vat_reduced", label: "VAT Reduced Rate", min: 0, max: 20, defaultValue: 5, unit: "%" },
  { key: "ni_employee", label: "National Insurance (Employee)", min: 0, max: 25, defaultValue: 12, unit: "%" },
  { key: "ni_employer", label: "National Insurance (Employer)", min: 0, max: 35, defaultValue: 13.8, unit: "%" },
  { key: "green_levy", label: "Green Levy", min: 0, max: 20, defaultValue: 4, unit: "%" },
  { key: "windfall_tax", label: "Windfall Tax", min: 0, max: 60, defaultValue: 35, unit: "%" },
  { key: "luxury_duty", label: "Luxury Goods Duty", min: 0, max: 30, defaultValue: 10, unit: "%" },
  { key: "carbon_price", label: "Carbon Price", min: 0, max: 200, defaultValue: 75, unit: "£/tCO₂" },
];

const spendingInputs = [
  { key: "nhs_budget", label: "NHS Core Budget", min: 50, max: 300, defaultValue: 180, unit: "£bn" },
  { key: "social_care", label: "Social Care", min: 10, max: 120, defaultValue: 48, unit: "£bn" },
  { key: "education", label: "Education", min: 20, max: 180, defaultValue: 110, unit: "£bn" },
  { key: "housing", label: "Housing & Planning", min: 5, max: 80, defaultValue: 35, unit: "£bn" },
  { key: "transport", label: "Transport & Rail", min: 10, max: 140, defaultValue: 70, unit: "£bn" },
  { key: "defence", label: "Defence & Security", min: 20, max: 120, defaultValue: 60, unit: "£bn" },
  { key: "policing", label: "Policing & Justice", min: 10, max: 70, defaultValue: 38, unit: "£bn" },
  { key: "science", label: "Science & Innovation", min: 5, max: 60, defaultValue: 28, unit: "£bn" },
  { key: "climate", label: "Climate & Net Zero", min: 5, max: 90, defaultValue: 40, unit: "£bn" },
  { key: "infrastructure", label: "Infrastructure Upgrade", min: 10, max: 200, defaultValue: 85, unit: "£bn" },
  { key: "welfare", label: "Welfare & Benefits", min: 50, max: 300, defaultValue: 180, unit: "£bn" },
  { key: "local_government", label: "Local Government", min: 10, max: 100, defaultValue: 48, unit: "£bn" },
  { key: "digital", label: "Digital Public Services", min: 2, max: 40, defaultValue: 20, unit: "£bn" },
  { key: "resilience", label: "Resilience & Emergencies", min: 2, max: 30, defaultValue: 12, unit: "£bn" },
];

const systemInputs = [
  { key: "ai_adoption", label: "AI Public Service Adoption", min: 0, max: 100, defaultValue: 55, unit: "%" },
  { key: "automation", label: "Automation Coverage", min: 0, max: 100, defaultValue: 45, unit: "%" },
  { key: "cyber_resilience", label: "Cyber Resilience", min: 0, max: 100, defaultValue: 68, unit: "%" },
  { key: "supply_chain", label: "Supply Chain Security", min: 0, max: 100, defaultValue: 60, unit: "%" },
  { key: "grid_reliability", label: "Grid Reliability", min: 0, max: 100, defaultValue: 72, unit: "%" },
  { key: "water_security", label: "Water Security", min: 0, max: 100, defaultValue: 66, unit: "%" },
  { key: "housing_delivery", label: "Housing Delivery Readiness", min: 0, max: 100, defaultValue: 58, unit: "%" },
  { key: "rail_punctuality", label: "Rail Punctuality", min: 0, max: 100, defaultValue: 62, unit: "%" },
  { key: "port_capacity", label: "Port Capacity", min: 0, max: 100, defaultValue: 54, unit: "%" },
  { key: "digital_id", label: "Digital Identity Coverage", min: 0, max: 100, defaultValue: 70, unit: "%" },
  { key: "green_procurement", label: "Green Procurement Share", min: 0, max: 100, defaultValue: 40, unit: "%" },
  { key: "r_and_d_tax", label: "R&D Tax Credits", min: 0, max: 100, defaultValue: 20, unit: "%" },
  { key: "training_access", label: "Workforce Training Access", min: 0, max: 100, defaultValue: 64, unit: "%" },
  { key: "care_automation", label: "Care Automation Readiness", min: 0, max: 100, defaultValue: 36, unit: "%" },
];

function InputField({ config, value, onChange }) {
  return (
    <div className="field">
      <label>
        <span className="dot" />
        <strong>{config.label}</strong>
      </label>
      <div className="value-row">
        <small>{config.min}{config.unit}</small>
        <div className="value-chip">{value}{config.unit}</div>
        <small>{config.max}{config.unit}</small>
      </div>
      <input
        type="range"
        min={config.min}
        max={config.max}
        step={config.unit.includes("%") ? 1 : 0.1}
        value={value}
        onChange={(e) => onChange(config.key, Number(e.target.value))}
      />
      <input
        type="number"
        value={value}
        min={config.min}
        max={config.max}
        step={config.unit.includes("%") ? 1 : 0.1}
        onChange={(e) => onChange(config.key, Number(e.target.value))}
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 10,
          padding: "10px 12px",
          color: "var(--text)",
          width: "100%",
        }}
      />
    </div>
  );
}

function Metric({ label, value, fill }) {
  return (
    <div className="metric">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      <div className="mini-chart">
        <span style={{ "--fill": `${fill}%` }} />
      </div>
    </div>
  );
}

function SectionGrid({ title, subtitle, inputs, state, onChange }) {
  return (
    <div className="card">
      <div className="section-title">
        <h3>{title}</h3>
        <small>{subtitle}</small>
      </div>
      <div className="grid cols-3">
        {inputs.map((item) => (
          <InputField key={item.key} config={item} value={state[item.key]} onChange={onChange} />
        ))}
      </div>
    </div>
  );
}

function ProgressSteps({ active }) {
  const steps = ["Home", "Taxes", "Spending", "Systems", "Pre-Launch", "Results"];
  return (
    <div className="tab-steps">
      {steps.map((step, index) => (
        <div
          key={step}
          className={`step ${index === 5 && active.includes("results") ? "active" : ""} ${screens[index] === active ? "active" : ""}`}
        >
          {step}
        </div>
      ))}
    </div>
  );
}

function computeResults(inputs, meta) {
  const totalTaxPressure =
    inputs.income_basic + inputs.income_higher + inputs.income_additional + inputs.capital_gains + inputs.corporation_tax +
    inputs.vat_standard + inputs.vat_reduced + inputs.ni_employee + inputs.ni_employer + inputs.green_levy + inputs.windfall_tax +
    inputs.luxury_duty;

  const spendTotal = Object.keys(inputs)
    .filter((key) => spendingInputs.find((i) => i.key === key))
    .reduce((sum, key) => sum + inputs[key], 0);

  const systemPulse =
    inputs.ai_adoption + inputs.automation + inputs.cyber_resilience + inputs.supply_chain + inputs.grid_reliability +
    inputs.water_security + inputs.housing_delivery + inputs.rail_punctuality + inputs.port_capacity + inputs.digital_id +
    inputs.green_procurement + inputs.r_and_d_tax + inputs.training_access + inputs.care_automation;

  const fiscalHealth = Math.max(0, 100 - (spendTotal / 1200) * 100 + totalTaxPressure / 30);
  const growthImpulse = (systemPulse / 14 + inputs.r_and_d_tax + inputs.green_procurement) / 10 + 1.5;
  const gdpTrajectory = [2.1, 2.4, 2.7, 2.9, 3.0].map((v, idx) => (v + growthImpulse * 0.1 - idx * 0.05).toFixed(2));
  const unemployment = [4.8, 4.6, 4.4, 4.2, 4.1].map((v, idx) => (v - systemPulse * 0.003 + idx * 0.02).toFixed(2));

  const metrics = {
    deficitShift: (fiscalHealth - 50).toFixed(1) + "%",
    taxYield: (totalTaxPressure * 0.35).toFixed(1) + "% GDP",
    socialImpact: ((spendTotal / 1200) * 100 + systemPulse / 30).toFixed(1) + "%",
    climateImpact: ((inputs.climate * 1.2 + inputs.green_procurement + inputs.green_levy * 2) / 3).toFixed(1) + " pts",
    macroResilience: (systemPulse / 14 + 40).toFixed(1) + " pts",
    debtPath: (85 - fiscalHealth * 0.25).toFixed(1) + "% GDP",
    gdpTrajectory,
    unemployment,
  };

  const detailedMetrics = [
    { label: "Deficit Delta", value: metrics.deficitShift, fill: fiscalHealth },
    { label: "Debt Ratio", value: metrics.debtPath, fill: Math.min(100, 100 - fiscalHealth) },
    { label: "Tax Yield", value: metrics.taxYield, fill: Math.min(100, totalTaxPressure / 3) },
    { label: "Public Service Pressure", value: `${(spendTotal / 14).toFixed(1)}£bn/segment`, fill: Math.min(100, spendTotal / 4) },
    { label: "Social Impact", value: metrics.socialImpact, fill: Math.min(100, systemPulse / 1.6) },
    { label: "Climate Impact", value: metrics.climateImpact, fill: Math.min(100, inputs.climate * 1.4) },
    { label: "Macro Resilience", value: metrics.macroResilience, fill: Math.min(100, systemPulse / 1.2) },
    { label: "Infra Stress", value: `${(inputs.infrastructure / 2).toFixed(1)} load`, fill: Math.min(100, inputs.infrastructure) },
    { label: "Health Capacity", value: `${(inputs.nhs_budget * 1.1).toFixed(1)} readiness`, fill: Math.min(100, inputs.nhs_budget / 3) },
    { label: "Education Lift", value: `${(inputs.education / 1.5).toFixed(1)} uplift`, fill: Math.min(100, inputs.education / 1.8) },
    { label: "Housing Delivery", value: `${inputs.housing_delivery}%`, fill: inputs.housing_delivery },
    { label: "Care Automation", value: `${inputs.care_automation}%`, fill: inputs.care_automation },
    { label: "Training Access", value: `${inputs.training_access}%`, fill: inputs.training_access },
    { label: "Digital Identity", value: `${inputs.digital_id}%`, fill: inputs.digital_id },
    { label: "AI Adoption", value: `${inputs.ai_adoption}%`, fill: inputs.ai_adoption },
    { label: "Automation Coverage", value: `${inputs.automation}%`, fill: inputs.automation },
    { label: "Cyber Resilience", value: `${inputs.cyber_resilience}%`, fill: inputs.cyber_resilience },
    { label: "Supply Chain Security", value: `${inputs.supply_chain}%`, fill: inputs.supply_chain },
    { label: "Grid Reliability", value: `${inputs.grid_reliability}%`, fill: inputs.grid_reliability },
    { label: "Water Security", value: `${inputs.water_security}%`, fill: inputs.water_security },
    { label: "Rail Punctuality", value: `${inputs.rail_punctuality}%`, fill: inputs.rail_punctuality },
    { label: "Port Capacity", value: `${inputs.port_capacity}%`, fill: inputs.port_capacity },
    { label: "Green Procurement", value: `${inputs.green_procurement}%`, fill: inputs.green_procurement },
    { label: "R&D Tax Credits", value: `${inputs.r_and_d_tax}%`, fill: inputs.r_and_d_tax },
    { label: "Resilience Reserve", value: `${inputs.resilience} £bn`, fill: Math.min(100, inputs.resilience * 3) },
    { label: "Digital Services", value: `${inputs.digital} £bn`, fill: Math.min(100, inputs.digital * 3) },
    { label: "Climate Spend", value: `${inputs.climate} £bn`, fill: Math.min(100, inputs.climate * 2) },
    { label: "Defence Posture", value: `${inputs.defence} £bn`, fill: Math.min(100, inputs.defence * 2) },
    { label: "Transport Grid", value: `${inputs.transport} £bn`, fill: Math.min(100, inputs.transport * 2) },
    { label: "Housing & Planning", value: `${inputs.housing} £bn`, fill: Math.min(100, inputs.housing * 2.5) },
    { label: "Education Spend", value: `${inputs.education} £bn`, fill: Math.min(100, inputs.education * 2) },
    { label: "NHS Spend", value: `${inputs.nhs_budget} £bn`, fill: Math.min(100, inputs.nhs_budget * 1.6) },
    { label: "Welfare Spend", value: `${inputs.welfare} £bn`, fill: Math.min(100, inputs.welfare * 0.7) },
    { label: "Local Government", value: `${inputs.local_government} £bn`, fill: Math.min(100, inputs.local_government * 1.2) },
    { label: "Science & Innovation", value: `${inputs.science} £bn`, fill: Math.min(100, inputs.science * 2.5) },
    { label: "Public Safety", value: `${inputs.policing} £bn`, fill: Math.min(100, inputs.policing * 3) },
    { label: "Infrastructure Push", value: `${inputs.infrastructure} £bn`, fill: Math.min(100, inputs.infrastructure * 1.6) },
    { label: "Social Care", value: `${inputs.social_care} £bn`, fill: Math.min(100, inputs.social_care * 2.3) },
  ];

  const trajectories = [
    { label: "GDP Trajectory (y/y)", values: metrics.gdpTrajectory },
    { label: "Unemployment (%)", values: metrics.unemployment },
    { label: "Deficit vs GDP", values: ["-5.1", "-4.4", "-3.8", "-3.4", "-3.1"] },
    { label: "Annual Spend Allocation", values: ["NHS", "Education", "Climate", "Infra", "Welfare"] },
    { label: "Emission Brief (MtCO₂e)", values: [
      (220 - inputs.climate * 0.6).toFixed(1),
      (215 - inputs.green_procurement * 0.5).toFixed(1),
      (210 - inputs.green_levy * 0.8).toFixed(1),
      (200 - inputs.carbon_price * 0.2).toFixed(1),
      (190 - inputs.climate * 0.9).toFixed(1),
    ] },
  ];

  const socialMetrics = [
    { label: "Hospital Beds", value: `${(inputs.nhs_budget * 220).toFixed(0)} new`, fill: Math.min(100, inputs.nhs_budget * 1.4) },
    { label: "Clinician Hiring", value: `${(inputs.nhs_budget * 1.6).toFixed(0)}k`, fill: Math.min(100, inputs.nhs_budget) },
    { label: "Housing Starts", value: `${(inputs.housing * 2.4).toFixed(0)}k`, fill: Math.min(100, inputs.housing * 3) },
    { label: "Homes Retrofits", value: `${(inputs.climate * 45).toFixed(0)}k`, fill: Math.min(100, inputs.climate * 1.1) },
    { label: "Training Grants", value: `${(inputs.training_access * 1.4).toFixed(0)}k`, fill: inputs.training_access },
    { label: "Apprenticeships", value: `${(inputs.training_access * 1.2).toFixed(0)}k`, fill: inputs.training_access },
    { label: "Business Resilience", value: `${metrics.macroResilience} score`, fill: Math.min(100, systemPulse / 1.5) },
    { label: "SME Relief", value: `${(inputs.r_and_d_tax * 0.8).toFixed(1)} pts`, fill: Math.min(100, inputs.r_and_d_tax) },
    { label: "Housing Affordability", value: `${(80 - inputs.housing / 2).toFixed(1)} index`, fill: Math.min(100, 80 - inputs.housing / 2) },
    { label: "Health Outcomes", value: `${(60 + inputs.nhs_budget / 6).toFixed(1)} pts`, fill: Math.min(100, 60 + inputs.nhs_budget / 6) },
    { label: "Education Quality", value: `${(65 + inputs.education / 5).toFixed(1)} pts`, fill: Math.min(100, 65 + inputs.education / 5) },
    { label: "Digital Inclusion", value: `${(inputs.digital_id + inputs.digital).toFixed(1)} pts`, fill: Math.min(100, inputs.digital_id + inputs.digital) },
  ];

  return { metrics, detailedMetrics, trajectories, socialMetrics, meta };
}

function Home({ meta, setMeta, onStart }) {
  return (
    <div className="layout-shell">
      <div className="header">
        <div className="badge">Command Alpha · UK Budget Simulator</div>
        <div className="progress-scan">
          <div>Idle</div>
          <div className="bar"><span style={{ "--progress": "6%" }} /></div>
        </div>
      </div>
      <div className="hero card alt">
        <h1>Budget Launch Console</h1>
        <p>
          Calibrate your fiscal payload, configure national systems, and fire the simulation. This build takes direct
          control of tax bands, spending channels, and readiness protocols across three chambers before ignition.
        </p>
        <div className="grid cols-2" style={{ marginTop: 24 }}>
          <div className="field">
            <label><span className="dot" /> Fiscal Year</label>
            <select
              value={meta.year}
              onChange={(e) => setMeta({ ...meta, year: e.target.value })}
              style={{
                padding: "12px",
                borderRadius: 10,
                border: "1px solid rgba(24,212,255,0.35)",
                background: "rgba(255,255,255,0.03)",
                color: "var(--text)",
              }}
            >
              <option>2024/25</option>
              <option>2025/26</option>
              <option>2026/27</option>
              <option>2027/28</option>
            </select>
          </div>
          <div className="field">
            <label><span className="dot" /> Commanding Party</label>
            <select
              value={meta.party}
              onChange={(e) => setMeta({ ...meta, party: e.target.value })}
              style={{
                padding: "12px",
                borderRadius: 10,
                border: "1px solid rgba(24,212,255,0.35)",
                background: "rgba(255,255,255,0.03)",
                color: "var(--text)",
              }}
            >
              <option>Unity Government</option>
              <option>Progressive Coalition</option>
              <option>Reform Front</option>
              <option>Green Accord</option>
            </select>
          </div>
        </div>
        <div className="control-bar" style={{ marginTop: 28 }}>
          <div className="stepper">Initiate → Taxes → Spending → Systems → Launch</div>
          <button className="btn" onClick={onStart}>Enter Control Room</button>
        </div>
      </div>
    </div>
  );
}

function ScreenChrome({ children, active }) {
  return (
    <div className="layout-shell">
      <div className="header">
        <div className="badge">Budget Command · Sequencer</div>
        <div className="progress-scan">
          <div>{active.includes("results") ? "Telemetry" : "Config"}</div>
          <div className="bar"><span style={{ "--progress": `${Math.min(100, screens.indexOf(active) * 18 + 10)}%` }} /></div>
        </div>
      </div>
      <ProgressSteps active={active} />
      {children}
    </div>
  );
}

function ConfigScreens({ screen, taxState, spendState, systemState, onChange, onPrev, onNext }) {
  const mergeChange = (key, value) => onChange(key, value);
  const activeInputs = { ...taxState, ...spendState, ...systemState };

  return (
    <ScreenChrome active={screen}>
      {screen === "taxes" && (
        <div className="panel-split">
          <SectionGrid title="Income & Corporate" subtitle="Edit every band directly" inputs={taxInputs.slice(0, 7)} state={taxState} onChange={mergeChange} />
          <SectionGrid title="Indirect & Environmental" subtitle="VAT, NI, levies, duties" inputs={taxInputs.slice(7)} state={taxState} onChange={mergeChange} />
        </div>
      )}
      {screen === "spending" && (
        <SectionGrid title="Spending Payload" subtitle="Direct allocations, no deltas" inputs={spendingInputs} state={spendState} onChange={mergeChange} />
      )}
      {screen === "systems" && (
        <SectionGrid title="Systems & Protocols" subtitle="Operational readiness" inputs={systemInputs} state={systemState} onChange={mergeChange} />
      )}
      <div className="control-bar">
        <button className="btn secondary" onClick={onPrev} disabled={screen === "taxes"}>Back</button>
        <button className="btn" onClick={onNext}>{screen === "systems" ? "Ready to Fire" : "Next Chamber"}</button>
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <div className="topline">
          <div className="dot" /><div>Live Diagnostics</div>
        </div>
        <div className="metric-grid">
          {Object.entries(activeInputs).slice(0, 12).map(([key, value]) => (
            <Metric key={key} label={key.replace(/_/g, " ")} value={value} fill={Math.min(100, value)} />
          ))}
        </div>
      </div>
    </ScreenChrome>
  );
}

function PreLaunch({ onPrev, onLaunch, inputs, meta }) {
  const payloadSummary = [
    { label: "Tax Channels", value: Object.keys(inputs).length },
    { label: "Spending Payload", value: `${Object.keys(inputs).filter((k) => spendingInputs.find((i) => i.key === k)).length} lines` },
    { label: "Protocol Readiness", value: `${Object.keys(inputs).filter((k) => systemInputs.find((i) => i.key === k)).length} systems` },
  ];
  return (
    <ScreenChrome active="prelaunch">
      <div className="card">
        <div className="section-title">
          <h3>Pre-Launch Checklist</h3>
          <small>{meta.year} · {meta.party}</small>
        </div>
        <div className="grid cols-3">
          {payloadSummary.map((item) => (
            <div key={item.label} className="field">
              <label><span className="dot" /> {item.label}</label>
              <div className="value-chip">{item.value}</div>
            </div>
          ))}
          <div className="field">
            <label><span className="dot" /> Simulation Mode</label>
            <div className="value-chip">Trajectory + Impact</div>
          </div>
          <div className="field">
            <label><span className="dot" /> Visual Theme</label>
            <div className="value-chip">Futuristic Launcher</div>
          </div>
        </div>
        <div className="control-bar">
          <button className="btn secondary" onClick={onPrev}>Back</button>
          <button className="btn danger" onClick={onLaunch}>Run Simulation</button>
        </div>
      </div>
    </ScreenChrome>
  );
}

function ResultsDeck({ result, onReset }) {
  return (
    <ScreenChrome active="results">
      <div className="card">
        <div className="section-title">
          <h3>Deficit, Tax, Society, Climate, Macro</h3>
          <small>Primary Telemetry</small>
        </div>
        <div className="metric-grid">
          {result.detailedMetrics.slice(0, 12).map((m) => (
            <Metric key={m.label} label={m.label} value={m.value} fill={m.fill} />
          ))}
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="section-title">
          <h3>Trajectory Stack</h3>
          <small>GDP, Unemployment, Deficit, Emissions</small>
        </div>
        <div className="grid cols-2">
          {result.trajectories.map((row) => (
            <div key={row.label} className="field">
              <label><span className="dot" /> {row.label}</label>
              <div className="value-chip">{row.values.join(" › ")}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="section-title">
          <h3>Health · Housing · Business Risk · Operations</h3>
          <small>Expanded Telemetry</small>
        </div>
        <div className="metric-grid">
          {result.detailedMetrics.slice(12, 36).map((m) => (
            <Metric key={m.label} label={m.label} value={m.value} fill={m.fill} />
          ))}
          {result.socialMetrics.map((m) => (
            <Metric key={m.label} label={m.label} value={m.value} fill={m.fill} />
          ))}
        </div>
      </div>
      <div className="control-bar" style={{ marginTop: 18 }}>
        <button className="btn" onClick={onReset}>Rebuild Scenario</button>
      </div>
    </ScreenChrome>
  );
}

function App() {
  const [screen, setScreen] = useState("home");
  const [meta, setMeta] = useState({ year: "2024/25", party: "Unity Government" });
  const [taxState, setTaxState] = useState(() => Object.fromEntries(taxInputs.map((t) => [t.key, t.defaultValue])));
  const [spendState, setSpendState] = useState(() => Object.fromEntries(spendingInputs.map((t) => [t.key, t.defaultValue])));
  const [systemState, setSystemState] = useState(() => Object.fromEntries(systemInputs.map((t) => [t.key, t.defaultValue])));

  const allInputs = { ...taxState, ...spendState, ...systemState };

  const onChange = (key, value) => {
    if (taxInputs.find((i) => i.key === key)) setTaxState((s) => ({ ...s, [key]: value }));
    if (spendingInputs.find((i) => i.key === key)) setSpendState((s) => ({ ...s, [key]: value }));
    if (systemInputs.find((i) => i.key === key)) setSystemState((s) => ({ ...s, [key]: value }));
  };

  const result = useMemo(() => computeResults(allInputs, meta), [allInputs, meta]);

  const go = (direction) => {
    const idx = screens.indexOf(screen);
    const next = Math.max(0, Math.min(screens.length - 1, idx + direction));
    setScreen(screens[next]);
  };

  if (screen === "home") {
    return <Home meta={meta} setMeta={setMeta} onStart={() => setScreen("taxes")} />;
  }

  if (screen === "prelaunch") {
    return <PreLaunch onPrev={() => go(-1)} onLaunch={() => setScreen("results1")} inputs={allInputs} meta={meta} />;
  }

  if (screen.startsWith("results")) {
    return <ResultsDeck result={result} onReset={() => setScreen("home")} />;
  }

  return (
    <ConfigScreens
      screen={screen}
      taxState={taxState}
      spendState={spendState}
      systemState={systemState}
      onChange={onChange}
      onPrev={() => go(-1)}
      onNext={() => (screen === "systems" ? setScreen("prelaunch") : go(1))}
    />
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);
