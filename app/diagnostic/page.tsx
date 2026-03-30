"use client";

import { LogoWithFallback } from "@/app/components/LogoWithFallback";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type BusinessType = "transport" | "warehouse" | "both" | "tpl";
type FuelRatio = "low" | "midLow" | "midHigh" | "high" | "unknown";
type FuelIncrease = "10" | "20" | "30";
type FuelImpact = "none" | "low" | "high" | "critical";
type FuelPassThrough = "good" | "partial" | "bad" | "none";
type FuelVisibility = "realtime" | "monthly" | "rough" | "none";
type FuelRule = "defined" | "partial" | "adHoc" | "none";
type FuelStructure = "low" | "mid" | "high" | "veryHigh";

type DriverKey =
  | "profitability"
  | "pricing"
  | "dispatch"
  | "assetUtilization"
  | "warehouseProductivity"
  | "visibility"
  | "execution";

type Question = {
  id: string;
  section: string;
  text: string;
  driver: DriverKey;
};

const QUESTIONS: Question[] = [
  {
    id: "q1",
    section: "案件採算",
    text: "案件（顧客・路線）ごとの粗利が把握できている",
    driver: "profitability",
  },
  {
    id: "q2",
    section: "案件採算",
    text: "赤字案件がどれか明確に把握できている",
    driver: "profitability",
  },
  {
    id: "q3",
    section: "案件採算",
    text: "赤字案件に対して改善または撤退の判断ができている",
    driver: "profitability",
  },
  {
    id: "q4",
    section: "案件採算",
    text: "顧客ごとの収益性に応じた取引条件の調整ができている",
    driver: "profitability",
  },

  {
    id: "q5",
    section: "価格転嫁・請求適正化",
    text: "燃料費や人件費の上昇を価格に転嫁できている",
    driver: "pricing",
  },
  {
    id: "q6",
    section: "価格転嫁・請求適正化",
    text: "附帯作業（待機・荷役など）を適切に請求できている",
    driver: "pricing",
  },
  {
    id: "q7",
    section: "価格転嫁・請求適正化",
    text: "定期的に価格見直し（値上げ交渉）を行っている",
    driver: "pricing",
  },
  {
    id: "q8",
    section: "価格転嫁・請求適正化",
    text: "燃料高騰時の価格改定ルールが整理されている",
    driver: "pricing",
  },

  {
    id: "q9",
    section: "配車効率",
    text: "実車率（積載して走っている割合）が高い",
    driver: "dispatch",
  },
  {
    id: "q10",
    section: "配車効率",
    text: "空車回送が最小化されている",
    driver: "dispatch",
  },
  {
    id: "q11",
    section: "配車効率",
    text: "積載率（積み残し・空きスペース）が最適化されている",
    driver: "dispatch",
  },
  {
    id: "q12",
    section: "配車効率",
    text: "配車は属人ではなくルール・仕組みで最適化されている",
    driver: "dispatch",
  },

  {
    id: "q13",
    section: "車両・人員稼働",
    text: "待機時間（荷待ち・荷役待ち）が管理・削減されている",
    driver: "assetUtilization",
  },
  {
    id: "q14",
    section: "車両・人員稼働",
    text: "ドライバーの拘束時間が適切に管理されている",
    driver: "assetUtilization",
  },
  {
    id: "q15",
    section: "車両・人員稼働",
    text: "ドライバーごとの生産性の差が把握されている",
    driver: "assetUtilization",
  },
  {
    id: "q16",
    section: "車両・人員稼働",
    text: "車両の稼働ばらつきが把握されている",
    driver: "assetUtilization",
  },

  {
    id: "q17",
    section: "倉庫生産性",
    text: "倉庫の坪効率（売上/坪）が最適化されている",
    driver: "warehouseProductivity",
  },
  {
    id: "q18",
    section: "倉庫生産性",
    text: "保管回転率が適切に管理されている",
    driver: "warehouseProductivity",
  },
  {
    id: "q19",
    section: "倉庫生産性",
    text: "入出庫作業の生産性（人時）が把握されている",
    driver: "warehouseProductivity",
  },
  {
    id: "q20",
    section: "倉庫生産性",
    text: "人員配置が物量に応じて最適化されている",
    driver: "warehouseProductivity",
  },

  {
    id: "q21",
    section: "可視化・管理基盤",
    text: "日次で売上・粗利が把握できている",
    driver: "visibility",
  },
  {
    id: "q22",
    section: "可視化・管理基盤",
    text: "車両・ドライバーの稼働状況が可視化されている",
    driver: "visibility",
  },
  {
    id: "q23",
    section: "可視化・管理基盤",
    text: "倉庫KPI（生産性・在庫など）が可視化されている",
    driver: "visibility",
  },
  {
    id: "q24",
    section: "可視化・管理基盤",
    text: "燃料費・運行コストの推移が把握できている",
    driver: "visibility",
  },
  {
    id: "q25",
    section: "可視化・管理基盤",
    text: "定期的な改善会議が実施されている",
    driver: "visibility",
  },

  {
    id: "q26",
    section: "改善実行力",
    text: "改善施策の責任者が明確に設定されている",
    driver: "execution",
  },
  {
    id: "q27",
    section: "改善実行力",
    text: "改善テーマの優先順位付けができている",
    driver: "execution",
  },
  {
    id: "q28",
    section: "改善実行力",
    text: "現場を巻き込んだ改善が継続的に行われている",
    driver: "execution",
  },
  {
    id: "q29",
    section: "改善実行力",
    text: "施策ごとの実行状況が追跡されている",
    driver: "execution",
  },
  {
    id: "q30",
    section: "改善実行力",
    text: "改善結果が数値で評価されている",
    driver: "execution",
  },
];

