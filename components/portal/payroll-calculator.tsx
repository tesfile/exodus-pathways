"use client";

import { useState } from "react";

type PayrollCalculatorProps = {
  provinces: string[];
  defaultProvince: string;
  defaultPayDate: string;
  defaultGrossPay: number | string;
  defaultTd1FederalAmount: number | string;
  defaultTd1ProvincialAmount: number | string;
  defaultCppExempt: boolean;
  defaultEiExempt: boolean;
  defaultCpp: number | string;
  defaultEi: number | string;
  defaultIncomeTax: number | string;
  defaultNetPay: number | string;
  defaultEmployerCpp: number | string;
  defaultEmployerEi: number | string;
};

export function PayrollCalculator({
  provinces,
  defaultProvince,
  defaultPayDate,
  defaultGrossPay,
  defaultTd1FederalAmount,
  defaultTd1ProvincialAmount,
  defaultCppExempt,
  defaultEiExempt,
  defaultCpp,
  defaultEi,
  defaultIncomeTax,
  defaultNetPay,
  defaultEmployerCpp,
  defaultEmployerEi
}: PayrollCalculatorProps) {
  const [grossPay, setGrossPay] = useState(toInputValue(defaultGrossPay));
  const [cppExempt, setCppExempt] = useState(defaultCppExempt ? "Yes" : "No");
  const [eiExempt, setEiExempt] = useState(defaultEiExempt ? "Yes" : "No");
  const [cpp, setCpp] = useState(toInputValue(defaultCpp));
  const [ei, setEi] = useState(toInputValue(defaultEi));
  const [incomeTax, setIncomeTax] = useState(toInputValue(defaultIncomeTax));
  const [netPay, setNetPay] = useState(toInputValue(defaultNetPay));
  const [employerCpp, setEmployerCpp] = useState(toInputValue(defaultEmployerCpp));
  const [employerEi, setEmployerEi] = useState(toInputValue(defaultEmployerEi));

  function calculate() {
    const gross = Number(grossPay) || 0;
    const nextCpp = cppExempt === "No" ? roundMoney(gross * 0.0595) : 0;
    const nextEi = eiExempt === "No" ? roundMoney(gross * 0.0164) : 0;
    const nextIncomeTax = roundMoney(gross * 0.1);
    const nextEmployerEi = roundMoney(nextEi * 1.4);

    setCpp(toInputValue(nextCpp));
    setEi(toInputValue(nextEi));
    setIncomeTax(toInputValue(nextIncomeTax));
    setEmployerCpp(toInputValue(nextCpp));
    setEmployerEi(toInputValue(nextEmployerEi));
    setNetPay(toInputValue(roundMoney(gross - nextCpp - nextEi - nextIncomeTax)));
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <h4 className="text-base font-black text-exodus-navy">Payroll Calculator</h4>
      <p className="mt-1 text-sm font-bold text-red-700">Estimate only. Verify with CRA PDOC before filing or remitting.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <label className="grid gap-2">
          <span className="label">Province</span>
          <select name="calculatorProvince" className="field" defaultValue={defaultProvince}>
            {provinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="label">Pay date</span>
          <input name="calculatorPayDate" type="date" className="field" defaultValue={defaultPayDate} />
        </label>
        <MoneyInput name="calculatorGrossPay" label="Gross pay" value={grossPay} onChange={setGrossPay} />
        <label className="grid gap-2">
          <span className="label">TD1 federal amount</span>
          <input name="calculatorTd1FederalAmount" type="number" min="0" step="0.01" className="field" defaultValue={toInputValue(defaultTd1FederalAmount)} />
        </label>
        <label className="grid gap-2">
          <span className="label">TD1 provincial amount</span>
          <input name="calculatorTd1ProvincialAmount" type="number" min="0" step="0.01" className="field" defaultValue={toInputValue(defaultTd1ProvincialAmount)} />
        </label>
        <label className="grid gap-2">
          <span className="label">CPP exempt yes/no</span>
          <select name="calculatorCppExempt" className="field" value={cppExempt} onChange={(event) => setCppExempt(event.target.value)}>
            <option>No</option>
            <option>Yes</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="label">EI exempt yes/no</span>
          <select name="calculatorEiExempt" className="field" value={eiExempt} onChange={(event) => setEiExempt(event.target.value)}>
            <option>No</option>
            <option>Yes</option>
          </select>
        </label>
      </div>
      <div className="mt-4 rounded-md bg-exodus-light p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h5 className="text-sm font-black uppercase tracking-[0.12em] text-exodus-slate">Calculate estimate</h5>
          <button
            type="button"
            onClick={calculate}
            className="focus-ring min-h-10 rounded-md bg-exodus-navy px-4 text-sm font-black text-white"
          >
            Calculate
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <MoneyInput name="t4Box16" label="CPP box 16" value={cpp} onChange={setCpp} />
          <MoneyInput name="t4Box18" label="EI box 18" value={ei} onChange={setEi} />
          <MoneyInput name="t4Box22" label="Income tax deducted box 22" value={incomeTax} onChange={setIncomeTax} />
          <MoneyInput name="t4NetPay" label="Net pay" value={netPay} onChange={setNetPay} />
          <MoneyInput name="calculatorEmployerCpp" label="Employer CPP" value={employerCpp} onChange={setEmployerCpp} />
          <MoneyInput name="calculatorEmployerEi" label="Employer EI" value={employerEi} onChange={setEmployerEi} />
        </div>
      </div>
    </div>
  );
}

function MoneyInput({
  name,
  label,
  value,
  onChange
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="label">{label}</span>
      <input
        name={name}
        type="number"
        min="0"
        step="0.01"
        className="field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toInputValue(value: number | string) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue.toFixed(2) : "0.00";
}
