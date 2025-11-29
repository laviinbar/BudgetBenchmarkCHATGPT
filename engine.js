// engine.js
// Pure simulation logic; no DOM or UI. Deterministic when shocksEnabled = false.

import { BASELINE, TAX_SHARES, SPEND_SHARES, MODEL_PARAMS } from './config.js';

const clamp = (x, min, max) => Math.min(max, Math.max(min, x));

export function computeTaxRevenue(policy) {
  const baseTax = BASELINE.yearGDP * BASELINE.taxToGDP;

  // income tax
  const baseBasic = 0.6, baseHigher = 0.3, baseAdditional = 0.1;
  const baseAvgRate = 0.6 * 20 + 0.3 * 40 + 0.1 * 45;
  const newAvgRate =
    baseBasic * policy.incomeBasic +
    baseHigher * policy.incomeHigher +
    baseAdditional * policy.incomeAdditional;
  const incomeRateIndex = newAvgRate / baseAvgRate;
  const incomeRevenueFactor = Math.pow(incomeRateIndex, MODEL_PARAMS.incomeElasticity);

  // corporation
  const baseCorpRate = 25;
  const corpRateIndex = policy.corpRate / baseCorpRate;
  let corpRevenueFactor = Math.pow(corpRateIndex, MODEL_PARAMS.corpElasticity);
  if (policy.corpRate > 28) {
    corpRevenueFactor -= 0.05 * (policy.corpRate - 28) / 10;
  }
  corpRevenueFactor = clamp(corpRevenueFactor, 0.5, 1.3);

  // VAT
  const baseVAT = 20;
  const vatRateIndex = policy.vatRate / baseVAT;
  const vatRevenueFactor = Math.pow(vatRateIndex, MODEL_PARAMS.vatElasticity);

  const nicRevenueFactor = 1 + policy.nicChange * MODEL_PARAMS.nicElasticity;
  const cgtRevenueFactor = 1 + policy.cgtChange * MODEL_PARAMS.cgtElasticity;
  const ihtRevenueFactor = 1 + policy.ihtChange * MODEL_PARAMS.ihtElasticity;

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
    baseTax,
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

export function computeSpending(policy) {
  const baseSpend = BASELINE.yearGDP * BASELINE.spendToGDP;

  const upd = (share, key) => baseSpend * share * (1 + (policy.spendChanges[key] || 0));

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
    baseSpend,
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

function drawShock(policy, shocksEnabled) {
  if (!shocksEnabled || policy.shockIntensity < 0.05) {
    return {
      name: 'No external shock (deterministic scenario)',
      gdpDelta: 0,
      inflationDelta: 0,
      unempDelta: 0,
      risk: 0
    };
  }

  const scenarios = [
    { name: 'Mild global slowdown', gdpDelta: -0.007, inflationDelta: -0.002, unempDelta: 0.004, risk: 0.2 },
    { name: 'Energy price spike', gdpDelta: -0.005, inflationDelta: 0.015, unempDelta: 0.002, risk: 0.25 },
    { name: 'Tech-led productivity boom', gdpDelta: 0.01, inflationDelta: -0.003, unempDelta: -0.004, risk: -0.1 },
    { name: 'Mini financial wobble', gdpDelta: -0.004, inflationDelta: -0.001, unempDelta: 0.003, risk: 0.3 },
    { name: 'Strong global demand for UK services', gdpDelta: 0.006, inflationDelta: 0.002, unempDelta: -0.003, risk: -0.05 }
  ];

  const roll = Math.random();
  const index = Math.min(scenarios.length - 1, Math.floor(roll * scenarios.length));
  const s = scenarios[index];
  const intensity = policy.shockIntensity;

  return {
    name: s.name,
    gdpDelta: s.gdpDelta * intensity,
    inflationDelta: s.inflationDelta * intensity,
    unempDelta: s.unempDelta * intensity,
    risk: s.risk * intensity
  };
}

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

  const healthChange = spend.breakdown.health / (BASELINE.yearGDP * BASELINE.spendToGDP * SPEND_SHARES.health) - 1;
  const educationChange = spend.breakdown.education / (BASELINE.yearGDP * BASELINE.spendToGDP * SPEND_SHARES.education) - 1;
  const welfareChange = spend.breakdown.welfare / (BASELINE.yearGDP * BASELINE.spendToGDP * SPEND_SHARES.welfare) - 1;
  const housingChange = spend.breakdown.housing / (BASELINE.yearGDP * BASELINE.spendToGDP * SPEND_SHARES.housing) - 1;
  const infraChange = spend.breakdown.infrastructure / (BASELINE.yearGDP * BASELINE.spendToGDP * SPEND_SHARES.infrastructure) - 1;
  const envChange = spend.breakdown.environment / (BASELINE.yearGDP * BASELINE.spendToGDP * SPEND_SHARES.environment) - 1;

  const businessFormationIndex = clamp(
    100 +
    40 * (gdpGrowth - BASELINE.realGDPGrowth) * 100 +
    25 * (policy.businessIncentives - 0.5) -
    20 * (policy.corpRate - 25) / 10 -
    10 * (policy.regulationBurden - 0.5),
    50, 160
  );

  const fdiIndex = clamp(
    100 +
    30 * (policy.tradeOpenness - 0.5) +
    20 * (policy.businessIncentives - 0.5) -
    25 * (policy.corpRate - 25) / 10 -
    10 * shock.risk,
    50, 160
  );

  const startupIndex = clamp(
    100 +
    25 * (policy.businessIncentives - 0.5) +
    15 * educationChange -
    10 * (policy.regulationBurden - 0.5),
    60, 160
  );

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
    100 + 50 * policy.carbonTaxLevel,
    80, 170
  );

  const airQualityIndex = clamp(
    80 - 30 * emissionsChange,
    60, 120
  );

  const housePriceGrowth = clamp(
    0.02 +
    0.5 * gdpGrowth -
    0.3 * housingChange,
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
    -0.02 +
    0.03 * (policy.tradeOpenness - 0.5) +
    0.01 * (gdpGrowth - BASELINE.realGDPGrowth),
    -0.05, 0.03
  );

  const tourismIndex = clamp(
    100 +
    20 * (policy.tradeOpenness - 0.5) +
    10 * (gdpGrowth - BASELINE.realGDPGrowth) * 100,
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
    0.4 * policy.wealthTaxRate -
    0.2 * (policy.businessIncentives - 0.5),
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

// MAIN ENTRY: multi-year path
export function runSimulation(policy, horizonYears = 5, { shocksEnabled = false } = {}) {
  const tax = computeTaxRevenue(policy);
  const spend = computeSpending(policy);

  const primaryBalance = tax.total - (spend.total - spend.breakdown.debtInterest);
  let deficit = spend.total - tax.total;
  let deficitToGDP = deficit / BASELINE.yearGDP;

  // Apply deficit target once in year 1 via "other" spending
  const targetDeficit = policy.targetDeficitPct;
  const gap = deficitToGDP - targetDeficit;
  const adjustment = clamp(gap, -0.02, 0.02);
  const adjustAmount = adjustment * BASELINE.yearGDP;

  spend.breakdown.other = Math.max(0, spend.breakdown.other - adjustAmount);
  spend.total -= adjustAmount;

  deficit = spend.total - tax.total;
  deficitToGDP = deficit / BASELINE.yearGDP;

  // Demand & structural effects (year 1)
  const deltaG = (spend.total - spend.baseSpend) / BASELINE.yearGDP;
  const deltaT = (tax.total - tax.baseTax) / BASELINE.yearGDP;

  const demandShock = MODEL_PARAMS.multiplierG * deltaG - MODEL_PARAMS.multiplierT * deltaT;

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

  // Split infra/education into short vs long-run (for a very rough J-curve)
  const educationChange = policy.spendChanges.education || 0;
  const infraChange = policy.spendChanges.infrastructure || 0;
  const infraEduBoost = 0.5 * (educationChange + infraChange); // long-run positive

  const structuralShockShort =
    -corpPenalty - regulationPenalty + incentivesBoost +
    tradeBoost + immigrationBoost + minWageEffect + carbonDrag;

  const structuralLongRunBoost = infraEduBoost;

  const shock = drawShock(policy, shocksEnabled);

  // Paths per year
  const years = [];
  const gdpPath = [];
  const unempPath = [];
  const inflationPath = [];
  const deficitPath = [];
  const debtPath = [];

  let debt = BASELINE.debtToGDP * BASELINE.yearGDP;
  let gdpLevel = BASELINE.yearGDP;

  for (let y = 1; y <= horizonYears; y++) {
    years.push(`Year ${y}`);

    const longRunFactor = horizonYears === 1 ? 0 : (y - 1) / (horizonYears - 1);
    let gdpGrowth =
      BASELINE.realGDPGrowth +
      demandShock +
      structuralShockShort +
      structuralLongRunBoost * longRunFactor +
      (y === 1 ? shock.gdpDelta : 0); // shock hits year 1 only

    gdpGrowth = clamp(gdpGrowth, -0.05, 0.06);

    let unemployment =
      BASELINE.unemployment -
      0.4 * (gdpGrowth - BASELINE.realGDPGrowth) +
      (y === 1 ? shock.unempDelta : 0);
    if (policy.minWageChange > 0.2) {
      unemployment += 0.01 * (policy.minWageChange - 0.2);
    }
    unemployment = clamp(unemployment, 0.025, 0.15);

    const demandInflation = 0.8 * demandShock;
    const gapInflation = 0.4 * (BASELINE.unemployment - unemployment);
    let inflation =
      BASELINE.inflation +
      demandInflation +
      gapInflation +
      0.007 * policy.carbonTaxLevel +
      (y === 1 ? shock.inflationDelta : 0);

    inflation = clamp(inflation, 0, 0.1);

    let interestRate =
      0.03 +
      0.6 * (inflation - 0.02) +
      0.05 * (deficitToGDP - BASELINE.realGDPGrowth);
    interestRate = clamp(interestRate, 0.01, 0.08);

    gdpLevel = gdpLevel * (1 + gdpGrowth);

    const taxFactor = tax.total / tax.baseTax;
    const spendFactor = spend.total / spend.baseSpend;

    const taxYear = tax.baseTax * taxFactor * (gdpLevel / BASELINE.yearGDP);
    const spendYear = spend.baseSpend * spendFactor * (gdpLevel / BASELINE.yearGDP);

    const deficitYear = spendYear - taxYear;
    const interestCost = debt * interestRate;
    debt += deficitYear + interestCost;

    const debtToGDPYear = debt / gdpLevel;
    const deficitToGDPYear = deficitYear / gdpLevel;

    gdpPath.push(gdpLevel);
    unempPath.push(unemployment);
    inflationPath.push(inflation);
    deficitPath.push(deficitToGDPYear);
    debtPath.push(debtToGDPYear);

    // update for next iteration
    deficitToGDP = deficitToGDPYear;
  }

  const finalIndex = horizonYears - 1;
  const finalGDP = gdpPath[finalIndex];
  const finalUnemp = unempPath[finalIndex];
  const finalInflation = inflationPath[finalIndex];
  const finalDeficitToGDP = deficitPath[finalIndex];
  const finalDebtToGDP = debtPath[finalIndex];

  const indicators = computeIndicators({
    policy,
    spend,
    gdpGrowth: (gdpPath[finalIndex] / gdpPath[finalIndex - 1] - 1) || BASELINE.realGDPGrowth,
    unemployment: finalUnemp,
    inflation: finalInflation,
    debtToGDP: finalDebtToGDP,
    deficitToGDP: finalDeficitToGDP,
    shock
  });

  return {
    years,
    gdpPath,
    unempPath,
    inflationPath,
    deficitPath,
    debtPath,
    finalGDP,
    finalUnemp,
    finalInflation,
    finalDeficitToGDP,
    finalDebtToGDP,
    tax,
    spend,
    indicators,
    shock
  };
}