const SECTION_ORDER = [
  "案件採算",
  "価格転嫁・請求適正化",
  "配車効率",
  "車両・人員稼働",
  "倉庫生産性",
  "可視化・管理基盤",
  "改善実行力",
] as const;

const DRIVER_LABELS: Record<DriverKey, string> = {
  profitability: "案件採算",
  pricing: "価格転嫁・請求適正化",
  dispatch: "配車効率",
  assetUtilization: "車両・人員稼働",
  warehouseProductivity: "倉庫生産性",
  visibility: "可視化・管理基盤",
  execution: "改善実行力",
};

const DRIVER_COMMENTS: Record<DriverKey, string> = {
  profitability:
    "案件別の収益性把握が不十分で、赤字案件や低採算案件が利益を圧迫している可能性があります。",
  pricing:
    "燃料費や附帯作業の価格転嫁が不十分で、本来確保できる利益を取りこぼしている可能性があります。",
  dispatch:
    "配車の最適化が不十分で、空車回送や低積載が発生し、収益機会の損失につながっている可能性があります。",
  assetUtilization:
    "待機時間や拘束時間の最適化が不十分で、人員・車両の稼働効率が低下している可能性があります。",
  warehouseProductivity:
    "倉庫内の作業効率や人員配置が最適化されておらず、人件費に対して十分な生産性が出ていない可能性があります。",
  visibility:
    "収益・稼働状況の可視化が不十分で、改善対象の特定が遅れている可能性があります。",
  execution:
    "改善テーマの優先順位付けや実行体制が不十分で、改善余地があっても実行に移せていない可能性があります。",
};

const WEIGHTS: Record<BusinessType, Record<DriverKey, number>> = {
  transport: {
    profitability: 1.2,
    pricing: 1.3,
    dispatch: 1.5,
    assetUtilization: 1.5,
    warehouseProductivity: 0.5,
    visibility: 1.0,
    execution: 1.0,
  },
  warehouse: {
    profitability: 1.2,
    pricing: 1.2,
    dispatch: 0.5,
    assetUtilization: 0.8,
    warehouseProductivity: 1.5,
    visibility: 1.2,
    execution: 1.0,
  },
  both: {
    profitability: 1.3,
    pricing: 1.2,
    dispatch: 1.3,
    assetUtilization: 1.3,
    warehouseProductivity: 1.3,
    visibility: 1.2,
    execution: 1.0,
  },
  tpl: {
    profitability: 1.5,
    pricing: 1.3,
    dispatch: 1.2,
    assetUtilization: 1.2,
    warehouseProductivity: 1.2,
    visibility: 1.5,
    execution: 1.3,
  },
};

