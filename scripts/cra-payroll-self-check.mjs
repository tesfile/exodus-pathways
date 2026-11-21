/**
 * Release gate: direct CRA T4127 2026 Alberta reference scenarios.
 * These tests exercise the same TypeScript module imported by Payroll preview.
 * Run: npm run test:payroll
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source=readFileSync(new URL("../lib/payroll/cra-2026-alberta.ts",import.meta.url),"utf8");
const emitted=ts.transpileModule(source,{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,strict:true},
 reportDiagnostics:true
});
const diagnostics=emitted.diagnostics??[];
assert.equal(diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,"TypeScript syntax/transpilation errors");
const sandbox={exports:{}};
// Test-only execution of trusted checked-in module; no external services or secrets.
new Function("module","exports",emitted.outputText)(sandbox,sandbox.exports);
const calc=sandbox.exports.calculate2026AlbertaRegularPay;

const base={
 payFrequency:"weekly",payDate:"2026-07-31",birthDate:"1986-01-01",
 cppExempt:false,eiExempt:false,federalTaxExempt:false,
 federalTd1:16452,albertaTd1:22769,additionalTax:0,
 ytd:{cpp:0,cpp2:0,ei:0,pensionable:0,insurable:0}
};
const sara=calc({...base,grossPay:685});
assert.equal(sara.cpp,36.75);
assert.equal(sara.ei,11.17);
assert.ok(Math.abs(sara.incomeTax-56.70)<0.30,
 "Exact T4127 wages should be close to CRA T4032 table midpoint illustration ($56.70)");
assert.ok(sara.netPay>0 && sara.totalPayrollCost>sara.grossPay);

const weekly=calc({...base,grossPay:1300});
assert.equal(weekly.cpp,73.35);
assert.equal(weekly.ei,21.19);

// CRA T4032AB: 2026 above-YMPE scenario, weekly $1,600,
// prior CPP $4,230.45, CPP2 $24, EI $1,123.07, pensionable YTD $75,200.
// Federal TD1 $16,452; Alberta TD1 $60,000; tax per week $210.18.
const high=calc({...base,grossPay:1600,albertaTd1:60000,
 ytd:{cpp:4230.45,cpp2:24,ei:1123.07,pensionable:75200,insurable:68900}});
assert.equal(high.cpp,0,"CPP first ceiling must stop at annual maximum");
assert.equal(high.cpp2,64,"CPP2 calculated from previously pensionable earnings");
assert.equal(high.ei,0,"EI already at annual maximum");
assert.ok(Math.abs(high.incomeTax-210.18)<0.02,
 "T4127 Option 1 should match CRA $210.18 above-YMPE example");

// Crossing the 2026 CPP2 threshold is 4% of the pensionable amount over $74,600.
const crossing=calc({...base,grossPay:1000,
 ytd:{cpp:4200,cpp2:0,ei:1000,pensionable:74400,insurable:68000}});
assert.equal(crossing.cpp2,32);
assert.ok(crossing.cpp<=30.45,"CPP must not exceed remaining annual cap");

// CPP starts in the month following turning 18; age 17 or earlier must not contribute.
const minor=calc({...base,grossPay:685,birthDate:"2009-09-10"});
assert.equal(minor.cpp,0);assert.equal(minor.cpp2,0);

// Reject unsupported fiscal years and invalid amounts.
assert.throws(()=>calc({...base,payDate:"2027-01-15",grossPay:685}),/2026/);
assert.throws(()=>calc({...base,grossPay:-1}),/Invalid/);
console.log("PASS: CRA 2026 Alberta CPP, CPP2, EI and tax examples; annual caps; age checks; invalid inputs.");
