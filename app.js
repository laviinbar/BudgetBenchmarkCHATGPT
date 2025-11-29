// app.js
// Binds UI <-> engine, manages state & charts. No economics logic here.

import { BASELINE } from './config.js';
import { runSimulation } from './engine.js';

const $ = id => document.getElementById(id);

let appState = {
  policy: null,
  horizonYears: 5,
  shocksEnabled: true
};

let lastResults = null;
let comparisonResults = null;

let macroChart, fiscalChart, spendChart;

/* ---------- INITIALISATION ---------- */

document.addEventListener('DOMContentLoaded', () => {
  initPolicyState();
  bindInputs();
  initTabs();
  initThemeToggle();
  initCharts();
  loadScenariosFromStorage();
  bindScenarioButtons();
  bindPresetButtons();
  bindExportButtons();
  recompute(); // initial run
});

/* ---------- POLICY STATE & INPUTS ---------- */

function initPolicyState() {
  // default policy close to baseline
  appState.policy = {
    incomeBasic: 20,
    incomeHigher: 40,
    incomeAdditional: 45,
    corpRate: 25,
    vatRate: 20,
    nicChange: 0,
    cgtChange: 0,
    ihtChange: 0,
    fuelDutyChange: 0,
    alcoholDutyChange: 0,
    stampDutyChange: 0,
    councilTaxChange: 0,
    wealthTaxRate: 0,
    spendChanges: {
      health: 0,
      education: 0,
      defence: 0,
      pensions: 0,
      welfare: 0,
      transport: 0,
      housing: 0,
      environment: 0,
      foreignAid: 0,
      infrastructure: 0
    },
    targetDeficitPct: 0.05, // 5% of GDP
    minWageChange: 0,
    immigrationLevel: 0.6,
    businessIncentives: 0.5,
    tradeOpenness: 0.5,
    carbonTaxLevel: 0.3,
    regulationBurden: 0.5,
    shockIntensity: 0.3
  };

  // push to UI
  setInput('income_basic_rate', 20);
  setInput('income_higher_rate', 40);
  setInput('income_additional_rate', 45);
  setInput('corp_rate', 25);
  setInput('vat_rate', 20);
  setInput('nic_change', 0);
  setInput('cgt_change', 0);
  setInput('iht_change', 0);
  setInput('fuel_duty_change', 0);
  setInput('alcohol_duty_change', 0);
  setInput('stamp_duty_change', 0);
  setInput('council_tax_change', 0);
  setInput('wealth_tax_rate', 0);

  setInput('health_spend_change', 0);
  setInput('education_spend_change', 0);
  setInput('defence_spend_change', 0);
  setInput('pensions_spend_change', 0);
  setInput('welfare_spend_change', 0);
  setInput('transport_spend_change', 0);
  setInput('housing_spend_change', 0);
  setInput('environment_spend_change', 0);
  setInput('foreign_aid_spend_change', 0);
  setInput('infrastructure_spend_change', 0);
  setInput('target_deficit', 5);

  setInput('min_wage_change', 0);
  setInput('immigration_level', 60);
  setInput('business_incentives', 50);
  setInput('trade_openness', 50);
  setInput('carbon_tax_level', 30);
  setInput('regulation_burden', 50);
  setInput('shock_intensity', 30);

  $('horizon_years').value = 5;
  $('shocks_enabled').checked = true;
}

function setInput(baseId, value) {
  const range = $(baseId);
  const num = $(`${baseId}_num`);
  if (range) range.value = value;
  if (num) num.value = value;
}

