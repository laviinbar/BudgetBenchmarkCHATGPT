// config.js
// All the "magic numbers" live here so you can tune the model without touching logic.

export const BASELINE = {
  yearGDP: 2884,        // £bn, stylised
  taxToGDP: 0.393,
  spendToGDP: 0.444,
  debtToGDP: 0.945,
  realGDPGrowth: 0.013, // 1.3%
  inflation: 0.02,
  unemployment: 0.045,
  interestRate: 0.045
};

export const TAX_SHARES = {
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

export const SPEND_SHARES = {
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

export const MODEL_PARAMS = {
  multiplierG: 1.2,
  multiplierT: 0.9,
  incomeElasticity: 0.8,
  corpElasticity: 0.7,
  vatElasticity: 0.9,
  nicElasticity: 0.9,
  cgtElasticity: 0.8,
  ihtElasticity: 0.7,
  shockProbBase: 0.4
};
