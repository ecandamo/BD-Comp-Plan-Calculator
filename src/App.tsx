import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  Menu,
  Moon,
  MoreHorizontal,
  Plus,
  Settings2,
  Sun,
  Trash2,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";

const PayoutDataTable = lazy(() => import("@/components/payout-data-table").then((module) => ({ default: module.PayoutDataTable })));
const ContractDatePicker = lazy(() => import("@/components/contract-date-picker").then((module) => ({ default: module.ContractDatePicker })));
const HelpAccordion = lazy(() => import("@/components/help-accordion").then((module) => ({ default: module.HelpAccordion })));

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card as UiCard, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { FieldGroup, InputField, TextAreaField } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { applyTheme, getPreferredTheme, type AppTheme } from "./lib/theme";

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

const PAYOUT_SCENARIO_OPTION_TEXT: Record<PS, string> = {
  STANDARD: "Standard | 5-year agreement with standard payout timing.",
  SCENARIO_1: "Scenario 1 | 5-year agreement with NO T4C.",
  SCENARIO_2: "Scenario 2 | 3-year + 2-year extension WITH T4C after year 2.",
  SCENARIO_3: "Scenario 3 | 5-year agreement WITH T4C either after year 1 or after year 2.",
  SCENARIO_4: "Scenario 4 | 5-year agreement WITH T4C after year 3."
};

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
type PayoutStatus = "TO_BE_PAID" | "PAID" | "PENDING";

const PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = {
  TO_BE_PAID: "To be paid",
  PAID: "Paid",
  PENDING: "Pending"
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
  includeQuotaInPayoutSchedule: boolean;
  kpiRN: number;
  kpiRev: number;
  contracts: Contract[];
  accts: Acct[];
  sp: { aTot: number; aDone: number; bTot: number; bDone: number; engDone: number; wkDone: number; all3: boolean };
  payoutStatuses: Record<string, PayoutStatus>;
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
  includeQuotaInPayoutSchedule: false,
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
  sp: { aTot: 10, aDone: 0, bTot: 5, bDone: 0, engDone: 0, wkDone: 0, all3: false },
  payoutStatuses: {}
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
  const proj = n(c.projectedRoomNights),
    act = c.actualRoomNights === "" ? proj : n(c.actualRoomNights),
    adj = proj > 0 ? act / proj : 1;
  const splitYear2Adjusted = (baseAmount: number, baseLabel: string) => {
    const adjAmount = baseAmount * (adj - 1);
    return {
      total: baseAmount + adjAmount,
      rows: [
        { date: addYears(start, 1), amount: baseAmount, label: baseLabel },
        { date: addYears(start, 1), amount: adjAmount, label: "Projection Variance Adjustment (Actual vs Projected RN)" }
      ]
    };
  };
  const termTotal = (yrs: number) => computeContractSignOnTotal(cfg, { ...c, termYears: yrs }, rank).total;
  if (scen === "SCENARIO_1") {
    const t = termTotal(5);
    const y2 = splitYear2Adjusted((isD ? 0.5 : 0.3) * t, isD ? "Sign-On (50% remaining)" : "Sign-On (30% remaining)");
    return [
      { date: addDays(start, 30), amount: (isD ? 0.5 : 0.7) * t, label: isD ? "Sign-On (50% on start)" : "Sign-On (70% on start)" },
      ...y2.rows
    ];
  }
  if (scen === "SCENARIO_2") {
    const t2 = termTotal(2),
      t5 = termTotal(5);
    const p1 = (isD ? 0.5 : 0.7) * t2,
      y2 = splitYear2Adjusted((isD ? 0.5 : 0.3) * t2, isD ? "Sign-On (50% remaining)" : "Sign-On (30% remaining)"),
      prev = p1 + y2.total,
      rem = t5 - prev;
    return [
      { date: addDays(start, 30), amount: p1, label: isD ? "Sign-On (50% on start)" : "Sign-On (70% on start)" },
      ...y2.rows,
      { date: addYears(start, 3), amount: rem / 2, label: "50% of year 4 payout minus previous payouts" },
      { date: addYears(start, 4), amount: rem / 2, label: "50% of year 5 payout minus previous payouts" }
    ];
  }
  if (scen === "SCENARIO_3") {
    const min = c.type === "NETWORK_GTA" ? 2 : 1;
    const base = cl(n(c.t4cAfterYear ?? 2), min, 4);
    const tb = termTotal(base);
    const p1 = (isD ? 0.5 : 0.7) * tb,
      y2 = splitYear2Adjusted((isD ? 0.5 : 0.3) * tb, isD ? "Sign-On (50% remaining)" : "Sign-On (30% remaining)");
    let prev = p1 + y2.total;
    const ev = [
      { date: addDays(start, 30), amount: p1, label: isD ? "Sign-On (50% on start)" : "Sign-On (70% on start)" },
      ...y2.rows
    ];
    for (let ty = Math.max(3, base + 1); ty <= 5; ty++) {
      const t = termTotal(ty);
      ev.push({ date: addYears(start, ty - 1), amount: t - prev, label: `100% of year ${ty} payout minus previous payouts` });
      prev = t;
    }
    return ev;
  }
  if (scen === "SCENARIO_4") {
    const t3 = termTotal(3),
      t4 = termTotal(4),
      t5 = termTotal(5);
    const p1 = (isD ? 0.5 : 0.7) * t3,
      y2 = splitYear2Adjusted((isD ? 0.5 : 0.3) * t3, isD ? "Sign-On (50% remaining)" : "Sign-On (30% remaining)");
    const prev = p1 + y2.total;
    return [
      { date: addDays(start, 30), amount: p1, label: isD ? "Sign-On (50% on start)" : "Sign-On (70% on start)" },
      ...y2.rows,
      { date: addYears(start, 3), amount: t4 - prev, label: "100% of year 4 payout minus previous payouts" },
      { date: addYears(start, 4), amount: t5 - t4, label: "100% of year 5 payout minus previous payouts" }
    ];
  }
  if (isD)
    return [{ date: addDays(start, 30), amount: 0.5 * sign, label: "Sign-On (50% on start)" }, ...splitYear2Adjusted(0.5 * sign, "Sign-On (50% remaining)").rows];
  return [
    { date: addDays(start, 30), amount: 0.7 * sign, label: "Sign-On (70% on start)" },
    ...splitYear2Adjusted(0.3 * sign, "Sign-On (30% remaining)").rows
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

const RN = ({ v, set }: { v: number; set: (x: number) => void }) => {
  const [f, setF] = useState(false);
  const [t, setT] = useState(String(v ?? 0));
  useEffect(() => {
    if (!f) setT(String(v ?? 0));
  }, [v, f]);
  return (
    <InputField
      className="control-input"
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
    <InputField
      className="control-input"
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
    <InputField
      className="control-input"
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
    />
  );
};
const PctIn = ({ v, set }: { v: number; set: (x: number) => void }) => {
  const val = cl(n(v) * 100, 0, 100);
  return (
    <InputField
      className="control-input"
      type="number"
      value={Number.isFinite(val) ? val : 0}
      min={0}
      max={100}
      step={0.1}
      onChange={(e) => {
        const x = cl(Number(e.target.value), 0, 100);
        set(x / 100);
      }}
    />
  );
};

const Card = ({
  t,
  r,
  c,
  collapsed = false,
  onToggle
}: {
  t: React.ReactNode;
  r?: React.ReactNode;
  c: React.ReactNode;
  collapsed?: boolean;
  onToggle?: () => void;
}) => (
  <UiCard className="overflow-hidden border-border/80 bg-card/90 shadow-sm backdrop-blur-sm">
    <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border/70 pb-4">
      <div className="space-y-1">
        <CardTitle className="text-base">{t}</CardTitle>
      </div>
      <div className="flex items-center gap-2">
        {r}
        {onToggle ? (
          <Button variant="ghost" size="icon" onClick={onToggle} aria-expanded={!collapsed} aria-label={`${collapsed ? "Expand" : "Collapse"} ${t}`}>
            <ChevronDown className={cn("size-4 transition-transform", !collapsed && "rotate-180")} />
          </Button>
        ) : null}
      </div>
    </CardHeader>
    <div className={cn("grid transition-[grid-template-rows,opacity] duration-300 ease-out", collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100")}>
      <div className="min-h-0 overflow-hidden">
        <CardContent className="pt-6">{c}</CardContent>
      </div>
    </div>
  </UiCard>
);

const Field = ({ l, children }: { l: string; children: React.ReactNode }) => <FieldGroup label={l}>{children}</FieldGroup>;

const Sel = ({ v, set, children }: { v: any; set: (x: any) => void; children: React.ReactNode }) => {
  const options = React.Children.toArray(children).filter(React.isValidElement) as Array<React.ReactElement<{ value: string; disabled?: boolean; children: React.ReactNode }>>;

  return (
    <Select value={String(v)} onValueChange={set}>
      <SelectTrigger className="h-11 rounded-lg bg-card">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.props.value} value={option.props.value} disabled={option.props.disabled}>
            {option.props.children}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const Num = ({ v, set, step = 1, min, disabled = false }: { v: any; set: (x: number) => void; step?: number; min?: number; disabled?: boolean }) => (
  <InputField
    type="number"
    value={Number.isFinite(v) ? v : 0}
    step={step}
    min={min}
    disabled={disabled}
    onChange={(e) => set(Number(e.target.value))}
  />
);

const ConfirmDeleteButton = ({
  label,
  description,
  onConfirm
}: {
  label: string;
  description: string;
  onConfirm: () => void;
}) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="destructive" size="sm">
        <Trash2 className="size-4" />
        Remove
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{label}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>Remove</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

function AppInner() {
  const [tab, setTab] = useState<"INPUTS" | "RESULTS" | "SETTINGS" | "HELP">("INPUTS");
  const [inputSections, setInputSections] = useState({
    controls: true,
    contracts: true,
    accounts: false,
    spiffs: false
  });
  const [contractSections, setContractSections] = useState<Record<string, boolean>>({});
  const [cfg, setCfg] = useState<Config>(() => dclone(CFG0));
  const [s, setS] = useState<State>(() => dclone(S0));
  const quota = useMemo(() => computeQuotaFactor(s.booked, s.quota), [s.booked, s.quota]);
  const kpiOk = useMemo(() => n(s.kpiRN) >= 50000 || n(s.kpiRev) >= 500000, [s.kpiRN, s.kpiRev]);
  const quotaVarianceLabel = useMemo(() => {
    if (n(s.quota) <= 0) return "Quota Variance: -30.00% (Set quota)";
    const raw = n(quota.achievement) - 1;
    const capped = cl(raw, -0.3, 0.05);
    const val = `${capped > 0 ? "+" : ""}${pct(capped)}`;
    if (Math.abs(capped) < 1e-9) return `Quota Variance: ${val} (On target)`;
    if (capped > 0) return raw > 0.05 ? `Quota Variance: ${val} (Overachievement cap applied)` : `Quota Variance: ${val} (Overachievement)`;
    return raw < -0.3 ? `Quota Variance: ${val}\n(Shortfall cap applied)` : `Quota Variance: ${val} (Shortfall)`;
  }, [quota.achievement, s.quota]);

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
    if (n(adj) !== 0 && s.includeQuotaInPayoutSchedule) {
      const quotaMet = n(quota.achievement) >= 1;
      const rawVariance = n(quota.achievement) - 1;
      const capNote = rawVariance < -0.3 ? " - capped at 30%" : rawVariance > 0.05 ? " - capped at 5%" : "";
      const adjLabel = `Last year's annual room quota ${quotaMet ? "met" : "not met"} (${pct(quota.achievement)})${capNote}`;
      ev.push({ date: `${s.planYear}-12-31`, amount: adj, label: adjLabel, category: "Sign-on", source: "Quota Achievement" });
    }
    return { rows, pre, after, ev };
  }, [cRank, cfg, quota.achievement, quota.factor, s.includeQuotaInPayoutSchedule, s.planYear]);

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
  const eventRows = useMemo(() => {
    const seen = new Map<string, number>();
    return events.map((e) => {
      const base = [e.date || "", e.category || "", e.source || "", e.label || "", String(Math.round(n(e.amount) * 100) / 100)].join("|");
      const idx = (seen.get(base) ?? 0) + 1;
      seen.set(base, idx);
      return { ...e, key: `${base}|${idx}` };
    });
  }, [events]);
  const totals = useMemo(() => {
    const rec = recurrent.kpiOk ? recurrent.aTot : 0;
    return { pre: signOn.pre, after: signOn.after, rec, sp: spiff.tot, all: signOn.after + rec + spiff.tot };
  }, [signOn.pre, signOn.after, recurrent.aTot, recurrent.kpiOk, spiff.tot]);

  const setState = (p: Partial<State>) => setS((s0) => ({ ...s0, ...p }));
  const toggleInputSection = (key: keyof typeof inputSections) => setInputSections((prev) => ({ ...prev, [key]: !prev[key] }));
  const isContractSectionOpen = (id: string) => contractSections[id] ?? true;
  const toggleContractSection = (id: string) => setContractSections((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
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
  const settingsRef = useRef<HTMLTextAreaElement | null>(null);
  const [theme, setTheme] = useState<AppTheme>(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark") ? "dark" : "light";
    }
    return getPreferredTheme();
  });
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  useEffect(() => {
    setS((prevState) => {
      const prev = prevState.payoutStatuses ?? {};
      const next: Record<string, PayoutStatus> = {};
      for (const e of eventRows) {
        if (prev[e.key]) next[e.key] = prev[e.key];
      }
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      if (prevKeys.length !== nextKeys.length) return { ...prevState, payoutStatuses: next };
      for (const k of nextKeys) {
        if (next[k] !== prev[k]) return { ...prevState, payoutStatuses: next };
      }
      return prevState;
    });
  }, [eventRows]);
  const headerLogoSrc = theme === "dark" ? "/brand/API-green-white.svg" : "/brand/API-green.svg";

  const getStatus = (key: string): PayoutStatus => (s.payoutStatuses?.[key] as PayoutStatus | undefined) ?? "TO_BE_PAID";
  const setStatus = (key: string, status: PayoutStatus) =>
    setS((prev) => ({ ...prev, payoutStatuses: { ...(prev.payoutStatuses ?? {}), [key]: status } }));
  const doCopy = async () => {
    const txt = JSON.stringify({ cfg, s }, null, 2);
    const ok = await attemptClipboardWrite(txt);
    if (ok) {
      toast.success("JSON snapshot copied.");
    } else {
      toast.warning("Clipboard blocked. Copy from Settings JSON instead.");
      setTab("SETTINGS");
      setTimeout(() => {
        try {
          settingsRef.current?.focus();
          settingsRef.current?.select();
        } catch {}
      }, 0);
    }
  };
  const apply = () => {
    try {
      const p = JSON.parse(j);
      if (p?.cfg) setCfg(p.cfg);
      if (p?.s) setS({ ...p.s, payoutStatuses: p.s?.payoutStatuses ?? {} });
      toast.success("Settings applied.");
    } catch {
      toast.error("Invalid JSON.");
    }
  };
  const summaryCards = [
    { title: "Sign-On (Before Quota)", value: money(totals.pre) },
    { title: "Sign-On (After Quota)", value: money(totals.after), detail: quotaVarianceLabel, preserveBreaks: true },
    { title: "Recurrent (Actual)", value: money(totals.rec), detail: recurrent.kpiOk ? "KPI Eligible" : "Not eligible" },
    { title: "SPIFF", value: money(totals.sp) },
    { title: "Total", value: money(totals.all) }
  ];
  const tabItems: Array<{ value: "INPUTS" | "RESULTS" | "SETTINGS" | "HELP"; label: string }> = [
    { value: "INPUTS", label: "Inputs" },
    { value: "RESULTS", label: "Results" },
    { value: "HELP", label: "Help" },
    ...(tab === "SETTINGS" ? [{ value: "SETTINGS" as const, label: "Settings" }] : [])
  ];

  return (
    <TooltipProvider>
      <Tabs value={tab} onValueChange={(value) => setTab(value as "INPUTS" | "RESULTS" | "SETTINGS" | "HELP")} className="app-shell min-h-screen ui-wrap">
        <div className="app-container ui-container">
          <div className="app-header">
            <UiCard className="header-bar border-border/80 bg-card/90 shadow-sm backdrop-blur-md">
              <div className="brand-lockup">
                <div className="brand-logo-wrap">
                  <img className="brand-logo" src={headerLogoSrc} alt="Accommodations Plus International logo" />
                </div>
                <div className="brand-copy">
                  <h1 className="app-title text-4xl leading-[0.96] font-semibold md:text-6xl xl:text-[4.35rem]">BD Comp Plan Calculator</h1>
                  <p className="ui-text-muted max-w-[44rem] text-base md:text-lg">
                    Calculate sign-on, recurrent, and SPIFF compensation in a single planning workspace without changing plan logic.
                  </p>
                  <div className="hidden md:block">
                    <TabsList className="bg-card/85">
                      {tabItems.map((item) => (
                        <TabsTrigger key={item.value} value={item.value}>
                          {item.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                </div>
              </div>

              <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="md:hidden">
                      <Menu className="size-4" />
                      <span className="sr-only">Open navigation</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <SheetHeader>
                      <SheetTitle>Workspace</SheetTitle>
                      <SheetDescription>Switch sections and jump to admin tools.</SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 grid gap-2">
                      {tabItems.map((item) => (
                        <SheetClose key={item.value} asChild>
                          <Button variant={tab === item.value ? "primary" : "outline"} className="justify-start" onClick={() => setTab(item.value)}>
                            {item.label}
                          </Button>
                        </SheetClose>
                      ))}
                    </div>
                  </SheetContent>
                </Sheet>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                      <span className="sr-only">Toggle theme</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}</TooltipContent>
                </Tooltip>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">Open actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => void doCopy()}>
                      <Copy className="size-4" />
                      Copy JSON snapshot
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setTab("SETTINGS");
                        setTimeout(() => settingsRef.current?.focus(), 0);
                      }}
                    >
                      <Settings2 className="size-4" />
                      Open settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </UiCard>
          </div>

          <TabsContent value="INPUTS" className="ui-grid mt-0">
            {Card({
              t: "Comp Plan Controls",
              collapsed: !inputSections.controls,
              onToggle: () => toggleInputSection("controls"),
              c: (
                <div className="ui-grid">
                  <div className="ui-grid-tight [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
                    <Field l="Plan Year">
                      <Num v={s.planYear} set={(v) => setState({ planYear: v })} />
                    </Field>
                  </div>
                  <div className="ui-grid [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
                    <div className="ui-box">
                      <div className="mb-2 ui-title">Quota Achievement</div>
                      <div className="ui-grid-tight [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
                        <Field l="Quota Room Nights">
                          <RN v={s.quota} set={(v) => setState({ quota: v })} />
                        </Field>
                        <Field l="Booked New Room Nights">
                          <RN v={s.booked} set={(v) => setState({ booked: v })} />
                        </Field>
                      </div>
                      <div className="mt-2.5 ui-stack ui-text-13">
                        <Progress value={Math.min(100, Math.max(0, quota.achievement * 100))} />
                        <div className="flex justify-between">
                          <span className="ui-text-muted">Achievement</span>
                          <b>{pct(quota.achievement)}</b>
                        </div>
                        <div className="flex justify-between">
                          <span className="ui-text-muted">Factor</span>
                          <b>{pct(quota.factor)}</b>
                        </div>
                        <div className="ui-text-xs ui-text-muted">{quota.note}</div>
                        <label className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-card/70 px-3 py-2 text-xs text-muted-foreground">
                          <span>Include in payout schedule</span>
                          <Switch checked={s.includeQuotaInPayoutSchedule} onCheckedChange={(checked) => setState({ includeQuotaInPayoutSchedule: checked })} />
                        </label>
                      </div>
                    </div>

                    <div className="ui-box">
                      <div className="mb-2 ui-title">KPI Gate</div>
                      <div className="ui-grid-tight [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
                        <Field l="KPI: New Annual Room Nights">
                          <RN v={s.kpiRN} set={(v) => setState({ kpiRN: v })} />
                        </Field>
                        <Field l="KPI: New Annual Revenue">
                          <USD v={s.kpiRev} set={(v) => setState({ kpiRev: v })} />
                        </Field>
                      </div>
                      <div className="mt-2.5 ui-stack ui-text-13">
                        <Progress value={Math.min(100, Math.max((n(s.kpiRN) / 50000) * 100, (n(s.kpiRev) / 500000) * 100))} />
                        <div className="flex justify-between">
                          <span className="ui-text-muted">KPI</span>
                          <b>{kpiOk ? "Eligible" : "Not Eligible"}</b>
                        </div>
                        <div className="ui-text-xs ui-text-muted">
                          Eligibility requires either 50,000 new client annualized room nights/trips or $500,000 in new client annualized revenue (any line of business).
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {Card({
              t: "New Contracts (Sign-On)",
              collapsed: !inputSections.contracts,
              onToggle: () => toggleInputSection("contracts"),
                  c: (
                <div className="ui-grid">
                  <div className="ui-row">
                    <Button onClick={addContract} variant="primary" size="sm">
                      <Plus className="size-4" />
                      Add Contract
                    </Button>
                  </div>
                  {cRank.map((c: any) => {
                    const isSD = c.type === "SD_ACCOUNT";
                    const minT = c.type === "NETWORK_GTA" ? 2 : 1;
                    const termLockedByScenario = !isSD && c.payoutScenario !== "STANDARD";
                    const r = computeContractSignOnTotal(cfg, c, c.rank ?? null);
                    const pre = r.total,
                      after = pre * quota.factor;
                    const timing = computeContractTiming(cfg, c, c.rank ?? null, pre);
                    const isOpen = isContractSectionOpen(c.id);
                    return (
                      <UiCard key={c.id} className="border-border/80 bg-muted/10 shadow-none">
                        <CardContent className="p-4">
                        <div className="ui-row-space">
                          <div className="ui-row flex-1 min-w-[260px]">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleContractSection(c.id)}
                              aria-expanded={isOpen}
                              aria-label={`${isOpen ? "Collapse" : "Expand"} ${c.name || "contract"}`}
                            >
                              <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
                            </Button>
                            <InputField className="flex-1 min-w-[220px] font-extrabold" value={c.name} onChange={(e) => setContract(c.id, { name: e.target.value })} />
                            <Badge variant="default">Rank {c.rank ?? "-"}</Badge>
                          </div>
                          <div className="ui-row">
                            <ConfirmDeleteButton
                              label="Remove contract?"
                              description={`This will remove ${c.name || "this contract"} from the calculator.`}
                              onConfirm={() => delContract(c.id)}
                            />
                          </div>
                        </div>
                        {r.warnings?.length ? <div className="mt-2 ui-text-xs ui-text-muted">{r.warnings.join(" · ")}</div> : null}
                        <div className={`grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-300 ease-out ${isOpen ? "mt-2.5 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"}`}>
                          <div className="min-h-0 overflow-hidden">
                            <div className="ui-grid-tight [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
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
                                <div className="ui-stack">
                                  <Num v={c.termYears} set={(v) => setContract(c.id, { termYears: v })} min={1} disabled={termLockedByScenario} />
                                  {termLockedByScenario ? (
                                    <div className="ui-text-xs ui-text-muted">Disabled for non-standard scenarios because payout uses scenario-defined years.</div>
                                  ) : null}
                                </div>
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
                              <Field l="Contract Sign Date">
                                <Suspense fallback={<InputField value={c.startDate} readOnly placeholder="Loading date picker..." />}>
                                  <ContractDatePicker value={c.startDate} onChange={(value) => setContract(c.id, { startDate: value })} />
                                </Suspense>
                              </Field>
                              <Field l="Close Date">
                                <Suspense fallback={<InputField value={c.closeDate} readOnly placeholder="Loading date picker..." />}>
                                  <ContractDatePicker value={c.closeDate} onChange={(value) => setContract(c.id, { closeDate: value })} />
                                </Suspense>
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
                                <div className="col-[1/-1]">
                                  <Field l="Payout Scenario">
                                    <div className="max-w-[640px]">
                                      <Sel
                                        v={c.payoutScenario}
                                        set={(v: PS) =>
                                          setContract(c.id, {
                                            payoutScenario: v,
                                            ...(v !== "STANDARD" ? { termYears: 5 } : {})
                                          })
                                        }
                                      >
                                        <option value="STANDARD">{PAYOUT_SCENARIO_OPTION_TEXT.STANDARD}</option>
                                        <option value="SCENARIO_1">{PAYOUT_SCENARIO_OPTION_TEXT.SCENARIO_1}</option>
                                        <option value="SCENARIO_2">{PAYOUT_SCENARIO_OPTION_TEXT.SCENARIO_2}</option>
                                        <option value="SCENARIO_3">{PAYOUT_SCENARIO_OPTION_TEXT.SCENARIO_3}</option>
                                        <option value="SCENARIO_4">{PAYOUT_SCENARIO_OPTION_TEXT.SCENARIO_4}</option>
                                      </Sel>
                                    </div>
                                  </Field>
                                </div>
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

                            <div className="ui-box ui-box-alt mt-2.5">
                              <div className="ui-text-xs ui-text-muted ui-title">Timing Preview</div>
                              <ScrollArea className="mt-2 max-h-56">
                                <div className="ui-stack [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))] pr-3">
                                  {timing.map((t: any, i: number) => (
                                    <div key={i} className="ui-row-space ui-surface px-2.5 py-2 ui-text-13">
                                      <div className="min-w-0 flex-1">
                                        <b>{t.date || "(No Date)"}</b> <span className="ui-text-muted">{t.label}</span>
                                      </div>
                                      <div>
                                        <b>{money(t.amount)}</b>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </div>
                          </div>
                        </div>
                        </CardContent>
                      </UiCard>
                    );
                  })}
                </div>
              )
            })}

            {Card({
              t: "Covered Accounts (Recurrent)",
              collapsed: !inputSections.accounts,
              onToggle: () => toggleInputSection("accounts"),
              c: (
                <div className="ui-grid-tight">
                  <div className="ui-row">
                    <Button onClick={addAcct} variant="primary" size="sm">
                      <Plus className="size-4" />
                      Add Account
                    </Button>
                  </div>
                  {s.accts.length ? (
                    <div className="account-grid account-grid--header mb-1 items-center gap-2 ui-text-xs ui-text-muted">
                      <div />
                      <div>Account Name</div>
                      <div>Managed By</div>
                      <div>Projected Revenue</div>
                      <div>Actual Revenue</div>
                      <div>Notes</div>
                      <div />
                    </div>
                  ) : null}
                  {s.accts.map((a) => (
                    <div key={a.id} className="account-grid account-grid--row grid items-center gap-2">
                      <label className="flex items-center gap-2 ui-text-13">
                        <Checkbox checked={a.include} onCheckedChange={(checked) => setAcct(a.id, { include: checked === true })} />
                        include
                      </label>
                      <InputField aria-label="Account Name" value={a.name} onChange={(e) => setAcct(a.id, { name: e.target.value })} />
                      <Sel v={a.managedBy} set={(v: any) => setAcct(a.id, { managedBy: v })}>
                        <option value="AM">AM</option>
                        <option value="SD">SD</option>
                      </Sel>
                      <USD v={a.projectedRevenue} set={(v) => setAcct(a.id, { projectedRevenue: v })} />
                      <USD v={a.actualRevenue} set={(v) => setAcct(a.id, { actualRevenue: v })} />
                      <InputField aria-label="Notes" value={a.note || ""} onChange={(e) => setAcct(a.id, { note: e.target.value })} />
                      <ConfirmDeleteButton
                        label="Remove covered account?"
                        description={`This will remove ${a.name || "this account"} from recurrent payout calculations.`}
                        onConfirm={() => delAcct(a.id)}
                      />
                    </div>
                  ))}
                  <div className="mt-2 ui-grid-tight [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
                    <div className="ui-box">
                      <div className="ui-text-xs ui-text-muted">Projected Total</div>
                      <div className="ui-stat">{money(recurrent.pTot)}</div>
                    </div>
                    <div className="ui-box">
                      <div className="ui-text-xs ui-text-muted">Actual Total</div>
                      <div className="ui-stat">{money(recurrent.aTot)}</div>
                    </div>
                    <div className="ui-box">
                      <div className="ui-text-xs ui-text-muted">Eligibility</div>
                      <div className="ui-stat">{recurrent.kpiOk ? "Eligible" : "Not eligible"}</div>
                    </div>
                  </div>
                  {cfg.rb.length === 0 ? <div className="ui-text-xs ui-text-muted">Recurrent bonus bands not configured. Add them in Settings JSON (cfg.rb).</div> : null}
                </div>
              )
            })}

            {Card({
              t: "SPIFFs",
              collapsed: !inputSections.spiffs,
              onToggle: () => toggleInputSection("spiffs"),
              c: (
                <div className="ui-grid">
                  <div className="ui-grid [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
                    <div className="ui-box">
                      <div className="mb-2 ui-title">SPIFF 1: ABX Account Plans</div>
                      <div className="ui-grid-tight">
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
                        <div className="ui-surface-alt p-2.5">
                          <div className="ui-text-xs ui-text-muted">SPIFF 1</div>
                          <div className="ui-stat">{money(spiff.s1)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="ui-box">
                      <div className="mb-2 ui-title">SPIFF 2: Engagement Strategy</div>
                      <div className="ui-grid-tight">
                        <Field l="Engagement A Accounts Completed By Sep 30">
                          <Num v={s.sp.engDone} set={(v) => setState({ sp: { ...s.sp, engDone: v } })} />
                        </Field>
                        <div className="ui-surface-alt p-2.5">
                          <div className="ui-text-xs ui-text-muted">SPIFF 2 eligible?</div>
                          <div className="ui-stat">{spiff.s2ok ? "Yes" : "No"}</div>
                          <div className="ui-text-xs ui-text-muted">Threshold: {spiff.thr}</div>
                        </div>
                      </div>
                    </div>
                    <div className="ui-box">
                      <div className="mb-2 ui-title">SPIFF 3: Workshops</div>
                      <div className="ui-grid-tight">
                        <Field l="Workshops A Accounts Completed By Dec 31">
                          <Num v={s.sp.wkDone} set={(v) => setState({ sp: { ...s.sp, wkDone: v } })} />
                        </Field>
                        <div className="ui-surface-alt p-2.5">
                          <div className="ui-text-xs ui-text-muted">SPIFF 3 eligible?</div>
                          <div className="ui-stat">{spiff.s3ok ? "Yes" : "No"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <label className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-card/70 px-3 py-3 ui-text-13">
                    <span>All 3 SPIFFs Completed Within 12 Months</span>
                    <Switch checked={s.sp.all3} onCheckedChange={(checked) => setState({ sp: { ...s.sp, all3: checked } })} />
                  </label>
                  <div className="ui-box flex flex-wrap justify-between gap-2.5">
                    <b>SPIFF total</b>
                    <b>{money(spiff.tot)}</b>
                  </div>
                </div>
              )
            })}
          </TabsContent>

          <TabsContent value="RESULTS" className="ui-grid mt-0">
            <div className="ui-grid-tight [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
              {summaryCards.map((card) => (
                <UiCard key={String(card.title)} className="rounded-[1.35rem] border-border/80 bg-card/90 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardDescription className="whitespace-nowrap text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {card.title}
                    </CardDescription>
                    <CardTitle className="ui-stat">{card.value}</CardTitle>
                  </CardHeader>
                  {card.detail ? (
                    <CardContent className={cn("pt-0 text-xs text-muted-foreground", card.preserveBreaks && "whitespace-pre-line")}>{card.detail}</CardContent>
                  ) : null}
                </UiCard>
              ))}
            </div>
            {Card({
              t: "Payout Schedule - subject to annual room quota been met",
              c: (
                <div className="ui-grid-tight">
                  <Suspense fallback={<div className="rounded-lg border border-border/70 bg-card/60 p-6 text-sm text-muted-foreground">Loading payout table...</div>}>
                    <PayoutDataTable
                      rows={eventRows.map((e) => ({
                        ...e,
                        status: getStatus(e.key)
                      }))}
                      money={(value) => money(value)}
                      onStatusChange={setStatus}
                    />
                  </Suspense>
                </div>
              )
            })}
          </TabsContent>

          <TabsContent value="SETTINGS" className="ui-grid mt-0">
            {Card({
              t: "Settings JSON",
              r: (
                <div className="ui-row">
                  <Button onClick={() => void doCopy()} variant="outline" size="sm">
                    <Copy className="size-4" />
                    Copy
                  </Button>
                  <Button onClick={apply} variant="primary" size="sm">
                    <Settings2 className="size-4" />
                    Apply
                  </Button>
                </div>
              ),
              c: (
                <ScrollArea className="h-[520px] rounded-lg border border-border/70">
                  <TextAreaField
                    className="h-[520px] border-0 font-mono ui-text-xs shadow-none"
                    ref={settingsRef}
                    value={j}
                    onChange={(e) => setJ(e.target.value)}
                  />
                </ScrollArea>
              )
            })}
          </TabsContent>

          <TabsContent value="HELP" className="ui-grid mt-0">
            {Card({
              t: "How This Calculator Works",
              c: (
                <div className="ui-grid-tight text-sm leading-6">
                  <div>
                    This tool estimates total BD compensation by combining three payout types: Sign-On, Recurrent, and SPIFFs. The flow is simple:
                    enter inputs, review results, and export the payout schedule if needed.
                  </div>
                  <Suspense fallback={<div className="rounded-lg border border-border/70 bg-card/60 p-4 text-sm text-muted-foreground">Loading help content...</div>}>
                    <HelpAccordion />
                  </Suspense>
                </div>
              )
            })}

            {Card({
              t: "About",
              c: (
                <div className="text-sm leading-6">
                  Developed by Esteban Candamo (2026).
                  <div className="mt-1.5 ui-text-13 ui-text-muted">
                    Restricted to authorized employees of Accommodations Plus International.
                  </div>
                </div>
              )
            })}
          </TabsContent>

          <div className="mt-1.5 text-center ui-text-xs ui-text-muted">
            Restricted to authorized employees of Accommodations Plus International. © 2026 Esteban Candamo. All rights reserved.
          </div>
        </div>
      </Tabs>
    </TooltipProvider>
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
})();