function bindInputs() {
  const pairs = [
    'income_basic_rate',
    'income_higher_rate',
    'income_additional_rate',
    'corp_rate',
    'vat_rate',
    'nic_change',
    'cgt_change',
    'iht_change',
    'fuel_duty_change',
    'alcohol_duty_change',
    'stamp_duty_change',
    'council_tax_change',
    'wealth_tax_rate',
    'health_spend_change',
    'education_spend_change',
    'defence_spend_change',
    'pensions_spend_change',
    'welfare_spend_change',
    'transport_spend_change',
    'housing_spend_change',
    'environment_spend_change',
    'foreign_aid_spend_change',
    'infrastructure_spend_change',
    'target_deficit',
    'min_wage_change',
    'immigration_level',
    'business_incentives',
    'trade_openness',
    'carbon_tax_level',
    'regulation_burden',
    'shock_intensity'
  ];

  pairs.forEach(id => {
    const r = $(id);
    const n = $(`${id}_num`);
    if (!r || !n) return;
    const handler = () => {
      const val = parseFloat(r.value);
      n.value = val;
      updatePolicyFromUI();
      recompute();
    };
    const handlerNum = () => {
      let val = parseFloat(n.value);
      if (isNaN(val)) val = parseFloat(r.min);
      val = Math.max(parseFloat(r.min), Math.min(parseFloat(r.max), val));
      r.value = val;
      updatePolicyFromUI();
      recompute();
    };
    r.addEventListener('input', handler);
    n.addEventListener('input', handlerNum);
  });

  $('horizon_years').addEventListener('change', () => {
    appState.horizonYears = parseInt($('horizon_years').value, 10);
    recompute();
  });

  $('shocks_enabled').addEventListener('change', () => {
    appState.shocksEnabled = $('shocks_enabled').checked;
    recompute();
  });
}

function updatePolicyFromUI() {
  const p = appState.policy;

  p.incomeBasic = parseFloat($('income_basic_rate').value) || p.incomeBasic;
  p.incomeHigher = parseFloat($('income_higher_rate').value) || p.incomeHigher;
  p.incomeAdditional = parseFloat($('income_additional_rate').value) || p.incomeAdditional;

  p.corpRate = parseFloat($('corp_rate').value) || p.corpRate;
  p.vatRate = parseFloat($('vat_rate').value) || p.vatRate;
  p.nicChange = (parseFloat($('nic_change').value) || 0) / 100;
  p.cgtChange = (parseFloat($('cgt_change').value) || 0) / 100;
  p.ihtChange = (parseFloat($('iht_change').value) || 0) / 100;
  p.fuelDutyChange = (parseFloat($('fuel_duty_change').value) || 0) / 100;
  p.alcoholDutyChange = (parseFloat($('alcohol_duty_change').value) || 0) / 100;
  p.stampDutyChange = (parseFloat($('stamp_duty_change').value) || 0) / 100;
  p.councilTaxChange = (parseFloat($('council_tax_change').value) || 0) / 100;
  p.wealthTaxRate = (parseFloat($('wealth_tax_rate').value) || 0) / 100;

  p.spendChanges.health = (parseFloat($('health_spend_change').value) || 0) / 100;
  p.spendChanges.education = (parseFloat($('education_spend_change').value) || 0) / 100;
  p.spendChanges.defence = (parseFloat($('defence_spend_change').value) || 0) / 100;
  p.spendChanges.pensions = (parseFloat($('pensions_spend_change').value) || 0) / 100;
  p.spendChanges.welfare = (parseFloat($('welfare_spend_change').value) || 0) / 100;
  p.spendChanges.transport = (parseFloat($('transport_spend_change').value) || 0) / 100;
  p.spendChanges.housing = (parseFloat($('housing_spend_change').value) || 0) / 100;
  p.spendChanges.environment = (parseFloat($('environment_spend_change').value) || 0) / 100;
  p.spendChanges.foreignAid = (parseFloat($('foreign_aid_spend_change').value) || 0) / 100;
  p.spendChanges.infrastructure = (parseFloat($('infrastructure_spend_change').value) || 0) / 100;

  p.targetDeficitPct = (parseFloat($('target_deficit').value) || 0) / 100;

  p.minWageChange = (parseFloat($('min_wage_change').value) || 0) / 100;
  p.immigrationLevel = (parseFloat($('immigration_level').value) || 0) / 100;
  p.businessIncentives = (parseFloat($('business_incentives').value) || 0) / 100;
  p.tradeOpenness = (parseFloat($('trade_openness').value) || 0) / 100;
  p.carbonTaxLevel = (parseFloat($('carbon_tax_level').value) || 0) / 100;
  p.regulationBurden = (parseFloat($('regulation_burden').value) || 0) / 100;
  p.shockIntensity = (parseFloat($('shock_intensity').value) || 0) / 100;
}

/* ---------- TABS & THEME ---------- */

