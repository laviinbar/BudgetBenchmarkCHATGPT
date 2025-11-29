// ====== BASELINE PARAMETERS (stylised) ======

const BASELINE = {
  yearGDP: 2884,          // £bn
  taxToGDP: 0.393,
  spendToGDP: 0.444,
  debtToGDP: 0.945,
  realGDPGrowth: 0.013,
  inflation: 0.02,
  unemployment: 0.045,
  interestRate: 0.045,
  exchangeRate: 1.25,
  ftse: 7800
};

const TAX_SHARES = {
  income: 0.28,
  nic: 0.18,
  vat: 0.17,
  company: 0.11,
  otherIndirect: 0.10,
  capitalGains: 0.02,
  inheritance: 0.01,
  fuel: 0.03,
  alcoholTobacco: 0.03,
  stampDuty: 0.03,
  councilTax: 0.04
};

const SPEND_SHARES = {
  health: 0.19,
  education: 0.09,
  defence: 0.07,
  pensions: 0.16,
  welfare: 0.14,
  transport: 0.04,
  housing: 0.03,
  environment: 0.02,
  foreignAid: 0.005,
  infrastructure: 0.05,
  debtInterest: 0.08,
  other: 0.185
};

let macroChart, spendChart, fiscalChart;
let lastResults = null;
let comparisonResults = null;

// ====== HELPERS ======

function $(id) {
  return document.getElementById(id);
}

function syncPair(rangeId, numId) {
  const r = $(rangeId);
  const n = $(numId);
  if (!r || !n) return;
  r.addEventListener('input', () => { n.value = r.value; });
  n.addEventListener('input', () => { r.value = n.value; });
}

function clamp(x, min, max) {
  return Math.min(max, Math.max(min, x));
}

// ====== INIT ======

document.addEventListener('DOMContentLoaded', () => {
  const pairs = [
    ['income_basic_rate', 'income_basic_rate_num'],
    ['income_higher_rate', 'income_higher_rate_num'],
    ['income_additional_rate', 'income_additional_rate_num'],
    ['corp_rate', 'corp_rate_num'],
    ['vat_rate', 'vat_rate_num'],
    ['nic_change', 'nic_change_num'],
    ['cgt_change', 'cgt_change_num'],
    ['iht_change', 'iht_change_num'],
    ['fuel_duty_change', 'fuel_duty_change_num'],
    ['alcohol_duty_change', 'alcohol_duty_change_num'],
    ['stamp_duty_change', 'stamp_duty_change_num'],
    ['council_tax_change', 'council_tax_change_num'],
    ['wealth_tax_rate', 'wealth_tax_rate_num'],

    ['health_spend_change', 'health_spend_change_num'],
    ['education_spend_change', 'education_spend_change_num'],
    ['defence_spend_change', 'defence_spend_change_num'],
    ['pensions_spend_change', 'pensions_spend_change_num'],
    ['welfare_spend_change', 'welfare_spend_change_num'],
    ['transport_spend_change', 'transport_spend_change_num'],
    ['housing_spend_change', 'housing_spend_change_num'],
    ['environment_spend_change', 'environment_spend_change_num'],
    ['foreign_aid_spend_change', 'foreign_aid_spend_change_num'],
    ['infrastructure_spend_change', 'infrastructure_spend_change_num'],
    ['target_deficit', 'target_deficit_num'],

    ['min_wage_change', 'min_wage_change_num'],
    ['immigration_level', 'immigration_level_num'],
    ['business_incentives', 'business_incentives_num'],
    ['trade_openness', 'trade_openness_num'],
    ['carbon_tax_level', 'carbon_tax_level_num'],
    ['regulation_burden', 'regulation_burden_num'],
    ['shock_intensity', 'shock_intensity_num']
  ];
  pairs.forEach(([r, n]) => syncPair(r, n));

  attachButtons();
  initCharts();
  runSimulation(); // sets baseline results (doesn't switch page)
});

function attachButtons() {
  $('run_simulation').addEventListener('click', () => {
    runSimulation();
    showResultsPage();
  });
  $('reset_defaults').addEventListener('click', () => {
    window.location.reload();
  });
  $('back_to_builder').addEventListener('click', () => {
    showBuilderPage();
  });

  $('save_scenario').addEventListener('click', saveScenario);
  $('load_scenario').addEventListener('click', () => loadScenario(false));
  $('compare_scenario').addEventListener('click', () => loadScenario(true));

  $('export_csv').addEventListener('click', exportCSV);
  $('print_pdf').addEventListener('click', () => window.print());
}