const FUEL_RATIO_MAP: Record<FuelRatio, number> = {
  low: 0.04,
  midLow: 0.08,
  midHigh: 0.13,
  high: 0.18,
  unknown: 0.1,
};

const FUEL_INCREASE_MAP: Record<FuelIncrease, number> = {
  "10": 0.1,
  "20": 0.2,
  "30": 0.3,
};

const FUEL_IMPACT_MAP: Record<FuelImpact, number> = {
  none: 0,
  low: -1,
  high: -2,
  critical: -3,
};

const FUEL_COMMON_MAP = {
  good: 1,
  partial: 0,
  bad: -1,
  none: -2,
};

const FUEL_VISIBILITY_MAP = {
  realtime: 1,
  monthly: 0,
  rough: -1,
  none: -2,
};

const FUEL_RULE_MAP = {
  defined: 1,
  partial: 0,
  adHoc: -1,
  none: -2,
};

const FUEL_STRUCTURE_MAP: Record<FuelStructure, number> = {
  low: 0,
  mid: -1,
  high: -2,
  veryHigh: -3,
};

const OPTIONS = [
  { label: "十分できている", score: 1 },
  { label: "一部できている", score: 0 },
  { label: "課題あり", score: -1 },
  { label: "大きな課題", score: -2 },
  { label: "不明", score: 0 },
] as const;

/** score が重複するため、選択状態はインデックスで保持する */
const DEFAULT_OPTION_INDEX = 1 satisfies keyof typeof OPTIONS;

function getImprovementRate(score: number) {
  if (score <= -1.5) return 0.06;
  if (score <= -1.0) return 0.05;
  if (score <= -0.5) return 0.04;
  if (score <= 0) return 0.03;
  return 0.02;
}