function initTabs() {
  const tabs = document.querySelectorAll('.wizard-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const step = tab.dataset.step;
      document.querySelectorAll('.wizard-step').forEach(s => s.classList.add('hidden'));
      $(`step_${step}`).classList.remove('hidden');
    });
  });
}

function initThemeToggle() {
  const toggle = $('theme_toggle');
  toggle.addEventListener('change', () => {
    if (toggle.checked) {
      document.body.classList.remove('light-mode');
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
    }
  });
}

/* ---------- CHARTS ---------- */

function initCharts() {
  const macroCtx = $('macro_chart').getContext('2d');
  const fiscalCtx = $('fiscal_chart').getContext('2d');
  const spendCtx = $('spend_chart').getContext('2d');

  macroChart = new Chart(macroCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        { label: 'GDP (£bn)', data: [], yAxisID: 'y1', borderWidth: 2 },
        { label: 'Unemployment (%)', data: [], yAxisID: 'y2', borderDash: [5, 4], borderWidth: 2 },
        { label: 'GDP – comparison', data: [], yAxisID: 'y1', borderDash: [2, 2], borderWidth: 1 },
        { label: 'Unemployment – comparison', data: [], yAxisID: 'y2', borderDash: [2, 2], borderWidth: 1 }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y1: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'GDP (£bn)' },
          ticks: { callback: v => v.toFixed(0) }
        },
        y2: {
          type: 'linear',
          position: 'right',
          title: { display: true, text: 'Unemployment (%)' },
          ticks: { callback: v => v.toFixed(1) + '%' }
        }
      }
    }
  });

  fiscalChart = new Chart(fiscalCtx, {
    type: 'bar',
    data: {
      labels: ['Deficit (% of GDP)', 'Debt (% of GDP)'],
      datasets: [
        { label: 'Your budget', data: [0, 0], borderWidth: 1 },
        { label: 'Baseline', data: [BASELINE.realGDPGrowth * 100, BASELINE.debtToGDP * 100], borderWidth: 1 }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          title: { display: true, text: '% of GDP' },
          ticks: { callback: v => v.toFixed(0) + '%' }
        }
      }
    }
  });

  spendChart = new Chart(spendCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{ label: 'Spending (£bn)', data: [], borderWidth: 1 }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          title: { display: true, text: '£bn per year' }
        }
      }
    }
  });
}

function updateCharts(results) {
  const r = results;

  macroChart.data.labels = r.years;
  macroChart.data.datasets[0].data = r.gdpPath.map(x => x / 1); // already in £bn
  macroChart.data.datasets[1].data = r.unempPath.map(x => x * 100);
  macroChart.data.datasets[2].data = comparisonResults ? comparisonResults.gdpPath : [];
  macroChart.data.datasets[3].data = comparisonResults ? comparisonResults.unempPath.map(x => x * 100) : [];
  macroChart.update();

  fiscalChart.data.datasets[0].data = [
    r.finalDeficitToGDP * 100,
    r.finalDebtToGDP * 100
  ];
  fiscalChart.update();

  const bd = r.spend.breakdown;
  const labels = ['Health', 'Education', 'Defence', 'Pensions', 'Welfare', 'Transport',
    'Housing', 'Environment', 'Foreign aid', 'Infrastructure', 'Debt interest', 'Other'];
  const values = [
    bd.health, bd.education, bd.defence, bd.pensions, bd.welfare, bd.transport,
    bd.housing, bd.environment, bd.foreignAid, bd.infrastructure, bd.debtInterest, bd.other
  ];

  spendChart.data.labels = labels;
  spendChart.data.datasets[0].data = values;
  spendChart.update();
}

/* ---------- SUMMARY & INDICATORS ---------- */

const fmtPct = x => (x * 100).toFixed(1) + '%';
const fmtRate = fmtPct;
const fmtMoneyBn = x => '£' + x.toFixed(0) + 'bn';