function showResultsPage() {
  $('controls').classList.add('hidden');
  $('results').classList.remove('hidden');
  $('step1_badge').classList.remove('active');
  $('step2_badge').classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showBuilderPage() {
  $('results').classList.add('hidden');
  $('controls').classList.remove('hidden');
  $('step2_badge').classList.remove('active');
  $('step1_badge').classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ====== GET POLICY ======

function getPolicyFromUI() {
  return {
    incomeBasic: parseFloat($('income_basic_rate').value),
    incomeHigher: parseFloat($('income_higher_rate').value),
    incomeAdditional: parseFloat($('income_additional_rate').value),

    corpRate: parseFloat($('corp_rate').value),
    vatRate: parseFloat($('vat_rate').value),
    nicChange: parseFloat($('nic_change').value) / 100,
    cgtChange: parseFloat($('cgt_change').value) / 100,
    ihtChange: parseFloat($('iht_change').value) / 100,
    fuelDutyChange: parseFloat($('fuel_duty_change').value) / 100,
    alcoholDutyChange: parseFloat($('alcohol_duty_change').value) / 100,
    stampDutyChange: parseFloat($('stamp_duty_change').value) / 100,
    councilTaxChange: parseFloat($('council_tax_change').value) / 100,
    wealthTaxRate: parseFloat($('wealth_tax_rate').value) / 100,

    spendChanges: {
      health: parseFloat($('health_spend_change').value) / 100,
      education: parseFloat($('education_spend_change').value) / 100,
      defence: parseFloat($('defence_spend_change').value) / 100,
      pensions: parseFloat($('pensions_spend_change').value) / 100,
      welfare: parseFloat($('welfare_spend_change').value) / 100,
      transport: parseFloat($('transport_spend_change').value) / 100,
      housing: parseFloat($('housing_spend_change').value) / 100,
      environment: parseFloat($('environment_spend_change').value) / 100,
      foreignAid: parseFloat($('foreign_aid_spend_change').value) / 100,
      infrastructure: parseFloat($('infrastructure_spend_change').value) / 100
    },
    targetDeficitPct: parseFloat($('target_deficit').value) / 100,

    minWageChange: parseFloat($('min_wage_change').value) / 100,
    immigrationLevel: parseFloat($('immigration_level').value) / 100,
    businessIncentives: parseFloat($('business_incentives').value) / 100,
    tradeOpenness: parseFloat($('trade_openness').value) / 100,
    carbonTaxLevel: parseFloat($('carbon_tax_level').value) / 100,
    regulationBurden: parseFloat($('regulation_burden').value) / 100,
    shockIntensity: parseFloat($('shock_intensity').value) / 100
  };
}

// ====== TAX & SPENDING ======

function computeTaxRevenue(policy) {
  const baseTax = BASELINE.yearGDP * BASELINE.taxToGDP;

  const baseBasic = 0.6, baseHigher = 0.3, baseAdditional = 0.1;
  const baseAverageRate = 0.6 * 20 + 0.3 * 40 + 0.1 * 45;
  const newAverageRate =
    baseBasic * policy.incomeBasic + baseHigher * policy.incomeHigher + baseAdditional * policy.incomeAdditional;
  const incomeRateIndex = newAverageRate / baseAverageRate;
  const incomeElasticity = 0.8;
  const incomeRevenueFactor = Math.pow(incomeRateIndex, incomeElasticity);

  const baseCorpRate = 25;
  const corpRateIndex = policy.corpRate / baseCorpRate;
  let corpRevenueFactor = Math.pow(corpRateIndex, 0.7);
  if (policy.corpRate > 28) {
    corpRevenueFactor -= 0.05 * (policy.corpRate - 28) / 10;
  }
  corpRevenueFactor = clamp(corpRevenueFactor, 0.5, 1.3);

  const baseVAT = 20;
  const vatRateIndex = policy.vatRate / baseVAT;
  const vatRevenueFactor = Math.pow(vatRateIndex, 0.9);

  const nicRevenueFactor = 1 + policy.nicChange * 0.9;
  const cgtRevenueFactor = 1 + policy.cgtChange * 0.8;
  const ihtRevenueFactor = 1 + policy.ihtChange * 0.7;

  const fuelFactor = 1 + policy.fuelDutyChange * 0.8;
  const alcoholFactor = 1 + policy.alcoholDutyChange * 0.7;
  const stampFactor = 1 + policy.stampDutyChange * 0.6;
  const councilFactor = 1 + policy.councilTaxChange * 0.95;

  const wealthTaxRevenue = BASELINE.yearGDP * (policy.wealthTaxRate * 0.3);

  const incentiveDrag = 1 - 0.05 * policy.businessIncentives;

  const incomeTax = baseTax * TAX_SHARES.income * incomeRevenueFactor * incentiveDrag;
  const nicTax = baseTax * TAX_SHARES.nic * nicRevenueFactor;
  const vatTax = baseTax * TAX_SHARES.vat * vatRevenueFactor;
  const corpTax = baseTax * TAX_SHARES.company * corpRevenueFactor * incentiveDrag;
  const otherIndirect = baseTax * TAX_SHARES.otherIndirect;
  const cgtTax = baseTax * TAX_SHARES.capitalGains * cgtRevenueFactor;
  const ihtTax = baseTax * TAX_SHARES.inheritance * ihtRevenueFactor;
  const fuelTax = baseTax * TAX_SHARES.fuel * fuelFactor;
  const alcoholTax = baseTax * TAX_SHARES.alcoholTobacco * alcoholFactor;
  const stampTax = baseTax * TAX_SHARES.stampDuty * stampFactor;
  const councilTax = baseTax * TAX_SHARES.councilTax * councilFactor;

  const total =
    incomeTax + nicTax + vatTax + corpTax +
    otherIndirect + cgtTax + ihtTax + fuelTax +
    alcoholTax + stampTax + councilTax + wealthTaxRevenue;

  return {
    total,
    breakdown: {
      incomeTax,
      nicTax,
      vatTax,
      corpTax,
      otherIndirect,
      cgtTax,
      ihtTax,
      fuelTax,
      alcoholTax,
      stampTax,
      councilTax,
      wealthTaxRevenue
    }
  };
}

function computeSpending(policy) {
  const baseSpend = BASELINE.yearGDP * BASELINE.spendToGDP;

  function upd(baseShare, key) {
    const change = policy.spendChanges[key] || 0;
    return baseSpend * baseShare * (1 + change);
  }

  const health = upd(SPEND_SHARES.health, 'health');
  const education = upd(SPEND_SHARES.education, 'education');
  const defence = upd(SPEND_SHARES.defence, 'defence');
  const pensions = upd(SPEND_SHARES.pensions, 'pensions');
  const welfare = upd(SPEND_SHARES.welfare, 'welfare');
  const transport = upd(SPEND_SHARES.transport, 'transport');
  const housing = upd(SPEND_SHARES.housing, 'housing');
  const environment = upd(SPEND_SHARES.environment, 'environment');
  const foreignAid = upd(SPEND_SHARES.foreignAid, 'foreignAid');
  const infrastructure = upd(SPEND_SHARES.infrastructure, 'infrastructure');

  let debtInterest = baseSpend * SPEND_SHARES.debtInterest;
  const other = baseSpend * SPEND_SHARES.other;

  let total = health + education + defence + pensions + welfare +
    transport + housing + environment + foreignAid + infrastructure +
    debtInterest + other;

  return {
    total,
    breakdown: {
      health,
      education,
      defence,
      pensions,
      welfare,
      transport,
      housing,
      environment,
      foreignAid,
      infrastructure,
      debtInterest,
      other
    }
  };
}

// ====== SHOCKS ======

function drawShock(policy) {
  const intensity = policy.shockIntensity;
  if (intensity < 0.05) {
    return { name: 'Calm global environment', gdpDelta: 0, inflationDelta: 0, unempDelta: 0, risk: 0, fxRisk: 0 };
  }

  const scenarios = [
    { name: 'Mild global slowdown', gdpDelta: -0.007, inflationDelta: -0.002, unempDelta: 0.004, risk: 0.2, fxRisk: 0.1 },
    { name: 'Energy price spike', gdpDelta: -0.005, inflationDelta: 0.015, unempDelta: 0.002, risk: 0.25, fxRisk: 0.1 },
    { name: 'Tech-led productivity boom', gdpDelta: 0.01, inflationDelta: -0.003, unempDelta: -0.004, risk: -0.1, fxRisk: -0.05 },
    { name: 'Mini financial wobble', gdpDelta: -0.004, inflationDelta: -0.001, unempDelta: 0.003, risk: 0.3, fxRisk: 0.15 },
    { name: 'Strong global demand for UK services', gdpDelta: 0.006, inflationDelta: 0.002, unempDelta: -0.003, risk: -0.05, fxRisk: -0.08 }
  ];

  const roll = Math.random();
  const index = Math.min(scenarios.length - 1, Math.floor(roll * scenarios.length));
  const s = scenarios[index];

  return {
    name: s.name,
    gdpDelta: s.gdpDelta * intensity,
    inflationDelta: s.inflationDelta * intensity,
    unempDelta: s.unempDelta * intensity,
    risk: s.risk * intensity,
    fxRisk: s.fxRisk * intensity
  };
}

// ====== MAIN SIM ======

function runSimulation() {
  const policy = getPolicyFromUI();
  const tax = computeTaxRevenue(policy);
  const spend = computeSpending(policy);

  const baseTax = BASELINE.yearGDP * BASELINE.taxToGDP;
  const baseSpend = BASELINE.yearGDP * BASELINE.spendToGDP;

  const primaryBalance = tax.total - (spend.total - spend.breakdown.debtInterest);
  let deficit = spend.total - tax.total;
  let deficitToGDP = deficit / BASELINE.yearGDP;

  const targetDeficit = policy.targetDeficitPct;
  const gap = deficitToGDP - targetDeficit;
  const adjustment = clamp(gap, -0.02, 0.02);
  const adjustAmount = adjustment * BASELINE.yearGDP;

  spend.breakdown.other = Math.max(0, spend.breakdown.other - adjustAmount);
  spend.total -= adjustAmount;

  deficit = spend.total - tax.total;
  deficitToGDP = deficit / BASELINE.yearGDP;

  const deltaG = (spend.total - baseSpend) / BASELINE.yearGDP;
  const deltaT = (tax.total - baseTax) / BASELINE.yearGDP;

  const multiplierG = 1.2;
  const multiplierT = 0.9;
  const demandShock = multiplierG * deltaG - multiplierT * deltaT;

  const corpGap = policy.corpRate - 25;
  const corpPenalty = 0.002 * (corpGap / 10);
  const regulationPenalty = 0.005 * (policy.regulationBurden - 0.5);
  const incentivesBoost = 0.006 * (policy.businessIncentives - 0.5);
  const tradeBoost = 0.004 * (policy.tradeOpenness - 0.5);
  const immigrationBoost = 0.005 * (policy.immigrationLevel - 0.6);

  let minWageEffect = 0;
  if (policy.minWageChange > 0.05) {
    minWageEffect = -0.004 * (policy.minWageChange - 0.05);
  } else if (policy.minWageChange > -0.02) {
    minWageEffect = 0.002 * policy.minWageChange;
  }

  const carbonDrag = -0.003 * policy.carbonTaxLevel;

  const structuralShock = -corpPenalty - regulationPenalty + incentivesBoost +
    tradeBoost + immigrationBoost + minWageEffect + carbonDrag;

  const shock = drawShock(policy);

  let gdpGrowth = BASELINE.realGDPGrowth + demandShock + structuralShock + shock.gdpDelta;
  gdpGrowth = clamp(gdpGrowth, -0.05, 0.06);

  const growthGap = gdpGrowth - BASELINE.realGDPGrowth;
  let unemployment = BASELINE.unemployment - 0.4 * growthGap + shock.unempDelta;
  if (policy.minWageChange > 0.2) {
    unemployment += 0.01 * (policy.minWageChange - 0.2);
  }
  unemployment = clamp(unemployment, 0.025, 0.15);

  const demandInflation = 0.8 * demandShock;
  const gapInflation = 0.4 * (BASELINE.unemployment - unemployment);
  let inflation = BASELINE.inflation + demandInflation + gapInflation +
    0.007 * policy.carbonTaxLevel + shock.inflationDelta;
  inflation = clamp(inflation, 0, 0.1);

  let interestRate = 0.03 + 0.6 * (inflation - 0.02) + 0.05 * (deficitToGDP - BASELINE.realGDPGrowth);
  interestRate = clamp(interestRate, 0.01, 0.08);

  const baseDebt = BASELINE.debtToGDP * BASELINE.yearGDP;
  const interestCost = baseDebt * interestRate;
  const totalDeficit = deficit + interestCost;
  const newDebt = baseDebt + totalDeficit;
  const endYearGDP = BASELINE.yearGDP * (1 + gdpGrowth);
  const debtToGDP = newDebt / endYearGDP;

  const months = [];
  const gdpSeries = [];
  const unempSeries = [];
  const altGdpSeries = [];
  const altUnempSeries = [];

  let gdpLevel = BASELINE.yearGDP / 12;
  let altGdpLevel = gdpLevel;
  let u = BASELINE.unemployment;
  let altU = u;

  for (let m = 1; m <= 12; m++) {
    months.push(`M${m}`);
    gdpLevel *= Math.pow(1 + gdpGrowth, 1 / 12);
    u += (unemployment - BASELINE.unemployment) / 12;

    gdpSeries.push(gdpLevel);
    unempSeries.push(u * 100);

    if (comparisonResults && comparisonResults.gdpGrowth != null) {
      altGdpLevel *= Math.pow(1 + comparisonResults.gdpGrowth, 1 / 12);
      altU += (comparisonResults.unemployment - BASELINE.unemployment) / 12;
      altGdpSeries.push(altGdpLevel);
      altUnempSeries.push(altU * 100);
    }
  }

  const indicators = computeIndicators({
    policy,
    tax,
    spend,
    gdpGrowth,
    unemployment,
    inflation,
    interestRate,
    debtToGDP,
    deficitToGDP,
    shock
  });

  lastResults = {
    months,
    gdpSeries,
    unempSeries,
    altGdpSeries,
    altUnempSeries,
    gdpGrowth,
    unemployment,
    inflation,
    interestRate,
    debtToGDP,
    deficitToGDP,
    endYearGDP,
    tax,
    spend,
    indicators,
    shock,
    targetDeficit: policy.targetDeficitPct
  };

  updateSummary(lastResults);
  updateCharts(lastResults);
  updateIndicators(lastResults);
  updateTextSummary(lastResults);
}

// ====== INDICATORS ======

function pensionsChange(spend) {
  const base = BASELINE.yearGDP * BASELINE.spendToGDP * SPEND_SHARES.pensions;
  return spend.breakdown.pensions / base - 1;
}

function computeIndicators(ctx) {
  const { policy, spend, gdpGrowth, unemployment, inflation, debtToGDP, deficitToGDP, shock } = ctx;

  const basePoverty = 0.18;
  const baseGini = 0.35;
  const baseHomeless = 1.0;
  const baseFoodbank = 1.0;
  const baseLifeExp = 81.0;

  const healthChange = (spend.breakdown.health / (BASELINE.yearGDP * BASELINE.spendToGDP * SPEND_SHARES.health)) - 1;
  const educationChange = (spend.breakdown.education / (BASELINE.yearGDP * BASELINE.spendToGDP * SPEND_SHARES.education)) - 1;
  const welfareChange = (spend.breakdown.welfare / (BASELINE.yearGDP * BASELINE.spendToGDP * SPEND_SHARES.welfare)) - 1;
  const housingChange = (spend.breakdown.housing / (BASELINE.yearGDP * BASELINE.spendToGDP * SPEND_SHARES.housing)) - 1;
  const infraChange = (spend.breakdown.infrastructure / (BASELINE.yearGDP * BASELINE.spendToGDP * SPEND_SHARES.infrastructure)) - 1;
  const envChange = (spend.breakdown.environment / (BASELINE.yearGDP * BASELINE.spendToGDP * SPEND_SHARES.environment)) - 1;

  const businessFormationIndex = 100 +
    40 * (gdpGrowth - BASELINE.realGDPGrowth) * 100 +
    25 * (policy.businessIncentives - 0.5) -
    20 * (policy.corpRate - 25) / 10 -
    10 * (policy.regulationBurden - 0.5);

  const fdiIndex = 100 +
    30 * (policy.tradeOpenness - 0.5) +
    20 * (policy.businessIncentives - 0.5) -
    25 * (policy.corpRate - 25) / 10 -
    10 * shock.risk;

  const startupIndex = 100 +
    25 * (policy.businessIncentives - 0.5) +
    15 * educationChange -
    10 * (policy.regulationBurden - 0.5);

  const nonDomFlow = -5 * (policy.incomeAdditional - 0.45) * 100 - 3 * policy.wealthTaxRate * 100;

  const povertyRate = clamp(
    basePoverty +
    0.4 * (unemployment - BASELINE.unemployment) +
    0.2 * inflation -
    0.2 * welfareChange -
    0.05 * pensionsChange(spend),
    0.1, 0.3
  );

  const gini = clamp(
    baseGini +
    0.05 * (policy.incomeBasic - 0.2) -
    0.1 * welfareChange +
    0.02 * (policy.tradeOpenness - 0.5),
    0.28, 0.42
  );

  const homelessIdx = clamp(
    baseHomeless +
    2 * (housingChange * -1) +
    3 * (unemployment - BASELINE.unemployment),
    0.6, 1.6
  );

  const foodbankIdx = clamp(
    baseFoodbank +
    4 * (povertyRate - basePoverty),
    0.7, 1.8
  );

  const nhsWaitIndex = clamp(
    100 - 40 * healthChange + 20 * (inflation - BASELINE.inflation),
    60, 140
  );

  const lifeExpectancy = clamp(
    baseLifeExp +
    0.3 * healthChange -
    0.2 * (povertyRate - basePoverty),
    79, 83
  );

  const schoolPerfIndex = clamp(
    100 + 30 * educationChange - 5 * (povertyRate - basePoverty) * 100,
    80, 120
  );

  const apprenticeshipIndex = clamp(
    100 +
    20 * educationChange +
    10 * policy.businessIncentives,
    80, 140
  );

  const emissionsChange = clamp(
    -0.5 * policy.carbonTaxLevel - 0.3 * envChange,
    -0.5, 0.2
  );

  const renewablesShare = clamp(
    0.4 + 0.3 * envChange + 0.2 * policy.carbonTaxLevel,
    0.2, 0.8
  );

  const energyPriceIndex = clamp(
    100 + 50 * policy.carbonTaxLevel + 15 * shock.inflationDelta * 100,
    80, 170
  );

  const airQualityIndex = clamp(
    80 - 30 * emissionsChange,
    60, 120
  );

  const housePriceGrowth = clamp(
    0.02 + 0.5 * gdpGrowth - 0.3 * housingChange - 0.1 * (0.03 + 0.5 * (debtToGDP - BASELINE.debtToGDP)),
    -0.05, 0.1
  );

  const rentAffordability = clamp(
    0.30 +
    0.1 * (povertyRate - basePoverty) -
    0.05 * housingChange,
    0.2, 0.4
  );

  const housingSupplyIndex = clamp(
    100 + 40 * housingChange + 20 * infraChange,
    70, 160
  );

  const fuelPovertyRate = clamp(
    0.12 +
    0.3 * (energyPriceIndex - 100) / 100 -
    0.1 * welfareChange,
    0.05, 0.25
  );

  const tradeBalance = clamp(
    -0.02 + 0.03 * (policy.tradeOpenness - 0.5) + 0.01 * shock.gdpDelta * 100,
    -0.05, 0.03
  );

  const tourismIndex = clamp(
    100 + 20 * (policy.tradeOpenness - 0.5) + 10 * (gdpGrowth - BASELINE.realGDPGrowth) * 100,
    80, 130
  );

  const unrestRisk = clamp(
    0.2 +
    0.5 * (povertyRate - basePoverty) +
    0.4 * (unemployment - BASELINE.unemployment) +
    0.3 * (policy.regulationBurden - 0.5) -
    0.3 * welfareChange,
    0, 1
  );

  const brainDrainRisk = clamp(
    0.2 +
    0.5 * (policy.incomeAdditional - 0.45) +
    0.4 * policy.wealthTaxRate +
    0.3 * (policy.tradeOpenness - 0.5) * -1,
    0, 1
  );

  return {
    businessFormationIndex,
    fdiIndex,
    startupIndex,
    nonDomFlow,
    povertyRate,
    gini,
    homelessIdx,
    foodbankIdx,
    nhsWaitIndex,
    lifeExpectancy,
    schoolPerfIndex,
    apprenticeshipIndex,
    emissionsChange,
    renewablesShare,
    energyPriceIndex,
    airQualityIndex,
    housePriceGrowth,
    rentAffordability,
    housingSupplyIndex,
    fuelPovertyRate,
    tradeBalance,
    tourismIndex,
    unrestRisk,
    brainDrainRisk
  };
}

// ====== UI HELPERS ======

function fmtPct(x) {
  return (x * 100).toFixed(1) + '%';
}
function fmtRate(x) {
  return (x * 100).toFixed(1) + '%';
}
function fmtMoneyBn(x) {
  return '£' + x.toFixed(0) + 'bn';
}

// ====== UPDATE SUMMARY ======

function updateSummary(r) {
  $('gdp_growth_outcome').textContent = fmtRate(r.gdpGrowth);
  $('gdp_level_outcome').textContent = fmtMoneyBn(r.endYearGDP);
  $('unemployment_outcome').textContent = fmtRate(r.unemployment);

  $('inflation_outcome').textContent = fmtRate(r.inflation);
  $('rate_outcome').textContent = fmtRate(r.interestRate);

  const houseGrowth = r.indicators.housePriceGrowth;
  $('house_price_outcome').textContent = fmtRate(houseGrowth);
  $('house_price_outcome_adv').textContent = fmtRate(houseGrowth);

  $('deficit_outcome').textContent = fmtPct(r.deficitToGDP);
  $('debt_outcome').textContent = fmtPct(r.debtToGDP);

  $('shock_short').textContent = r.shock.name;
  $('shock_description').textContent = r.shock.name;
}

// ====== CHARTS ======

function initCharts() {
  const macroCtx = $('macro_chart').getContext('2d');
  const spendCtx = $('spend_chart').getContext('2d');
  const fiscalCtx = $('fiscal_chart').getContext('2d');

  macroChart = new Chart(macroCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'GDP (monthly level, £bn)',
          data: [],
          yAxisID: 'y1',
          borderWidth: 2
        },
        {
          label: 'Unemployment (%)',
          data: [],
          yAxisID: 'y2',
          borderDash: [5, 4],
          borderWidth: 2
        },
        {
          label: 'GDP – comparison',
          data: [],
          yAxisID: 'y1',
          borderWidth: 1,
          borderDash: [2, 2]
        },
        {
          label: 'Unemployment – comparison',
          data: [],
          yAxisID: 'y2',
          borderDash: [2, 2],
          borderWidth: 1
        }
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

  spendChart = new Chart(spendCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [
        { label: 'Spending (£bn)', data: [], borderWidth: 1 }
      ]
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

  fiscalChart = new Chart(fiscalCtx, {
    type: 'bar',
    data: {
      labels: ['Deficit (% of GDP)', 'Debt (% of GDP)'],
      datasets: [
        {
          label: 'Your budget',
          data: [0, 0],
          borderWidth: 1
        },
        {
          label: 'Baseline',
          data: [BASELINE.realGDPGrowth * 100, BASELINE.debtToGDP * 100], // not perfect but gives context
          borderWidth: 1
        }
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
}

function updateCharts(r) {
  macroChart.data.labels = r.months;
  macroChart.data.datasets[0].data = r.gdpSeries;
  macroChart.data.datasets[1].data = r.unempSeries;
  macroChart.data.datasets[2].data = r.altGdpSeries || [];
  macroChart.data.datasets[3].data = r.altUnempSeries || [];
  macroChart.update();

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

  fiscalChart.data.datasets[0].data = [
    r.deficitToGDP * 100,
    r.debtToGDP * 100
  ];
  fiscalChart.data.datasets[1].data = [
    BASELINE.realGDPGrowth * 100, // used as a "target-ish" for deficit line; you can tweak
    BASELINE.debtToGDP * 100
  ];
  fiscalChart.update();
}

// ====== ADVANCED INDICATORS UI ======

function updateIndicators(r) {
  const I = r.indicators;

  $('business_formation_outcome').textContent = I.businessFormationIndex.toFixed(0);
  $('fdi_outcome').textContent = I.fdiIndex.toFixed(0);
  $('startup_outcome').textContent = I.startupIndex.toFixed(0);
  $('nondom_outcome').textContent = I.nonDomFlow.toFixed(1);

  $('poverty_outcome').textContent = fmtPct(I.povertyRate);
  $('gini_outcome').textContent = I.gini.toFixed(2);
  $('homeless_outcome').textContent = I.homelessIdx.toFixed(2);
  $('foodbank_outcome').textContent = I.foodbankIdx.toFixed(2);

  $('nhs_wait_outcome').textContent = I.nhsWaitIndex.toFixed(0) + ' (100=baseline)';
  $('life_expectancy_outcome').textContent = I.lifeExpectancy.toFixed(1);
  $('school_perf_outcome').textContent = I.schoolPerfIndex.toFixed(0);
  $('apprentice_outcome').textContent = I.apprenticeshipIndex.toFixed(0);

  $('emissions_outcome').textContent = (I.emissionsChange * 100).toFixed(1) + '% vs baseline';
  $('renewables_outcome').textContent = fmtPct(I.renewablesShare);
  $('energy_price_outcome').textContent = I.energyPriceIndex.toFixed(0);
  $('air_quality_outcome').textContent = I.airQualityIndex.toFixed(0);

  $('rent_afford_outcome').textContent = (I.rentAffordability * 100).toFixed(1) + '% of income';
  $('housing_supply_outcome').textContent = I.housingSupplyIndex.toFixed(0);
  $('fuel_poverty_outcome').textContent = fmtPct(I.fuelPovertyRate);

  $('trade_balance_outcome').textContent = fmtPct(I.tradeBalance);
  $('tourism_outcome').textContent = I.tourismIndex.toFixed(0);
  $('unrest_outcome').textContent = (I.unrestRisk * 100).toFixed(0) + '%';
  $('brain_drain_outcome').textContent = (I.brainDrainRisk * 100).toFixed(0) + '%';
}

// ====== TEXT SUMMARY ======

function updateTextSummary(r) {
  const dir = x => x > 0.002 ? 'increase' : (x < -0.002 ? 'fall' : 'stay roughly the same');

  const gdpDir = dir(r.gdpGrowth - BASELINE.realGDPGrowth);
  const unempDir = dir(r.unemployment - BASELINE.unemployment);
  const inflDir = dir(r.inflation - BASELINE.inflation);

  const stress = [];
  if (r.debtToGDP > BASELINE.debtToGDP + 0.03) stress.push('rising debt as a share of the economy');
  if (r.indicators.unrestRisk > 0.5) stress.push('higher risk of protests or strikes');
  if (r.indicators.brainDrainRisk > 0.45) stress.push('risk of high earners and skilled workers moving abroad');
  if (r.indicators.emissionsChange > 0) stress.push('higher carbon emissions');
  if (r.indicators.fuelPovertyRate > 0.18) stress.push('more households in fuel poverty');

  const positives = [];
  if (r.indicators.nhsWaitIndex < 95) positives.push('shorter NHS waiting times');
  if (r.indicators.povertyRate < 0.17) positives.push('lower poverty');
  if (r.indicators.tradeBalance > -0.01) positives.push('a better trade balance');
  if (r.indicators.housingSupplyIndex > 110) positives.push('more new homes being built');

  const lines = [];
  lines.push(
    `Your budget leads to real GDP growth of ${fmtRate(r.gdpGrowth)}, `
    + `with unemployment around ${fmtRate(r.unemployment)} and inflation at about ${fmtRate(r.inflation)}. `
    + `Compared with the baseline, output is expected to ${gdpDir}, jobs will ${unempDir}, `
    + `and price pressures will ${inflDir}.`
  );
  lines.push(
    `On the public finances, the deficit is about ${fmtPct(r.deficitToGDP)} of GDP `
    + `and debt ends the year at around ${fmtPct(r.debtToGDP)} of GDP.`
  );

  if (positives.length) {
    lines.push('Upsides include ' + positives.join(', ') + '.');
  }
  if (stress.length) {
    lines.push('Risks to watch: ' + stress.join(', ') + '.');
  }

  lines.push(`This year’s external scenario is: ${r.shock.name}.`);

  $('text_summary').textContent = lines.join(' ');
}

// ====== SCENARIOS (SAVE / LOAD / COMPARE) ======

function saveScenario() {
  const name = $('scenario_name').value.trim();
  if (!name) {
    alert('Please enter a scenario name.');
    return;
  }
  const policy = getPolicyFromUI();
  const existing = JSON.parse(localStorage.getItem('uk_budget_scenarios') || '{}');
  existing[name] = policy;
  localStorage.setItem('uk_budget_scenarios', JSON.stringify(existing));
  loadScenariosFromStorage();
  alert(`Saved scenario "${name}".`);
}

function loadScenariosFromStorage() {
  const select = $('load_scenario_select');
  const data = JSON.parse(localStorage.getItem('uk_budget_scenarios') || '{}');
  select.innerHTML = '<option value="">-- none --</option>';
  Object.keys(data).forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
}
loadScenariosFromStorage();

function applyPolicyToUI(policy) {
  if (!policy) return;
  $('income_basic_rate').value = policy.incomeBasic;
  $('income_basic_rate_num').value = policy.incomeBasic;
  $('income_higher_rate').value = policy.incomeHigher;
  $('income_higher_rate_num').value = policy.incomeHigher;
  $('income_additional_rate').value = policy.incomeAdditional;
  $('income_additional_rate_num').value = policy.incomeAdditional;
  $('corp_rate').value = policy.corpRate;
  $('corp_rate_num').value = policy.corpRate;
  $('vat_rate').value = policy.vatRate;
  $('vat_rate_num').value = policy.vatRate;

  $('nic_change').value = policy.nicChange * 100;
  $('nic_change_num').value = policy.nicChange * 100;
  $('cgt_change').value = policy.cgtChange * 100;
  $('cgt_change_num').value = policy.cgtChange * 100;
  $('iht_change').value = policy.ihtChange * 100;
  $('iht_change_num').value = policy.ihtChange * 100;
  $('fuel_duty_change').value = policy.fuelDutyChange * 100;
  $('fuel_duty_change_num').value = policy.fuelDutyChange * 100;
  $('alcohol_duty_change').value = policy.alcoholDutyChange * 100;
  $('alcohol_duty_change_num').value = policy.alcoholDutyChange * 100;
  $('stamp_duty_change').value = policy.stampDutyChange * 100;
  $('stamp_duty_change_num').value = policy.stampDutyChange * 100;
  $('council_tax_change').value = policy.councilTaxChange * 100;
  $('council_tax_change_num').value = policy.councilTaxChange * 100;
  $('wealth_tax_rate').value = policy.wealthTaxRate * 100;
  $('wealth_tax_rate_num').value = policy.wealthTaxRate * 100;

  Object.entries(policy.spendChanges || {}).forEach(([k, v]) => {
    const id = `${k}_spend_change`;
    if ($(id)) {
      $(id).value = v * 100;
      $(`${id}_num`).value = v * 100;
    }
  });

  $('target_deficit').value = policy.targetDeficitPct * 100;
  $('target_deficit_num').value = policy.targetDeficitPct * 100;

  $('min_wage_change').value = policy.minWageChange * 100;
  $('min_wage_change_num').value = policy.minWageChange * 100;
  $('immigration_level').value = policy.immigrationLevel * 100;
  $('immigration_level_num').value = policy.immigrationLevel * 100;
  $('business_incentives').value = policy.businessIncentives * 100;
  $('business_incentives_num').value = policy.businessIncentives * 100;
  $('trade_openness').value = policy.tradeOpenness * 100;
  $('trade_openness_num').value = policy.tradeOpenness * 100;
  $('carbon_tax_level').value = policy.carbonTaxLevel * 100;
  $('carbon_tax_level_num').value = policy.carbonTaxLevel * 100;
  $('regulation_burden').value = policy.regulationBurden * 100;
  $('regulation_burden_num').value = policy.regulationBurden * 100;
  $('shock_intensity').value = policy.shockIntensity * 100;
  $('shock_intensity_num').value = policy.shockIntensity * 100;
}

function loadScenario(asComparison) {
  const name = $('load_scenario_select').value;
  if (!name) {
    alert('Select a saved scenario first.');
    return;
  }
  const data = JSON.parse(localStorage.getItem('uk_budget_scenarios') || '{}');
  const policy = data[name];
  if (!policy) return;

  if (asComparison) {
    const currentPolicy = getPolicyFromUI();
    applyPolicyToUI(policy);
    runSimulation();
    comparisonResults = {
      gdpGrowth: lastResults.gdpGrowth,
      unemployment: lastResults.unemployment
    };
    applyPolicyToUI(currentPolicy);
    runSimulation();
  } else {
    applyPolicyToUI(policy);
    runSimulation();
  }
}

// ====== EXPORT CSV ======

function exportCSV() {
  if (!lastResults) {
    alert('Run the simulation first.');
    return;
  }
  const r = lastResults;
  const rows = [];
  rows.push(['Month', 'GDP (£bn)', 'Unemployment (%)', 'Inflation (annual %)', 'Deficit (% of GDP)', 'Debt (% of GDP)'].join(','));
  for (let i = 0; i < r.months.length; i++) {
    const m = r.months[i];
    const gdp = r.gdpSeries[i];
    const u = r.unempSeries[i];
    rows.push([m, gdp.toFixed(2), u.toFixed(2), (r.inflation * 100).toFixed(2), (r.deficitToGDP * 100).toFixed(2), (r.debtToGDP * 100).toFixed(2)].join(','));
  }
  const csv = rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'uk_budget_simulation.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