export default function DiagnosticPage() {
  const router = useRouter();

  const [businessType, setBusinessType] = useState<BusinessType>("transport");
  const [revenueOku, setRevenueOku] = useState("");
  const [fuelRatio, setFuelRatio] = useState<FuelRatio>("midLow");
  const [fuelIncrease, setFuelIncrease] = useState<FuelIncrease>("20");
  const [fuelImpact, setFuelImpact] = useState<FuelImpact>("low");
  const [fuelPassThrough, setFuelPassThrough] =
    useState<FuelPassThrough>("partial");
  const [fuelVisibility, setFuelVisibility] =
    useState<FuelVisibility>("monthly");
  const [fuelRule, setFuelRule] = useState<FuelRule>("partial");
  const [fuelStructure, setFuelStructure] = useState<FuelStructure>("mid");

  const [answers, setAnswers] = useState<Record<string, number>>(
    Object.fromEntries(
      QUESTIONS.map((q) => [q.id, DEFAULT_OPTION_INDEX])
    )
  );

  const groupedQuestions = useMemo(
    () =>
      SECTION_ORDER.map((section) => ({
        section,
        items: QUESTIONS.filter((q) => q.section === section),
      })),
    []
  );

  const handleAnswerChange = (questionId: string, value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = () => {
    const revenue = Number(revenueOku) * 100000000;

    if (!Number.isFinite(revenue) || revenue <= 0) {
      alert("年商（億円）を入力してください。");
      return;
    }

    const currentFuelCost = revenue * FUEL_RATIO_MAP[fuelRatio];
    const fuelIncreaseCost = currentFuelCost * FUEL_INCREASE_MAP[fuelIncrease];

    const fuelRiskRawScores = [
      FUEL_IMPACT_MAP[fuelImpact],
      FUEL_COMMON_MAP[fuelPassThrough],
      FUEL_VISIBILITY_MAP[fuelVisibility],
      FUEL_RULE_MAP[fuelRule],
      FUEL_STRUCTURE_MAP[fuelStructure],
    ];

    const fuelRiskScore =
      fuelRiskRawScores.reduce((sum, current) => sum + current, 0) /
      fuelRiskRawScores.length;

    const driverQuestionMap: Record<DriverKey, number[]> = {
      profitability: [],
      pricing: [],
      dispatch: [],
      assetUtilization: [],
      warehouseProductivity: [],
      visibility: [],
      execution: [],
    };

    QUESTIONS.forEach((q) => {
      const idx = answers[q.id] ?? DEFAULT_OPTION_INDEX;
      const option = OPTIONS[idx];
      driverQuestionMap[q.driver].push(option?.score ?? 0);
    });

    const driverScores = Object.entries(driverQuestionMap).map(
      ([driver, scores]) => {
        const rawAverage =
          scores.length > 0
            ? scores.reduce((sum, current) => sum + current, 0) / scores.length
            : 0;

        const weightedScore =
          rawAverage * WEIGHTS[businessType][driver as DriverKey];

        return {
          key: driver as DriverKey,
          label: DRIVER_LABELS[driver as DriverKey],
          rawAverage,
          weightedScore,
          comment: DRIVER_COMMENTS[driver as DriverKey],
        };
      }
    );

    const weightedTotal =
      driverScores.reduce((sum, d) => sum + d.weightedScore, 0) /
      driverScores.length;

    const improvementRate = getImprovementRate(weightedTotal);
    const improvement = revenue * improvementRate;

    const coverage = fuelIncreaseCost > 0 ? improvement / fuelIncreaseCost : 0;

    let status: "full" | "partial" | "critical" = "critical";
    if (coverage >= 1.0) status = "full";
    else if (coverage >= 0.5) status = "partial";

    const weakPoints = [...driverScores]
      .sort((a, b) => a.rawAverage - b.rawAverage)
      .slice(0, 3);

    const payload = {
      revenueOku: Number(revenueOku),
      businessType,
      currentFuelCost,
      fuelIncreaseCost,
      fuelRiskScore,
      improvementRate,
      improvement,
      coverage,
      status,
      weakPoints,
    };

    router.push(`/result?data=${encodeURIComponent(JSON.stringify(payload))}`);
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0A2643]">
      <header className="border-b-4 border-[#CEC1A1] bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <LogoWithFallback />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-10">
          <h1 className="mb-3 text-3xl font-bold md:text-4xl">
            原油高対応 物流利益改善診断
          </h1>
          <p className="max-w-3xl text-base leading-8 text-slate-600">
            原油高によるコスト増と、現状の物流構造における改善余地を同時に可視化します。
          </p>
        </div>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 text-lg font-semibold">基本情報</div>

          <div className="mb-8">
            <div className="mb-3 text-sm font-semibold text-slate-700">
              主な事業形態
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              {[
                { value: "transport", label: "運送中心" },
                { value: "warehouse", label: "倉庫中心" },
                { value: "both", label: "運送＋倉庫" },
                { value: "tpl", label: "3PL" },
              ].map((item) => (
                <label
                  key={item.value}
                  className={`cursor-pointer rounded-xl border p-4 text-sm transition ${
                    businessType === item.value
                      ? "border-[#CEC1A1] bg-[#0A2643] text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-[#CEC1A1]"
                  }`}
                >
                  <input
                    type="radio"
                    name="businessType"
                    value={item.value}
                    checked={businessType === item.value}
                    onChange={() => setBusinessType(item.value as BusinessType)}
                    className="hidden"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-semibold text-slate-700">
              年商（億円）
            </label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="例：50"
              value={revenueOku}
              onChange={(e) => setRevenueOku(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#0A2643]"
            />
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 text-lg font-semibold">原油高影響</div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                売上に占める燃料費割合
              </label>
              <select
                value={fuelRatio}
                onChange={(e) => setFuelRatio(e.target.value as FuelRatio)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="low">5%未満</option>
                <option value="midLow">5〜10%</option>
                <option value="midHigh">10〜15%</option>
                <option value="high">15%以上</option>
                <option value="unknown">不明</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                燃料費の上昇見込み
              </label>
              <select
                value={fuelIncrease}
                onChange={(e) => setFuelIncrease(e.target.value as FuelIncrease)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="10">10%程度</option>
                <option value="20">20%程度</option>
                <option value="30">30%以上</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                燃料価格上昇の影響
              </label>
              <select
                value={fuelImpact}
                onChange={(e) => setFuelImpact(e.target.value as FuelImpact)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="none">ほとんど影響なし</option>
                <option value="low">やや影響あり</option>
                <option value="high">大きな影響あり</option>
                <option value="critical">すでに深刻</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                燃料費の価格転嫁
              </label>
              <select
                value={fuelPassThrough}
                onChange={(e) =>
                  setFuelPassThrough(e.target.value as FuelPassThrough)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="good">十分できている</option>
                <option value="partial">一部できている</option>
                <option value="bad">あまりできていない</option>
                <option value="none">できていない</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                燃料費の可視化
              </label>
              <select
                value={fuelVisibility}
                onChange={(e) =>
                  setFuelVisibility(e.target.value as FuelVisibility)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="realtime">リアルタイムで把握</option>
                <option value="monthly">月次で把握</option>
                <option value="rough">大まかに把握</option>
                <option value="none">把握していない</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                高騰時の対応ルール
              </label>
              <select
                value={fuelRule}
                onChange={(e) => setFuelRule(e.target.value as FuelRule)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="defined">明確にある</option>
                <option value="partial">一部ある</option>
                <option value="adHoc">属人化している</option>
                <option value="none">ない</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                燃料費の影響を受けやすい構造か
              </label>
              <select
                value={fuelStructure}
                onChange={(e) =>
                  setFuelStructure(e.target.value as FuelStructure)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="low">
                  ほとんど受けない（短距離中心・固定案件）
                </option>
                <option value="mid">一部受ける</option>
                <option value="high">大きく受ける（長距離・変動案件）</option>
                <option value="veryHigh">
                  非常に大きい（スポット中心・長距離）
                </option>
              </select>
            </div>
          </div>
        </section>

        <div className="space-y-8">
          {groupedQuestions.map((group) => (
            <section
              key={group.section}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-5 border-l-4 border-[#CEC1A1] pl-4 text-xl font-semibold">
                {group.section}
              </div>

              <div className="space-y-6">
                {group.items.map((q) => (
                  <div key={q.id} className="rounded-xl border border-slate-100 p-5">
                    <div className="mb-4 text-sm font-semibold text-slate-800">
                      {q.id.replace("q", "Q")}
                      {`. `}
                      {q.text}
                    </div>

                    <div className="grid gap-2 md:grid-cols-5">
                      {OPTIONS.map((option, i) => {
                        const optionId = `${q.id}-${i}`;
                        const checked = answers[q.id] === i;

                        return (
                          <label
                            key={optionId}
                            htmlFor={optionId}
                            className={`cursor-pointer rounded-lg border px-3 py-3 text-center text-sm transition ${
                              checked
                                ? "border-[#CEC1A1] bg-[#0A2643] text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:border-[#CEC1A1]"
                            }`}
                          >
                            <input
                              id={optionId}
                              type="radio"
                              name={q.id}
                              value={i}
                              checked={checked}
                              onChange={() => handleAnswerChange(q.id, i)}
                              className="sr-only"
                            />
                            {option.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="sticky bottom-0 mt-10 border-t border-[#CEC1A1] bg-white/95 py-6 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div className="text-sm leading-7 text-slate-600">
              入力完了後、原油高インパクトと改善余地を算出します。
            </div>
            <button
              onClick={handleSubmit}
              className="rounded-xl bg-[#0A2643] px-8 py-4 text-white transition hover:opacity-90"
            >
              診断結果を表示する
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