function updateSummary(r) {
  $('gdp_growth_outcome').textContent =
    r.years.length > 1
      ? fmtRate((r.gdpPath[r.gdpPath.length - 1] / r.gdpPath[r.gdpPath.length - 2] - 1) || BASELINE.realGDPGrowth)
      : fmtRate(BASELINE.realGDPGrowth);
  $('unemployment_outcome').textContent = fmtRate(r.finalUnemp);
  $('inflation_outcome').textContent = fmtRate(r.finalInflation);

  $('deficit_outcome').textContent = fmtPct(r.finalDeficitToGDP);
  $('debt_outcome').textContent = fmtPct(r.finalDebtToGDP);
  $('gdp_level_outcome').textContent = fmtMoneyBn(r.finalGDP);

  const I = r.indicators;
  $('poverty_outcome').textContent = fmtPct(I.povertyRate);
  $('gini_outcome').textContent = I.gini.toFixed(2);
  $('emissions_outcome').textContent = (I.emissionsChange * 100).toFixed(1) + '%';

  $('business_formation_outcome').textContent = I.businessFormationIndex.toFixed(0);
  $('fdi_outcome').textContent = I.fdiIndex.toFixed(0);
  $('startup_outcome').textContent = I.startupIndex.toFixed(0);
  $('nondom_outcome').textContent = I.nonDomFlow.toFixed(1);

  $('nhs_wait_outcome').textContent = I.nhsWaitIndex.toFixed(0) + ' (100=baseline)';
  $('life_expectancy_outcome').textContent = I.lifeExpectancy.toFixed(1);
  $('school_perf_outcome').textContent = I.schoolPerfIndex.toFixed(0);
  $('apprentice_outcome').textContent = I.apprenticeshipIndex.toFixed(0);

  $('house_price_outcome').textContent = fmtRate(I.housePriceGrowth);
  $('rent_afford_outcome').textContent = (I.rentAffordability * 100).toFixed(1) + '% of income';
  $('housing_supply_outcome').textContent = I.housingSupplyIndex.toFixed(0);
  $('fuel_poverty_outcome').textContent = fmtPct(I.fuelPovertyRate);

  $('homeless_outcome').textContent = I.homelessIdx.toFixed(2);
  $('foodbank_outcome').textContent = I.foodbankIdx.toFixed(2);
  $('unrest_outcome').textContent = (I.unrestRisk * 100).toFixed(0) + '%';
  $('brain_drain_outcome').textContent = (I.brainDrainRisk * 100).toFixed(0) + '%';

  $('renewables_outcome').textContent = fmtPct(I.renewablesShare);
  $('energy_price_outcome').textContent = I.energyPriceIndex.toFixed(0);
  $('air_quality_outcome').textContent = I.airQualityIndex.toFixed(0);

  $('trade_balance_outcome').textContent = fmtPct(I.tradeBalance);
  $('tourism_outcome').textContent = I.tourismIndex.toFixed(0);
  $('shock_short').textContent = r.shock.name;
}

function updateTextSummary(r) {
  const dir = x => x > 0.002 ? 'increase' : x < -0.002 ? 'fall' : 'stay roughly the same';
  const effectiveGrowth =
    r.years.length > 1
      ? r.gdpPath[r.gdpPath.length - 1] / r.gdpPath[r.gdpPath.length - 2] - 1
      : BASELINE.realGDPGrowth;

  const gdpDir = dir(effectiveGrowth - BASELINE.realGDPGrowth);
  const unempDir = dir(r.finalUnemp - BASELINE.unemployment);
  const inflDir = dir(r.finalInflation - BASELINE.inflation);

  const I = r.indicators;
  const positives = [];
  const risks = [];

  if (I.povertyRate < 0.17) positives.push('lower poverty');
  if (I.nhsWaitIndex < 95) positives.push('shorter NHS waiting times');
  if (I.housingSupplyIndex > 110) positives.push('more new homes built');
  if (I.emissionsChange < -0.1) positives.push('meaningful cuts in carbon emissions');

  if (r.finalDebtToGDP > BASELINE.debtToGDP + 0.04) risks.push('rising debt as a share of the economy');
  if (I.unrestRisk > 0.5) risks.push('higher risk of protests or strikes');
  if (I.brainDrainRisk > 0.45) risks.push('risk of high earners and skilled workers moving abroad');
  if (I.fuelPovertyRate > 0.18) risks.push('more households in fuel poverty');

  const lines = [];
  lines.push(
    `Over the ${r.years.length}-year horizon, your budget delivers real GDP growth of around ${fmtRate(effectiveGrowth)}, `
    + `with unemployment at ${fmtRate(r.finalUnemp)} and inflation at about ${fmtRate(r.finalInflation)} in the final year. `
    + `Compared with a simple baseline, output is expected to ${gdpDir}, jobs will ${unempDir}, `
    + `and price pressures will ${inflDir}.`
  );
  lines.push(
    `By the end of the term, the deficit stands at about ${fmtPct(r.finalDeficitToGDP)} of GDP `
    + `and public debt at roughly ${fmtPct(r.finalDebtToGDP)} of GDP.`
  );

  if (positives.length) {
    lines.push('Visible upsides include ' + positives.join(', ') + '.');
  }
  if (risks.length) {
    lines.push('Key risks to watch: ' + risks.join(', ') + '.');
  }

  lines.push(`The external environment this term is modelled as: ${r.shock.name}.`);

  $('text_summary').textContent = lines.join(' ');
}

