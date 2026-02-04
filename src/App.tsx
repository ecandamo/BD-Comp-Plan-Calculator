import React, { useEffect, useMemo, useRef, useState } from "react";

const uid = () => Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
const n = (v: any) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
const cl = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const money = (x: any) =>
  n(x).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const fmtI = (x: any) => Math.round(n(x)).toLocaleString();
const fmt$ = (x: any) =>
  n(x).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const parseRN = (s: string) => {
  const t = (s ?? "").toString().replace(/,/g, "").replace(/[^0-9.-]/g, "");
  const v = Number(t);
  return Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0;
};
const parseUSD = (s: string) => {
  const t = (s ?? "").toString().replace(/,/g, "").replace(/\$/g, "").replace(/[^0-9.\-]/g, "");
  const v = Number(t);
  return Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0;
};
const pct = (x: any) => `${(n(x) * 100).toFixed(2)}%`;
const addDays = (iso: string, d: number) => {
  if (!iso) return "";
  const x = new Date(`${iso}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + d);
  return x.toISOString().slice(0, 10);
};
const addYears = (iso: string, y: number) => {
  if (!iso) return "";
  const x = new Date(`${iso}T00:00:00Z`);
  x.setUTCFullYear(x.getUTCFullYear() + y);
  return x.toISOString().slice(0, 10);
};
const eom = (y: number, m0: number) => new Date(Date.UTC(y, m0 + 1, 0)).toISOString().slice(0, 10);
const safe = (x: any) => {
  const v = Number(x);
  return Number.isFinite(v) ? v : null;
};
const dclone = <T,>(o: T): T => {
  try {
    const g: any = globalThis as any;
    if (typeof g.structuredClone === "function") return g.structuredClone(o);
  } catch {}
  return JSON.parse(JSON.stringify(o));
};
const findBand = <T extends { min: any; max?: any }>(val: any, bands: T[]) => {
  const v = n(val);
  for (const b of bands) {
    const mn = n(b.min);
    const mx = b.max === undefined || b.max === null || b.max === "" ? null : n(b.max);
    if (v >= mn && (mx === null || v <= mx)) return b;
  }
  return null;
};

type CT = "NETWORK_GTA" | "SOURCING_ONLY" | "SD_ACCOUNT";
type LT = "AIRLINE_CREW" | "DPAX";
type PM = "AIRLINE_70_30" | "DPAX_50_50" | "SD_QUARTERLY";
type PS = "STANDARD" | "SCENARIO_1" | "SCENARIO_2" | "SCENARIO_3" | "SCENARIO_4";

type Contract = {
  id: string;
  name: string;
  type: CT;
  line: LT;
  termYears: number;
  projectedRoomNights: number;
  actualRoomNights: number | "";
  annualizedRevenue: number;
  bdShare: number;
  startDate: string;
  closeDate: string;
  payoutModel: PM;
  payoutScenario: PS;
  t4cAfterYear?: number;
};

type Acct = {
  id: string;
  name: string;
  managedBy: "AM" | "SD";
  projectedRevenue: number;
  actualRevenue: number;
  include: boolean;
  note?: string;
};

type EventRow = {
  date: string;
  amount: number;
  label: string;
  category: "Sign-on" | "Recurrent" | "SPIFF";
  source: string;
};

type NBand = { min: number; max: number | null; y2: number | null; y3: number | null; y4: number | null; y5: number | null; y6: number | null };
type SBand = { min: number; max: number | null; y1: number; y2: number; y3: number; y4: number; y5: number; y6: number };
type SdBand = { min: number; max: number | null; y1: number; y2: number; y3: number };

type Config = {
  m: { c1: number; c2: number; c3: number };
  net1: NBand[];
  net2: NBand[];
  net3: NBand[];
  src: SBand[];
  sd: SdBand[];
  rb: Array<{ min: number; max: number | null; bonus: number }>;
  rbCap: number;
  sp: { s1a: number; s1b: number; s2: number; s3: number; s3max: number; top: number };
};

type State = {
  planYear: number;
  quota: number;
  booked: number;
  kpiRN: number;
  kpiRev: number;
  contracts: Contract[];
  accts: Acct[];
  sp: { aTot: number; aDone: number; bTot: number; bDone: number; engDone: number; wkDone: number; all3: boolean };
};

const CFG0: Config = {
  m: { c1: 1, c2: 1.05, c3: 1.15 },
  net1: [
    { min: 1500001, max: null, y2: 0.009, y3: 0.014, y4: 0.022, y5: 0.03, y6: 0.037 },
    { min: 1000001, max: 1500000, y2: 0.017, y3: 0.029, y4: 0.044, y5: 0.06, y6: 0.074 },
    { min: 750001, max: 1000000, y2: 0.049, y3: 0.081, y4: 0.123, y5: 0.17, y6: 0.21 },
    { min: 500001, max: 750000, y2: 0.054, y3: 0.09, y4: 0.138, y5: 0.19, y6: 0.235 },
    { min: 250001, max: 500000, y2: 0.057, y3: 0.095, y4: 0.145, y5: 0.2, y6: 0.248 },
    { min: 100001, max: 250000, y2: 0.063, y3: 0.105, y4: 0.16, y5: 0.22, y6: 0.272 },
    { min: 50001, max: 100000, y2: 0.114, y3: 0.19, y4: 0.291, y5: 0.4, y6: 0.495 },
    { min: 0, max: 50000, y2: 0.186, y3: 0.31, y4: 0.472, y5: 0.65, y6: 0.805 }
  ],
  net2: [
    { min: 1500001, max: null, y2: 0.009, y3: 0.015, y4: 0.023, y5: 0.032, y6: 0.039 },
    { min: 1000001, max: 1500000, y2: 0.018, y3: 0.03, y4: 0.046, y5: 0.063, y6: 0.078 },
    { min: 750001, max: 1000000, y2: 0.051, y3: 0.085, y4: 0.129, y5: 0.179, y6: 0.221 },
    { min: 500001, max: 750000, y2: 0.057, y3: 0.095, y4: 0.145, y5: 0.2, y6: 0.247 },
    { min: 250001, max: 500000, y2: 0.06, y3: 0.1, y4: 0.152, y5: 0.21, y6: 0.26 },
    { min: 100001, max: 250000, y2: 0.066, y3: 0.11, y4: 0.168, y5: 0.231, y6: 0.286 },
    { min: 50001, max: 100000, y2: 0.12, y3: 0.2, y4: 0.306, y5: 0.42, y6: 0.52 },
    { min: 0, max: 50000, y2: 0.195, y3: 0.326, y4: 0.496, y5: 0.683, y6: 0.845 }
  ],
  net3: [
    { min: 1500001, max: null, y2: 0.01, y3: 0.016, y4: 0.025, y5: 0.035, y6: 0.043 },
    { min: 1000001, max: 1500000, y2: 0.02, y3: 0.033, y4: 0.051, y5: 0.069, y6: 0.085 },
    { min: 750001, max: 1000000, y2: 0.056, y3: 0.093, y4: 0.141, y5: 0.196, y6: 0.242 },
    { min: 500001, max: 750000, y2: 0.062, y3: 0.104, y4: 0.159, y5: 0.219, y6: 0.27 },
    { min: 250001, max: 500000, y2: 0.066, y3: 0.109, y4: 0.167, y5: 0.23, y6: 0.285 },
    { min: 100001, max: 250000, y2: 0.072, y3: 0.121, y4: 0.184, y5: 0.253, y6: 0.313 },
    { min: 50001, max: 100000, y2: 0.131, y3: 0.219, y4: 0.335, y5: 0.46, y6: 0.569 },
    { min: 0, max: 50000, y2: 0.214, y3: 0.357, y4: 0.543, y5: 0.748, y6: 0.926 }
  ],
  src: [
    { min: 250001, max: null, y1: 0.057, y2: 0.057, y3: 0.095, y4: 0.145, y5: 0.2, y6: 0.248 },
    { min: 100001, max: 250000, y1: 0.063, y2: 0.063, y3: 0.105, y4: 0.16, y5: 0.22, y6: 0.272 },
    { min: 50001, max: 100000, y1: 0.114, y2: 0.114, y3: 0.19, y4: 0.291, y5: 0.4, y6: 0.495 },
    { min: 20001, max: 50000, y1: 0.186, y2: 0.186, y3: 0.31, y4: 0.472, y5: 0.65, y6: 0.805 },
    { min: 0, max: 20000, y1: 0.7, y2: 1, y3: 1.1, y4: 1.2, y5: 1.3, y6: 1.4 }
  ],
  sd: [
    { min: 150001, max: null, y1: 0.057, y2: 0.0855, y3: 0.114 },
    { min: 100001, max: 150000, y1: 0.0713, y2: 0.1069, y3: 0.1425 },
    { min: 50001, max: 100000, y1: 0.075, y2: 0.1125, y3: 0.15 },
    { min: 0, max: 50000, y1: 0.1125, y2: 0.1688, y3: 0.225 }
  ],
  rb: [
    { min: 5500001, max: 6000000, bonus: 30950 },
    { min: 5000001, max: 5500000, bonus: 28450 },
    { min: 4900001, max: 5000000, bonus: 25950 },
    { min: 4800001, max: 4900000, bonus: 25452 },
    { min: 4700001, max: 4800000, bonus: 24948 },
    { min: 4600001, max: 4700000, bonus: 24444 },
    { min: 4500001, max: 4600000, bonus: 23940 },
    { min: 4400001, max: 4500000, bonus: 23436 },
    { min: 4300001, max: 4400000, bonus: 22932 },
    { min: 4200001, max: 4300000, bonus: 22428 },
    { min: 4100001, max: 4200000, bonus: 21924 },
    { min: 4000001, max: 4100000, bonus: 21420 },
    { min: 3900001, max: 4000000, bonus: 20916 },
    { min: 3800001, max: 3900000, bonus: 20412 },
    { min: 3700001, max: 3800000, bonus: 19908 },
    { min: 3600001, max: 3700000, bonus: 19404 },
    { min: 3500001, max: 3600000, bonus: 18900 },
    { min: 3400001, max: 3500000, bonus: 18396 },
    { min: 3300001, max: 3400000, bonus: 17892 },
    { min: 3200001, max: 3300000, bonus: 17388 },
    { min: 3100001, max: 3200000, bonus: 16884 },
    { min: 3000001, max: 3100000, bonus: 16380 },
    { min: 2900001, max: 3000000, bonus: 15876 },
    { min: 2800001, max: 2900000, bonus: 15372 },
    { min: 2700001, max: 2800000, bonus: 14868 },
    { min: 2600001, max: 2700000, bonus: 14364 },
    { min: 2500001, max: 2600000, bonus: 13860 },
    { min: 2400001, max: 2500000, bonus: 13356 },
    { min: 2300001, max: 2400000, bonus: 12852 },
    { min: 2200001, max: 2300000, bonus: 12348 },
    { min: 2100001, max: 2200000, bonus: 11844 },
    { min: 2000001, max: 2100000, bonus: 11340 },
    { min: 1900001, max: 2000000, bonus: 10836 },
    { min: 1800001, max: 1900000, bonus: 10332 },
    { min: 1700001, max: 1800000, bonus: 9828 },
    { min: 1600001, max: 1700000, bonus: 9324 },
    { min: 1500001, max: 1600000, bonus: 8820 },
    { min: 1400001, max: 1500000, bonus: 8316 },
    { min: 1300001, max: 1400000, bonus: 7812 },
    { min: 1200001, max: 1300000, bonus: 7308 },
    { min: 1100001, max: 1200000, bonus: 6804 },
    { min: 1000001, max: 1100000, bonus: 3600 },
    { min: 900001, max: 1000000, bonus: 5796 },
    { min: 800001, max: 900000, bonus: 5292 },
    { min: 700001, max: 800000, bonus: 4788 },
    { min: 600001, max: 700000, bonus: 4284 },
    { min: 500001, max: 600000, bonus: 3780 },
    { min: 400001, max: 500000, bonus: 3276 },
    { min: 300001, max: 400000, bonus: 2772 },
    { min: 200001, max: 300000, bonus: 2268 },
    { min: 100001, max: 200000, bonus: 1764 },
    { min: 60001, max: 100000, bonus: 1260 }
  ],
  rbCap: 30950,
  sp: { s1a: 500, s1b: 250, s2: 500, s3: 1250, s3max: 4, top: 5000 }
};

const S0: State = {
  planYear: 2026,
  quota: 50000,
  booked: 0,
  kpiRN: 0,
  kpiRev: 0,
  contracts: [
    {
      id: uid(),
      name: "Example Network GTA",
      type: "NETWORK_GTA",
      line: "AIRLINE_CREW",
      termYears: 4,
      projectedRoomNights: 100000,
      actualRoomNights: 100000,
      annualizedRevenue: 0,
      bdShare: 1,
      startDate: "2026-02-01",
      closeDate: "2026-01-15",
      payoutModel: "AIRLINE_70_30",
      payoutScenario: "STANDARD",
      t4cAfterYear: 2
    }
  ],
  accts: [
    { id: uid(), name: "Example Covered Account", managedBy: "AM", projectedRevenue: 3000000, actualRevenue: 3000000, include: true, note: "" }
  ],
  sp: { aTot: 10, aDone: 0, bTot: 5, bDone: 0, engDone: 0, wkDone: 0, all3: false }
};

export const computeQuotaFactor = (booked: any, quota: any) => {
  const b = n(booked),
    q = n(quota);
  if (q <= 0) return { achievement: 0, factor: 0.7, note: "Set a quota" };
  const a = b / q;
  return a < 1
    ? { achievement: a, factor: Math.max(0.7, a), note: "Floor 70%" }
    : { achievement: a, factor: Math.min(1.05, a), note: "Cap 105%" };
};

const bandPortion = (total: number, minv: any, maxv: any) => {
  const rn = n(total),
    mn = n(minv),
    mx = maxv === undefined || maxv === null || maxv === "" ? null : n(maxv);
  const lo = mn <= 0 ? 0 : mn - 1;
  const hi = mx === null ? rn : mx;
  return Math.max(0, Math.min(rn, hi) - lo);
};
const tierSum = (bands: any[], rn: number, key: string) => {
  let tot = 0;
  const bs = [...bands].sort((a, b) => n(a.min) - n(b.min));
  for (const b of bs) {
    const r = safe(b[key]);
    if (r === null) continue;
    const p = bandPortion(rn, b.min, b.max);
    if (p > 0) tot += p * r;
  }
  return tot > 0 ? tot : null;
};
const netKey = (y: number) => (y === 2 ? "y2" : y === 3 ? "y3" : y === 4 ? "y4" : y === 5 ? "y5" : "y6");
const srcKey = (y: number) => (y === 1 ? "y1" : y === 2 ? "y2" : y === 3 ? "y3" : y === 4 ? "y4" : y === 5 ? "y5" : "y6");
const sdRate = (cfg: Config, rev: number, yrs: number) => {
  const b = findBand(rev, cfg.sd);
  if (!b) return null;
  const k = yrs === 1 ? "y1" : yrs === 2 ? "y2" : "y3";
  return safe((b as any)[k]);
};
const mult = (cfg: Config, rank: number | null) => (!rank || rank <= 1 ? cfg.m.c1 : rank === 2 ? cfg.m.c2 : cfg.m.c3);

export const computeContractSignOnTotal = (cfg: Config, c: Contract, rank: number | null) => {
  const share = cl(n(c.bdShare), 0, 1);
  if (c.type === "SD_ACCOUNT") {
    const yrs = cl(n(c.termYears), 1, 3);
    const r = sdRate(cfg, n(c.annualizedRevenue), yrs);
    if (r === null) return { total: 0, warnings: ["Missing SD rate"] };
    return { total: n(c.annualizedRevenue) * r * share, warnings: [] };
  }
  const yrs = cl(n(c.termYears), 1, 10);
  const rn = n(c.projectedRoomNights);
  if (c.type === "SOURCING_ONLY") {
    const t = tierSum(cfg.src, rn, srcKey(yrs >= 6 ? 6 : yrs));
    if (t === null) return { total: 0, warnings: ["Missing sourcing rate"] };
    return { total: t * mult(cfg, rank) * share, warnings: [] };
  }
  const bands = rank === 2 ? cfg.net2 : rank === 3 ? cfg.net3 : cfg.net1;
  const t = tierSum(bands, rn, netKey(yrs >= 6 ? 6 : yrs));
  if (t === null) return { total: 0, warnings: ["Missing network rate"] };
  return { total: t * share, warnings: [] };
};

export const computeContractTiming = (cfg: Config, c: Contract, rank: number | null, sign: number) => {
  const start = c.startDate;
  if (c.type === "SD_ACCOUNT" || c.payoutModel === "SD_QUARTERLY") {
    const cd = c.closeDate ? new Date(`${c.closeDate}T00:00:00Z`) : null;
    if (!cd) return [{ date: "", amount: sign, label: "SD Sign-On (set close date)" }];
    const y = cd.getUTCFullYear(),
      m = cd.getUTCMonth() + 1;
    let py = y,
      pm0 = 0;
    if (m >= 7 && m <= 9) {
      py = y + 1;
      pm0 = 0;
    } else if (m >= 10 && m <= 12) {
      py = y + 1;
      pm0 = 3;
    } else if (m >= 1 && m <= 3) {
      py = y;
      pm0 = 6;
    } else {
      py = y;
      pm0 = 9;
    }
    return [{ date: eom(py, pm0), amount: sign, label: "SD sign-on (quarterly)" }];
  }
  const model = c.payoutModel || (c.line === "DPAX" ? "DPAX_50_50" : "AIRLINE_70_30");
  const scen = c.payoutScenario || "STANDARD";
  const isD = model === "DPAX_50_50";
  const termTotal = (yrs: number) => computeContractSignOnTotal(cfg, { ...c, termYears: yrs }, rank).total;
  if (scen === "SCENARIO_1") {
    const t = termTotal(5);
    return [
      { date: addDays(start, 30), amount: (isD ? 0.5 : 0.7) * t, label: "Sign-On (start)" },
      { date: addYears(start, 1), amount: (isD ? 0.5 : 0.3) * t, label: "Sign-on (anniversary)" }
    ];
  }
  if (scen === "SCENARIO_2") {
    const t2 = termTotal(2),
      t5 = termTotal(5);
    const p1 = (isD ? 0.5 : 0.7) * t2,
      p2 = (isD ? 0.5 : 0.3) * t2,
      prev = p1 + p2,
      rem = t5 - prev;
    return [
      { date: addDays(start, 30), amount: p1, label: "Sign-on (initial)" },
      { date: addYears(start, 1), amount: p2, label: "Sign-on (anniversary)" },
      { date: addYears(start, 3), amount: rem / 2, label: "Extension True-Up (year 4)" },
      { date: addYears(start, 4), amount: rem / 2, label: "Extension true-up (year 5)" }
    ];
  }
  if (scen === "SCENARIO_3") {
    const min = c.type === "NETWORK_GTA" ? 2 : 1;
    const base = cl(n(c.t4cAfterYear ?? 2), min, 4);
    const tb = termTotal(base);
    const p1 = (isD ? 0.5 : 0.7) * tb,
      p2 = (isD ? 0.5 : 0.3) * tb;
    let prev = p1 + p2;
    const ev = [
      { date: addDays(start, 30), amount: p1, label: `Sign-on (Based On ${base}y)` },
      { date: addYears(start, 1), amount: p2, label: `Sign-on (based on ${base}y)` }
    ];
    for (let ty = Math.max(3, base + 1); ty <= 5; ty++) {
      const t = termTotal(ty);
      ev.push({ date: addYears(start, ty - 1), amount: t - prev, label: `True-Up to ${ty}-year payout` });
      prev = t;
    }
    return ev;
  }
  if (scen === "SCENARIO_4") {
    const t3 = termTotal(3),
      t4 = termTotal(4),
      t5 = termTotal(5);
    const p1 = (isD ? 0.5 : 0.7) * t3,
      p2 = (isD ? 0.5 : 0.3) * t3;
    const prev = p1 + p2;
    return [
      { date: addDays(start, 30), amount: p1, label: "Sign-on (based on 3y)" },
      { date: addYears(start, 1), amount: p2, label: "Sign-on (based on 3y)" },
      { date: addYears(start, 3), amount: t4 - prev, label: "True-up to 4-year payout" },
      { date: addYears(start, 4), amount: t5 - t4, label: "True-up to 5-year payout" }
    ];
  }
  const proj = n(c.projectedRoomNights),
    act = c.actualRoomNights === "" ? proj : n(c.actualRoomNights),
    adj = proj > 0 ? act / proj : 1;
  if (isD)
    return [
      { date: addDays(start, 30), amount: 0.5 * sign, label: "Sign-on (50% on start)" },
      { date: addYears(start, 1), amount: 0.5 * sign * adj, label: "Sign-on (50% after 1st anniversary, adjusted)" }
    ];
  return [
    { date: addDays(start, 30), amount: 0.7 * sign, label: "Sign-on (70% on start)" },
    { date: addYears(start, 1), amount: 0.3 * sign * adj, label: "Sign-on (30% after 1st anniversary, adjusted)" }
  ];
};

export const attemptClipboardWrite = async (
  text: string,
  writer?: { writeText: (t: string) => Promise<void> } | null,
  execCopy?: ((t: string) => boolean) | null
) => {
  const w = writer ?? (typeof navigator !== "undefined" ? navigator.clipboard : null);
  try {
    if (w?.writeText) {
      await w.writeText(text);
      return true;
    }
  } catch {}
  const ex =
    execCopy ??
    ((t: string) => {
      try {
        const ta = document.createElement("textarea");
        ta.value = t;
        ta.setAttribute("readonly", "true");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        ta.style.top = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = typeof document.execCommand === "function" && document.execCommand("copy");
        document.body.removeChild(ta);
        return !!ok;
      } catch {
        return false;
      }
    });
  try {
    return !!ex(text);
  } catch {
    return false;
  }
};

export const buildPayoutCSV = (rows: EventRow[]) => {
  const NL = String.fromCharCode(10),
    CR = String.fromCharCode(13);
  const esc = (v: any) => {
    const s = (v ?? "").toString();
    const needs = s.includes(",") || s.includes('"') || s.includes(NL) || s.includes(CR);
    const out = s.replace(/"/g, '""');
    return needs ? `"${out}"` : out;
  };
  const amt = (x: any) => {
    const v = n(x);
    const r = Math.round(v * 100) / 100;
    return String(r);
  };
  const head = ["Date", "Category", "Source", "Label", "Amount"].join(",");
  const lines = rows.map((r) => [esc(r.date || "(No Date)"), esc(r.category || ""), esc(r.source || ""), esc(r.label || ""), amt(r.amount)].join(","));
  return [head, ...lines].join(NL);
};

const S = {
  wrap: { minHeight: "100vh", background: "var(--bg)", color: "var(--text)" },
  box: { border: "1px solid var(--border)", borderRadius: 16, padding: 12, background: "var(--surface)" },
  pill: { padding: "6px 10px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--pill)" },
  inp: { width: "100%", padding: "8px 10px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" },
  btn: { padding: "8px 10px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontWeight: 600 }
};
const Card = ({ t, r, c }: { t: string; r?: any; c: any }) => (
  <div style={S.box}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
      <div style={{ fontWeight: 800 }}>{t}</div>
      {r || null}
    </div>
    <div style={{ marginTop: 10 }}>{c}</div>
  </div>
);
const Field = ({ l, children }: { l: string; children: any }) => (
  <label style={{ display: "block" }}>
    <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 4 }}>{l}</div>
    {children}
  </label>
);
const Btn = ({ on, children, active }: { on: () => void; children: any; active?: boolean }) => {
  const [h, setH] = useState(false);
  const onv = active || h;
  return (
    <button
      onClick={on}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        ...S.btn,
        cursor: "pointer",
        background: onv ? "var(--accent)" : "var(--surface)",
        color: onv ? "var(--accent-contrast)" : "var(--text)",
        borderColor: onv ? "var(--accent)" : "var(--border)"
      }}
    >
      {children}
    </button>
  );
};
const Sel = ({ v, set, children }: { v: any; set: (x: any) => void; children: any }) => (
  <select value={v} onChange={(e) => set(e.target.value)} style={S.inp}>
    {children}
  </select>
);
const Num = ({ v, set, step = 1, min }: { v: any; set: (x: number) => void; step?: number; min?: number }) => (
  <input type="number" value={Number.isFinite(v) ? v : 0} step={step} min={min} onChange={(e) => set(Number(e.target.value))} style={S.inp} />
);
const RN = ({ v, set }: { v: number; set: (x: number) => void }) => {
  const [f, setF] = useState(false);
  const [t, setT] = useState(String(v ?? 0));
  useEffect(() => {
    if (!f) setT(String(v ?? 0));
  }, [v, f]);
  return (
    <input
      type="text"
      inputMode="numeric"
      value={f ? t : fmtI(v)}
      onFocus={() => {
        setF(true);
        setT(String(v ?? 0));
      }}
      onBlur={() => setF(false)}
      onChange={(e) => {
        const raw = e.target.value;
        setT(raw);
        set(parseRN(raw));
      }}
      style={S.inp}
    />
  );
};
const RNBlank = ({ v, set }: { v: number | ""; set: (x: number | "") => void }) => {
  const [f, setF] = useState(false);
  const [t, setT] = useState(v === "" ? "" : String(v));
  useEffect(() => {
    if (!f) setT(v === "" ? "" : String(v));
  }, [v, f]);
  return (
    <input
      type="text"
      inputMode="numeric"
      value={f ? t : v === "" ? "" : fmtI(v)}
      onFocus={() => {
        setF(true);
        setT(v === "" ? "" : String(v));
      }}
      onBlur={() => setF(false)}
      onChange={(e) => {
        const raw = e.target.value;
        setT(raw);
        if (raw.trim() === "") set("");
        else set(parseRN(raw));
      }}
      style={S.inp}
    />
  );
};
const USD = ({ v, set }: { v: number; set: (x: number) => void }) => {
  const [f, setF] = useState(false);
  const [t, setT] = useState(String(v ?? 0));
  useEffect(() => {
    if (!f) setT(String(v ?? 0));
  }, [v, f]);
  return (
    <input
      type="text"
      inputMode="decimal"
      value={f ? t : fmt$(v)}
      onFocus={() => {
        setF(true);
        setT(String(v ?? 0));
      }}
      onBlur={() => setF(false)}
      onChange={(e) => {
        const raw = e.target.value;
        setT(raw);
        set(parseUSD(raw));
      }}
      style={S.inp}
    />
  );
};
const PctIn = ({ v, set }: { v: number; set: (x: number) => void }) => {
  const val = cl(n(v) * 100, 0, 100);
  return (
    <input
      type="number"
      value={Number.isFinite(val) ? val : 0}
      min={0}
      max={100}
      step={0.1}
      onChange={(e) => {
        const x = cl(Number(e.target.value), 0, 100);
        set(x / 100);
      }}
      style={S.inp}
    />
  );
};

function AppInner() {
  const [tab, setTab] = useState<"INPUTS" | "RESULTS" | "SETTINGS">("INPUTS");
  const [cfg, setCfg] = useState<Config>(() => dclone(CFG0));
  const [s, setS] = useState<State>(() => dclone(S0));
  const quota = useMemo(() => computeQuotaFactor(s.booked, s.quota), [s.booked, s.quota]);
  const kpiOk = useMemo(() => n(s.kpiRN) >= 50000 || n(s.kpiRev) >= 500000, [s.kpiRN, s.kpiRev]);

  const cRank = useMemo(() => {
    const el = s.contracts.filter((c) => c.type !== "SD_ACCOUNT").map((c) => ({ ...c, v: n(c.projectedRoomNights) }));
    const so = [...el].sort((a, b) => b.v - a.v);
    const m = new Map<string, number>();
    so.forEach((c, i) => m.set(c.id, i + 1));
    return s.contracts.map((c) => ({ ...c, rank: m.get(c.id) ?? null }));
  }, [s.contracts]);

  const signOn = useMemo(() => {
    const rows = cRank.map((c: any) => {
      const r = computeContractSignOnTotal(cfg, c, c.rank);
      return { ...c, sign: r.total, warn: r.warnings };
    });
    const pre = rows.reduce((a: number, r: any) => a + n(r.sign), 0),
      after = pre * quota.factor;
    const ev: EventRow[] = [];
    for (const r of rows as any[]) {
      for (const x of computeContractTiming(cfg, r, r.rank, n(r.sign))) ev.push({ date: x.date, amount: x.amount, label: x.label, category: "Sign-on", source: r.name });
    }
    const adj = after - pre;
    if (n(adj) !== 0) {
      const adjLabel = adj < 0 ? "Quota not met" : "Quota Exceded";
      ev.push({ date: `${s.planYear}-12-31`, amount: adj, label: adjLabel, category: "Sign-on", source: "Quota Achievement" });
    }
    return { rows, pre, after, ev };
  }, [cRank, cfg, quota.factor, s.planYear]);

  const recurrent = useMemo(() => {
    const rows = s.accts
      .filter((a) => a.include)
      .map((a) => {
        const sh = a.managedBy === "SD" ? 0.5 : 1;
        const pb = findBand(a.projectedRevenue, cfg.rb),
          ab = findBand(a.actualRevenue, cfg.rb);
        const pRaw = pb ? n((pb as any).bonus) : 0,
          aRaw = ab ? n((ab as any).bonus) : 0;
        const p = Math.min(pRaw, cfg.rbCap) * sh,
          act = Math.min(aRaw, cfg.rbCap) * sh;
        return { ...a, sh, p, act };
      });
    const pTot = rows.reduce((t: number, r: any) => t + n(r.p), 0),
      aTot = rows.reduce((t: number, r: any) => t + n(r.act), 0);
    const q3 = kpiOk ? 0.25 * pTot : 0,
      q1 = kpiOk ? aTot - q3 : 0;
    const ev: EventRow[] = [];
    if (kpiOk) {
      if (n(q3)) ev.push({ date: `${s.planYear}-09-30`, amount: q3, label: "Recurrent (25% Projected)", category: "Recurrent", source: "Covered Accounts" });
      if (n(q1)) ev.push({ date: `${s.planYear + 1}-03-31`, amount: q1, label: "Recurrent True-Up", category: "Recurrent", source: "Covered Accounts" });
    }
    return { rows, pTot, aTot, kpiOk, q3, q1, ev };
  }, [s.accts, cfg.rb, cfg.rbCap, s.planYear, kpiOk]);

  const spiff = useMemo(() => {
    const x = s.sp,
      sp = cfg.sp;
    const s1 = n(x.aDone) * sp.s1a + n(x.bDone) * sp.s1b;
    const thr = Math.ceil(0.5 * n(x.aTot));
    const s2ok = n(x.engDone) >= thr && thr > 0;
    const s2 = s2ok ? n(x.engDone) * sp.s2 : 0;
    const wk = cl(n(x.wkDone), 0, sp.s3max),
      s3ok = wk >= sp.s3max,
      s3 = s3ok ? wk * sp.s3 : 0,
      top = x.all3 ? sp.top : 0,
      tot = s1 + s2 + s3 + top;
    const ev: EventRow[] = [];
    if (n(s1)) ev.push({ date: `${s.planYear}-06-30`, amount: s1, label: "SPIFF 1", category: "SPIFF", source: "SPIFF" });
    if (n(s2)) ev.push({ date: `${s.planYear}-09-30`, amount: s2, label: "SPIFF 2", category: "SPIFF", source: "SPIFF" });
    if (n(s3)) ev.push({ date: `${s.planYear}-12-31`, amount: s3, label: "SPIFF 3", category: "SPIFF", source: "SPIFF" });
    if (n(top)) ev.push({ date: `${s.planYear + 1}-01-31`, amount: top, label: "SPIFF Completion Top-Up", category: "SPIFF", source: "SPIFF" });
    return { s1, s2, s2ok, s3, s3ok, top, tot, thr, ev };
  }, [s.sp, cfg.sp, s.planYear]);

  const events = useMemo(
    () => [...signOn.ev, ...recurrent.ev, ...spiff.ev].filter((e) => n(e.amount) !== 0).sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999")),
    [signOn.ev, recurrent.ev, spiff.ev]
  );
  const totals = useMemo(() => {
    const rec = recurrent.kpiOk ? recurrent.aTot : 0;
    return { pre: signOn.pre, after: signOn.after, rec, sp: spiff.tot, all: signOn.after + rec + spiff.tot };
  }, [signOn.pre, signOn.after, recurrent.aTot, recurrent.kpiOk, spiff.tot]);

  const setState = (p: Partial<State>) => setS((s0) => ({ ...s0, ...p }));
  const setContract = (id: string, p: Partial<Contract>) => setS((s0) => ({ ...s0, contracts: s0.contracts.map((c) => (c.id === id ? { ...c, ...p } : c)) }));
  const delContract = (id: string) => setS((s0) => ({ ...s0, contracts: s0.contracts.filter((c) => c.id !== id) }));
  const addContract = () =>
    setS((s0) => ({
      ...s0,
      contracts: [
        ...s0.contracts,
        {
          id: uid(),
          name: "New Contract",
          type: "NETWORK_GTA",
          line: "AIRLINE_CREW",
          termYears: 4,
          projectedRoomNights: 50000,
          actualRoomNights: 50000,
          annualizedRevenue: 0,
          bdShare: 1,
          startDate: `${s0.planYear}-01-01`,
          closeDate: `${s0.planYear}-01-01`,
          payoutModel: "AIRLINE_70_30",
          payoutScenario: "STANDARD",
          t4cAfterYear: 2
        }
      ]
    }));
  const setAcct = (id: string, p: Partial<Acct>) => setS((s0) => ({ ...s0, accts: s0.accts.map((a) => (a.id === id ? { ...a, ...p } : a)) }));
  const delAcct = (id: string) => setS((s0) => ({ ...s0, accts: s0.accts.filter((a) => a.id !== id) }));
  const addAcct = () =>
    setS((s0) => ({
      ...s0,
      accts: [...s0.accts, { id: uid(), name: "New Covered Account", managedBy: "AM", projectedRevenue: 0, actualRevenue: 0, include: true, note: "" }]
    }));

  const snap = useMemo(() => JSON.stringify({ cfg, s }, null, 2), [cfg, s]);
  const [j, setJ] = useState(snap);
  useEffect(() => setJ(snap), [snap]);
  const [copyMsg, setCopyMsg] = useState<string | "">("");
  const [csvText, setCsvText] = useState<string>("");
  const [showCsv, setShowCsv] = useState(false);
  const csvRef = useRef<HTMLTextAreaElement | null>(null);
  const settingsRef = useRef<HTMLTextAreaElement | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch {}
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);
  const doCopy = async () => {
    const txt = JSON.stringify({ cfg, s }, null, 2);
    const ok = await attemptClipboardWrite(txt);
    if (ok) {
      setCopyMsg("Copied");
      setTimeout(() => setCopyMsg(""), 1200);
    } else {
      setCopyMsg("Clipboard blocked — copy from Settings JSON.");
      setTab("SETTINGS");
      setTimeout(() => {
        try {
          settingsRef.current?.focus();
          settingsRef.current?.select();
        } catch {}
      }, 0);
      setTimeout(() => setCopyMsg(""), 2500);
    }
  };
  const showCSV = () => {
    try {
      setCsvText(buildPayoutCSV(events));
      setShowCsv(true);
    } catch {}
  };
  const selectCSV = () => {
    try {
      csvRef.current?.focus();
      csvRef.current?.select();
    } catch {}
  };
  const apply = () => {
    try {
      const p = JSON.parse(j);
      if (p?.cfg) setCfg(p.cfg);
      if (p?.s) setS(p.s);
      setCopyMsg("Applied");
      setTimeout(() => setCopyMsg(""), 1200);
    } catch {
      setCopyMsg("Invalid JSON");
      setTimeout(() => setCopyMsg(""), 2000);
    }
  };

  return (
    <div style={S.wrap}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>BD Team Comp Plan (2026)</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <Btn on={() => setTab("INPUTS")} active={tab === "INPUTS"}>
              Inputs
            </Btn>
            <Btn on={() => setTab("RESULTS")} active={tab === "RESULTS"}>
              Results
            </Btn>
            <Btn on={() => setTab("SETTINGS")} active={tab === "SETTINGS"}>
              Settings
            </Btn>
            <Btn on={() => void doCopy()}>Copy JSON</Btn>
            {copyMsg ? <div style={{ ...S.pill, background: "var(--surface)", fontSize: 12, fontWeight: 800 }}>{copyMsg}</div> : null}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 8px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                cursor: "pointer"
              }}
            >
              <span style={{ fontSize: 14 }}>{theme === "dark" ? "🌙" : "☀️"}</span>
              <span
                style={{
                  width: 34,
                  height: 18,
                  borderRadius: 999,
                  background: "var(--pill)",
                  border: "1px solid var(--border)",
                  position: "relative"
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 1,
                    left: theme === "dark" ? 17 : 1,
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    transition: "left 160ms ease"
                  }}
                />
              </span>
            </button>
          </div>
        </div>

        {tab === "INPUTS" ? (
          <div style={{ display: "grid", gap: 12 }}>
            {Card({
              t: "Plan Controls",
              c: (
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
                    <Field l="Plan Year">
                      <Num v={s.planYear} set={(v) => setState({ planYear: v })} />
                    </Field>
                  </div>
                  <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
                    <div style={S.box}>
                      <div style={{ fontWeight: 800, marginBottom: 8 }}>Quota Achievement</div>
                      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
                        <Field l="Quota Room Nights">
                          <RN v={s.quota} set={(v) => setState({ quota: v })} />
                        </Field>
                        <Field l="Booked New Room Nights">
                          <RN v={s.booked} set={(v) => setState({ booked: v })} />
                        </Field>
                      </div>
                      <div style={{ marginTop: 10, fontSize: 13, display: "grid", gap: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ opacity: 0.7 }}>Achievement</span>
                          <b>{pct(quota.achievement)}</b>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ opacity: 0.7 }}>Factor</span>
                          <b>{pct(quota.factor)}</b>
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>{quota.note}</div>
                      </div>
                    </div>

                    <div style={S.box}>
                      <div style={{ fontWeight: 800, marginBottom: 8 }}>KPI Gate</div>
                      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
                        <Field l="KPI: New Annualized Room Nights">
                          <RN v={s.kpiRN} set={(v) => setState({ kpiRN: v })} />
                        </Field>
                        <Field l="KPI: New Annualized Revenue">
                          <USD v={s.kpiRev} set={(v) => setState({ kpiRev: v })} />
                        </Field>
                      </div>
                      <div style={{ marginTop: 10, fontSize: 13, display: "grid", gap: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ opacity: 0.7 }}>KPI</span>
                          <b>{kpiOk ? "Eligible" : "Not Eligible"}</b>
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                          Eligibility requires either 50,000 new client annualized room nights/trips or $500,000 in new client annualized revenue (any line of business).
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {Card({
              t: "Contracts (Sign-On)",
              r: <Btn on={addContract}>Add Contract</Btn>,
              c: (
                <div style={{ display: "grid", gap: 12 }}>
                  {cRank.map((c: any) => {
                    const isSD = c.type === "SD_ACCOUNT";
                    const minT = c.type === "NETWORK_GTA" ? 2 : 1;
                    const r = computeContractSignOnTotal(cfg, c, c.rank ?? null);
                    const pre = r.total,
                      after = pre * quota.factor;
                    const timing = computeContractTiming(cfg, c, c.rank ?? null, pre);
                    return (
                      <div key={c.id} style={S.box}>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                          <input value={c.name} onChange={(e) => setContract(c.id, { name: e.target.value })} style={{ ...S.inp, flex: "1 1 260px", fontWeight: 800 }} />
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            <div style={S.pill}>
                              <span style={{ opacity: 0.7 }}>Before Quota:</span> <b>{money(pre)}</b>
                            </div>
                            <div style={S.pill}>
                              <span style={{ opacity: 0.7 }}>After Quota:</span> <b>{money(after)}</b>
                            </div>
                            <Btn on={() => delContract(c.id)}>Remove</Btn>
                          </div>
                        </div>
                        {r.warnings?.length ? <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>{r.warnings.join(" · ")}</div> : null}

                        <div style={{ marginTop: 10, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
                          <Field l="Contract Type">
                            <Sel
                              v={c.type}
                              set={(v: CT) => {
                                const p: any = { type: v };
                                if (v === "SD_ACCOUNT") {
                                  p.payoutModel = "SD_QUARTERLY";
                                  p.payoutScenario = "STANDARD";
                                } else if (c.payoutModel === "SD_QUARTERLY") {
                                  p.payoutModel = "AIRLINE_70_30";
                                }
                                setContract(c.id, p);
                              }}
                            >
                              <option value="NETWORK_GTA">Network GTA</option>
                              <option value="SOURCING_ONLY">Sourcing-Only Network</option>
                              <option value="SD_ACCOUNT">SD Account</option>
                            </Sel>
                          </Field>
                          {!isSD ? (
                            <Field l="Business Line">
                              <Sel v={c.line} set={(v: LT) => setContract(c.id, { line: v })}>
                                <option value="AIRLINE_CREW">Crew</option>
                                <option value="DPAX">DPAX</option>
                              </Sel>
                            </Field>
                          ) : (
                            <div />
                          )}
                          <Field l="Term Years">
                            <Num v={c.termYears} set={(v) => setContract(c.id, { termYears: v })} min={1} />
                          </Field>
                          {!isSD ? (
                            <>
                              <Field l="Projected Room Nights">
                                <RN v={c.projectedRoomNights} set={(v) => setContract(c.id, { projectedRoomNights: v })} />
                              </Field>
                              <Field l="Actual Room Nights">
                                <RNBlank v={c.actualRoomNights} set={(v) => setContract(c.id, { actualRoomNights: v })} />
                              </Field>
                              <div />
                            </>
                          ) : (
                            <>
                              <Field l="Annualized Revenue">
                                <USD v={c.annualizedRevenue} set={(v) => setContract(c.id, { annualizedRevenue: v })} />
                              </Field>
                              <div />
                              <div />
                            </>
                          )}
                          <Field l="BD Share (%)">
                            <PctIn v={c.bdShare} set={(v) => setContract(c.id, { bdShare: v })} />
                          </Field>
                          <Field l="Contract Execution Date">
                            <input type="date" value={c.startDate} onChange={(e) => setContract(c.id, { startDate: e.target.value })} style={S.inp} />
                          </Field>
                          <Field l="Close Date">
                            <input type="date" value={c.closeDate} onChange={(e) => setContract(c.id, { closeDate: e.target.value })} style={S.inp} />
                          </Field>
                          {!isSD ? (
                            <Field l="Payout Model">
                              <Sel v={c.payoutModel} set={(v: PM) => setContract(c.id, { payoutModel: v })}>
                                <option value="AIRLINE_70_30">Crew (70/30)</option>
                                <option value="DPAX_50_50">DPAX (50/50)</option>
                              </Sel>
                            </Field>
                          ) : (
                            <div />
                          )}
                          {!isSD ? (
                            <Field l="Payout Scenario">
                              <Sel v={c.payoutScenario} set={(v: PS) => setContract(c.id, { payoutScenario: v })}>
                                <option value="STANDARD">Standard</option>
                                <option value="SCENARIO_1">Scenario 1</option>
                                <option value="SCENARIO_2">Scenario 2</option>
                                <option value="SCENARIO_3">Scenario 3</option>
                                <option value="SCENARIO_4">Scenario 4</option>
                              </Sel>
                            </Field>
                          ) : (
                            <div />
                          )}
                          {!isSD && c.payoutScenario === "SCENARIO_3" ? (
                            <Field l="T4C After Year">
                              <Sel v={String(c.t4cAfterYear ?? minT)} set={(v: any) => setContract(c.id, { t4cAfterYear: Number(v) })}>
                                <option value="1" disabled={minT > 1}>
                                  T4C After Year 1
                                </option>
                                <option value="2" disabled={minT > 2}>
                                  T4C after year 2
                                </option>
                                <option value="3">T4C after year 3</option>
                                <option value="4">T4C after year 4</option>
                              </Sel>
                            </Field>
                          ) : (
                            <div />
                          )}
                        </div>

                        <div style={{ marginTop: 10, ...S.box, background: "var(--surface-alt)" }}>
                          <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.8 }}>Timing Preview</div>
                          <div style={{ marginTop: 8, display: "grid", gap: 6, gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
                            {timing.map((t: any, i: number) => (
                              <div
                                key={i}
                                style={{ display: "flex", justifyContent: "space-between", gap: 10, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "8px 10px", fontSize: 13 }}
                              >
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <b>{t.date || "(No Date)"}</b> <span style={{ opacity: 0.7 }}>{t.label}</span>
                                </div>
                                <div>
                                  <b>{money(t.amount)}</b>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            })}

            {Card({
              t: "Covered Accounts (Recurrent)",
              r: <Btn on={addAcct}>Add Account</Btn>,
              c: (
                <div style={{ display: "grid", gap: 8 }}>
                  <div
                    style={{
                      display: "grid",
                      gap: 8,
                      gridTemplateColumns: "110px 1fr 140px 160px 160px 1fr 110px",
                      alignItems: "center",
                      fontSize: 12,
                      fontWeight: 400,
                      opacity: 0.75
                    }}
                  >
                    <div />
                    <div>Account Name</div>
                    <div>Managed By</div>
                    <div>Projected Revenue</div>
                    <div>Actual Revenue</div>
                    <div>Notes</div>
                    <div />
                  </div>
                  {s.accts.map((a) => (
                    <div key={a.id} style={{ display: "grid", gap: 8, gridTemplateColumns: "110px 1fr 140px 160px 160px 1fr 110px", alignItems: "center" }}>
                      <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>
                        <input type="checkbox" checked={a.include} onChange={(e) => setAcct(a.id, { include: e.target.checked })} /> include
                      </label>
                      <input aria-label="Account Name" value={a.name} onChange={(e) => setAcct(a.id, { name: e.target.value })} style={S.inp} />
                      <Sel v={a.managedBy} set={(v: any) => setAcct(a.id, { managedBy: v })}>
                        <option value="AM">AM</option>
                        <option value="SD">SD</option>
                      </Sel>
                      <USD v={a.projectedRevenue} set={(v) => setAcct(a.id, { projectedRevenue: v })} />
                      <USD v={a.actualRevenue} set={(v) => setAcct(a.id, { actualRevenue: v })} />
                      <input aria-label="Notes" value={a.note || ""} onChange={(e) => setAcct(a.id, { note: e.target.value })} style={S.inp} />
                      <Btn on={() => delAcct(a.id)}>Remove</Btn>
                    </div>
                  ))}
                  <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", marginTop: 8 }}>
                    <div style={S.box}>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>Projected Total</div>
                      <div style={{ fontSize: 18, fontWeight: 900 }}>{money(recurrent.pTot)}</div>
                    </div>
                    <div style={S.box}>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>Actual Total</div>
                      <div style={{ fontSize: 18, fontWeight: 900 }}>{money(recurrent.aTot)}</div>
                    </div>
                    <div style={S.box}>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>Eligibility</div>
                      <div style={{ fontSize: 18, fontWeight: 900 }}>{recurrent.kpiOk ? "Eligible" : "Not eligible"}</div>
                    </div>
                  </div>
                  {cfg.rb.length === 0 ? <div style={{ fontSize: 12, opacity: 0.7 }}>Recurrent bonus bands not configured. Add them in Settings JSON (cfg.rb).</div> : null}
                </div>
              )
            })}

            {Card({
              t: "SPIFFs",
              c: (
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
                    <div style={S.box}>
                      <div style={{ fontWeight: 800, marginBottom: 8 }}>SPIFF 1: ABX Account Plans</div>
                      <div style={{ display: "grid", gap: 10 }}>
                        <Field l="A Accounts Total">
                          <Num v={s.sp.aTot} set={(v) => setState({ sp: { ...s.sp, aTot: v } })} />
                        </Field>
                        <Field l="A Plans Completed By Jun 30">
                          <Num v={s.sp.aDone} set={(v) => setState({ sp: { ...s.sp, aDone: v } })} />
                        </Field>
                        <Field l="B Accounts Total">
                          <Num v={s.sp.bTot} set={(v) => setState({ sp: { ...s.sp, bTot: v } })} />
                        </Field>
                        <Field l="B Plans Completed By Dec 31">
                          <Num v={s.sp.bDone} set={(v) => setState({ sp: { ...s.sp, bDone: v } })} />
                        </Field>
                        <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 10, background: "var(--surface-alt)" }}>
                          <div style={{ fontSize: 12, opacity: 0.75 }}>SPIFF 1</div>
                          <div style={{ fontSize: 18, fontWeight: 900 }}>{money(spiff.s1)}</div>
                        </div>
                      </div>
                    </div>
                    <div style={S.box}>
                      <div style={{ fontWeight: 800, marginBottom: 8 }}>SPIFF 2: Engagement Strategy</div>
                      <div style={{ display: "grid", gap: 10 }}>
                        <Field l="Engagement A Accounts Completed By Sep 30">
                          <Num v={s.sp.engDone} set={(v) => setState({ sp: { ...s.sp, engDone: v } })} />
                        </Field>
                        <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 10, background: "var(--surface-alt)" }}>
                          <div style={{ fontSize: 12, opacity: 0.75 }}>SPIFF 2 eligible?</div>
                          <div style={{ fontSize: 18, fontWeight: 900 }}>{spiff.s2ok ? "Yes" : "No"}</div>
                          <div style={{ fontSize: 12, opacity: 0.7 }}>Threshold: {spiff.thr}</div>
                        </div>
                      </div>
                    </div>
                    <div style={S.box}>
                      <div style={{ fontWeight: 800, marginBottom: 8 }}>SPIFF 3: Workshops</div>
                      <div style={{ display: "grid", gap: 10 }}>
                        <Field l="Workshops A Accounts Completed By Dec 31">
                          <Num v={s.sp.wkDone} set={(v) => setState({ sp: { ...s.sp, wkDone: v } })} />
                        </Field>
                        <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 10, background: "var(--surface-alt)" }}>
                          <div style={{ fontSize: 12, opacity: 0.75 }}>SPIFF 3 eligible?</div>
                          <div style={{ fontSize: 18, fontWeight: 900 }}>{spiff.s3ok ? "Yes" : "No"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <input type="checkbox" checked={s.sp.all3} onChange={(e) => setState({ sp: { ...s.sp, all3: e.target.checked } })} /> All 3 SPIFFs Completed Within 12 Months
                  </label>
                  <div style={{ ...S.box, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <b>SPIFF total</b>
                    <b>{money(spiff.tot)}</b>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}

        {tab === "RESULTS" ? (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
              <div style={S.box}>
                <div style={{ fontSize: 12, opacity: 0.75 }}>Sign-On (Before Quota)</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{money(totals.pre)}</div>
              </div>
              <div style={S.box}>
                <div style={{ fontSize: 12, opacity: 0.75 }}>Sign-On (After Quota)</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{money(totals.after)}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Quota Achievement: {pct(quota.factor)}</div>
              </div>
              <div style={S.box}>
                <div style={{ fontSize: 12, opacity: 0.75 }}>Recurrent (Actual)</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{money(totals.rec)}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{recurrent.kpiOk ? "KPI Eligible" : "Not eligible"}</div>
              </div>
              <div style={S.box}>
                <div style={{ fontSize: 12, opacity: 0.75 }}>SPIFF</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{money(totals.sp)}</div>
              </div>
              <div style={S.box}>
                <div style={{ fontSize: 12, opacity: 0.75 }}>Total</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{money(totals.all)}</div>
              </div>
            </div>
            {Card({
              t: "Payout Schedule",
              r: <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{showCsv ? <Btn on={() => setShowCsv(false)}>Hide CSV</Btn> : <Btn on={showCSV} active>Show CSV</Btn>}</div>,
              c: (
                <div style={{ display: "grid", gap: 10 }}>
                  {showCsv && csvText ? (
                    <div style={{ ...S.box, background: "var(--surface-alt)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.8 }}>CSV Output</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Btn on={selectCSV}>Select CSV</Btn>
                        </div>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>Copy all text and save as a .csv file, then open in Excel.</div>
                      <textarea
                        ref={csvRef}
                        value={csvText}
                        readOnly
                        style={{ ...S.inp, height: 180, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, borderRadius: 16 }}
                      />
                    </div>
                  ) : null}
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ textAlign: "left", opacity: 0.75 }}>
                          <th style={{ padding: 8 }}>Date</th>
                          <th style={{ padding: 8 }}>Category</th>
                          <th style={{ padding: 8 }}>Source</th>
                          <th style={{ padding: 8 }}>Label</th>
                          <th style={{ padding: 8, textAlign: "right" }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.map((e, i) => (
                        <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                            <td style={{ padding: 8, fontWeight: 800 }}>{e.date || "(No Date)"}</td>
                            <td style={{ padding: 8 }}>{e.category}</td>
                            <td style={{ padding: 8 }}>{e.source}</td>
                            <td style={{ padding: 8 }}>{e.label}</td>
                            <td style={{ padding: 8, textAlign: "right", fontWeight: 900 }}>{money(e.amount)}</td>
                          </tr>
                        ))}
                        {events.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ padding: 10, opacity: 0.7 }}>
                              No Payouts Yet.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}

        {tab === "SETTINGS" ? (
          <div style={{ display: "grid", gap: 12 }}>
            {Card({
              t: "Settings JSON",
              r: (
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <Btn on={() => void doCopy()}>Copy</Btn>
                  <Btn on={apply}>Apply</Btn>
                  {copyMsg ? <div style={{ ...S.pill, background: "var(--surface)", fontSize: 12, fontWeight: 800 }}>{copyMsg}</div> : null}
                </div>
              ),
              c: (
                <textarea
                  ref={settingsRef}
                  value={j}
                  onChange={(e) => setJ(e.target.value)}
                  style={{ ...S.inp, height: 520, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, borderRadius: 16 }}
                />
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function App() {
  return <AppInner />;
}

(async function runTests() {
  const q0 = computeQuotaFactor(0, 50000);
  console.assert(q0.factor === 0.7, "quota floor");
  const q1 = computeQuotaFactor(50000, 50000);
  console.assert(q1.factor === 1, "quota at target");
  const q2 = computeQuotaFactor(60000, 50000);
  console.assert(q2.factor === 1.05, "quota cap");
  const cfg = dclone(CFG0);
  const c: Contract = {
    id: "t",
    name: "t",
    type: "NETWORK_GTA",
    line: "AIRLINE_CREW",
    termYears: 4,
    projectedRoomNights: 100000,
    actualRoomNights: "",
    annualizedRevenue: 0,
    bdShare: 1,
    startDate: "2026-02-01",
    closeDate: "2026-01-15",
    payoutModel: "AIRLINE_70_30",
    payoutScenario: "STANDARD",
    t4cAfterYear: 2
  };
  const calc = computeContractSignOnTotal(cfg, c, 1);
  console.assert(calc.total > 0, "sign-on > 0");
  const c5: Contract = { ...c, termYears: 5 };
  const calc5 = computeContractSignOnTotal(cfg, c5, 1);
  console.assert(calc5.total === 52500, "network c1 5y progressive");
  const calc5b = computeContractSignOnTotal(cfg, c5, 2);
  console.assert(calc5b.total === 55150, "network c2 5y progressive");
  const calc5c = computeContractSignOnTotal(cfg, c5, 3);
  console.assert(calc5c.total === 60400, "network c3 5y progressive");
  const c275: Contract = { ...c, termYears: 5, projectedRoomNights: 275000, actualRoomNights: 275000 };
  const calc275 = computeContractSignOnTotal(cfg, c275, 1);
  console.assert(calc275.total === 90500, "network c1 5y progressive 275k");
  const t = computeContractTiming(cfg, c, 1, calc.total);
  console.assert(t.length === 2, "standard timing");
  const c3: Contract = { ...c, payoutScenario: "SCENARIO_3", t4cAfterYear: 4 };
  const t3 = computeContractTiming(cfg, c3, 1, calc.total);
  console.assert(t3.length === 4, "scenario 3 length");
  const ok1 = await attemptClipboardWrite("x", { writeText: async () => {} }, () => false);
  console.assert(ok1 === true, "clipboard writer ok");
  const ok2 = await attemptClipboardWrite(
    "x",
    {
      writeText: async () => {
        throw new Error("no");
      }
    },
    () => false
  );
  console.assert(ok2 === false, "clipboard blocked falls back");
  console.assert(parseRN("100,000") === 100000, "rn parse commas");
  console.assert(parseRN("12x") === 12, "rn parse mixed");
  console.assert(parseUSD("$1,234,567") === 1234567, "usd parse commas");
  console.assert(parseUSD("12x") === 12, "usd parse mixed");
  const csv = buildPayoutCSV([{ date: "2026-01-01", amount: 1234.5, label: "L", category: "Sign-on", source: "S" }]);
  console.assert(csv.split(String.fromCharCode(10))[0] === "Date,Category,Source,Label,Amount", "csv header");
  console.assert(csv.includes("2026-01-01,Sign-on,S,L,1234.5"), "csv row raw amount");
})();