/* ---------- SCENARIOS & PRESETS ---------- */

function bindScenarioButtons() {
  $('save_scenario').addEventListener('click', saveScenario);
  $('load_scenario').addEventListener('click', () => loadScenario(false));
  $('compare_scenario').addEventListener('click', () => loadScenario(true));
}

function saveScenario() {
  const name = $('scenario_name').value.trim();
  if (!name) {
    alert('Please enter a scenario name.');
    return;
  }
  const existing = JSON.parse(localStorage.getItem('uk_budget_scenarios_v2') || '{}');
  existing[name] = appState.policy;
  localStorage.setItem('uk_budget_scenarios_v2', JSON.stringify(existing));
  loadScenariosFromStorage();
  alert(`Saved scenario "${name}".`);
}

function loadScenariosFromStorage() {
  const select = $('load_scenario_select');
  const data = JSON.parse(localStorage.getItem('uk_budget_scenarios_v2') || '{}');
  select.innerHTML = '<option value="">-- none --</option>';
  Object.keys(data).forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
}

function applyPolicyToUI(policy) {
  if (!policy) return;
  appState.policy = JSON.parse(JSON.stringify(policy)); // clone

  setInput('income_basic_rate', policy.incomeBasic);
  setInput('income_higher_rate', policy.incomeHigher);
  setInput('income_additional_rate', policy.incomeAdditional);
  setInput('corp_rate', policy.corpRate);
  setInput('vat_rate', policy.vatRate);
  setInput('nic_change', policy.nicChange * 100);
  setInput('cgt_change', policy.cgtChange * 100);
  setInput('iht_change', policy.ihtChange * 100);
  setInput('fuel_duty_change', policy.fuelDutyChange * 100);
  setInput('alcohol_duty_change', policy.alcoholDutyChange * 100);
  setInput('stamp_duty_change', policy.stampDutyChange * 100);
  setInput('council_tax_change', policy.councilTaxChange * 100);
  setInput('wealth_tax_rate', policy.wealthTaxRate * 100);

  setInput('health_spend_change', policy.spendChanges.health * 100);
  setInput('education_spend_change', policy.spendChanges.education * 100);
  setInput('defence_spend_change', policy.spendChanges.defence * 100);
  setInput('pensions_spend_change', policy.spendChanges.pensions * 100);
  setInput('welfare_spend_change', policy.spendChanges.welfare * 100);
  setInput('transport_spend_change', policy.spendChanges.transport * 100);
  setInput('housing_spend_change', policy.spendChanges.housing * 100);
  setInput('environment_spend_change', policy.spendChanges.environment * 100);
  setInput('foreign_aid_spend_change', policy.spendChanges.foreignAid * 100);
  setInput('infrastructure_spend_change', policy.spendChanges.infrastructure * 100);

  setInput('target_deficit', policy.targetDeficitPct * 100);

  setInput('min_wage_change', policy.minWageChange * 100);
  setInput('immigration_level', policy.immigrationLevel * 100);
  setInput('business_incentives', policy.businessIncentives * 100);
  setInput('trade_openness', policy.tradeOpenness * 100);
  setInput('carbon_tax_level', policy.carbonTaxLevel * 100);
  setInput('regulation_burden', policy.regulationBurden * 100);
  setInput('shock_intensity', policy.shockIntensity * 100);
}

function loadScenario(asComparison) {
  const name = $('load_scenario_select').value;
  if (!name) {
    alert('Select a saved scenario first.');
    return;
  }
  const data = JSON.parse(localStorage.getItem('uk_budget_scenarios_v2') || '{}');
  const policy = data[name];
  if (!policy) return;

  if (asComparison) {
    const currentPolicy = JSON.parse(JSON.stringify(appState.policy));
    const compRes = runSimulation(policy, appState.horizonYears, { shocksEnabled: appState.shocksEnabled });
    comparisonResults = compRes;
    // restore current and recompute
    applyPolicyToUI(currentPolicy);
    recompute();
  } else {
    applyPolicyToUI(policy);
    recompute();
  }
}

function bindPresetButtons() {
  $('apply_preset').addEventListener('click', () => {
    const key = $('preset_select').value;
    if (!key) return;
    const p = JSON.parse(JSON.stringify(appState.policy)); // start from baseline-ish

    if (key === 'baseline') {
      // basically already baseline; do nothing
    } else if (key === 'austerity') {
      p.health_spend = -0.05;
      p.spendChanges.health = -0.05;
      p.spendChanges.welfare = -0.1;
      p.spendChanges.pensions = 0;
      p.spendChanges.infrastructure = -0.05;
      p.nicChange = 0.05;
      p.vatRate = 22;
      p.targetDeficitPct = 0.02;
    } else if (key === 'high_tax_high_spend') {
      p.incomeBasic = 22;
      p.incomeHigher = 43;
      p.incomeAdditional = 48;
      p.corpRate = 28;
      p.vatRate = 21;
      p.spendChanges.health = 0.1;
      p.spendChanges.education = 0.1;
      p.spendChanges.welfare = 0.1;
      p.spendChanges.infrastructure = 0.15;
      p.targetDeficitPct = 0.05;
    } else if (key === 'business_friendly') {
      p.corpRate = 20;
      p.businessIncentives = 0.8;
      p.regulationBurden = 0.35;
      p.tradeOpenness = 0.7;
      p.spendChanges.corporate = 0;
      p.targetDeficitPct = 0.04;
    } else if (key === 'green_push') {
      p.carbonTaxLevel = 0.7;
      p.spendChanges.environment = 0.5;
      p.spendChanges.infrastructure = 0.25;
      p.spendChanges.transport = 0.2;
      p.corpRate = 26;
      p.vatRate = 21;
      p.targetDeficitPct = 0.06;
    } else if (key === 'libertarian') {
      p.incomeBasic = 15;
      p.incomeHigher = 30;
      p.incomeAdditional = 35;
      p.corpRate = 18;
      p.vatRate = 15;
      p.nicChange = -0.15;
      p.spendChanges.welfare = -0.3;
      p.spendChanges.foreignAid = -0.5;
      p.spendChanges.environment = -0.3;
      p.targetDeficitPct = 0.03;
    }

    applyPolicyToUI(p);
    recompute();
  });
}

/* ---------- EXPORT ---------- */

function bindExportButtons() {
  $('export_csv').addEventListener('click', exportCSV);
  $('print_pdf').addEventListener('click', () => window.print());
}

function exportCSV() {
  if (!lastResults) {
    alert('Run the simulation first.');
    return;
  }
  const r = lastResults;
  const rows = [];
  rows.push(['Year', 'GDP (£bn)', 'Unemployment (%)', 'Inflation (%)', 'Deficit (% of GDP)', 'Debt (% of GDP)'].join(','));
  for (let i = 0; i < r.years.length; i++) {
    rows.push([
      r.years[i],
      r.gdpPath[i].toFixed(2),
      (r.unempPath[i] * 100).toFixed(2),
      (r.inflationPath[i] * 100).toFixed(2),
      (r.deficitPath[i] * 100).toFixed(2),
      (r.debtPath[i] * 100).toFixed(2)
    ].join(','));
  }
  const csv = rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'uk_budget_simulation_v2.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------- MAIN RECOMPUTE ---------- */

function recompute() {
  // ensure state matches UI (if user types numbers)
  updatePolicyFromUI();
  const results = runSimulation(appState.policy, appState.horizonYears, {
    shocksEnabled: appState.shocksEnabled
  });
  lastResults = results;
  updateSummary(results);
  updateCharts(results);
  updateTextSummary(results);
}
