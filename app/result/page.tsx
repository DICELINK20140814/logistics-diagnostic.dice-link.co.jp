"use client";

import { LogoWithFallback } from "@/app/components/LogoWithFallback";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

type WeakPoint = {
  key: string;
  label: string;
  rawAverage: number;
  weightedScore: number;
  comment: string;
};

const BUSINESS_LABELS: Record<string, string> = {
  transport: "運送中心",
  warehouse: "倉庫中心",
  both: "運送＋倉庫",
  tpl: "3PL",
};

function formatOku(value: number) {
  return `${(value / 100000000).toFixed(1)}億円`;
}

function ResultPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("data");

  if (!raw) {
    return (
      <main className="min-h-screen bg-white p-10 text-[#0A2643]">
        <div className="mx-auto max-w-4xl">
          <p className="mb-6">結果データが見つかりませんでした。</p>
          <Link
            href="/diagnostic"
            className="rounded-xl bg-[#0A2643] px-6 py-3 text-white"
          >
            診断画面に戻る
          </Link>
        </div>
      </main>
    );
  }

  const data = JSON.parse(decodeURIComponent(raw)) as {
    revenueOku: number;
    businessType: string;
    currentFuelCost: number;
    fuelIncreaseCost: number;
    fuelRiskScore: number;
    improvementRate: number;
    improvement: number;
    coverage: number;
    status: "full" | "partial" | "critical";
    weakPoints: WeakPoint[];
  };

  const statusMessage =
    data.status === "full"
      ? "原油高の影響は、最適化により吸収可能な可能性があります"
      : data.status === "partial"
      ? "原油高の影響を一定程度緩和できる可能性があります"
      : "現状のままでは原油高の影響を吸収しきれない可能性があります";

  const finalImpact = data.improvement - data.fuelIncreaseCost;

  const goContact = () => {
    router.push(`/contact?data=${encodeURIComponent(JSON.stringify(data))}`);
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0A2643]">
      <header className="border-b-4 border-[#CEC1A1] bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <LogoWithFallback />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <section className="mb-8 rounded-3xl border border-[#CEC1A1] bg-white p-8 shadow-sm">
          <div className="mb-2 text-sm font-semibold tracking-wide text-[#CEC1A1]">
            診断結果サマリー
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            <div>
              <div className="mb-1 text-sm text-slate-500">原油高コスト増</div>
              <div className="text-3xl font-bold text-red-600">
                +{formatOku(data.fuelIncreaseCost)}
              </div>
            </div>
            <div>
              <div className="mb-1 text-sm text-slate-500">改善余地</div>
              <div className="text-3xl font-bold text-emerald-600">
                -{formatOku(data.improvement)}
              </div>
            </div>
            <div>
              <div className="mb-1 text-sm text-slate-500">差し引き</div>
              <div
                className={`text-3xl font-bold ${
                  finalImpact >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {finalImpact >= 0 ? "+" : "-"}
                {formatOku(Math.abs(finalImpact))}
              </div>
            </div>
            <div>
              <div className="mb-1 text-sm text-slate-500">吸収率</div>
              <div className="text-3xl font-bold">
                {(data.coverage * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-4 text-2xl font-bold">前提条件</div>
          <div className="space-y-2 text-base leading-8 text-slate-700">
            <div>対象業種：{BUSINESS_LABELS[data.businessType]}</div>
            <div>年商：{data.revenueOku}億円</div>
          </div>
        </section>

        <section className="mb-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-4 text-2xl font-bold">原油高インパクト</div>
            <div className="text-base leading-8 text-slate-700">
              現在の燃料費は
              <span className="font-bold text-[#0A2643]">
                {" "}
                {formatOku(data.currentFuelCost)}{" "}
              </span>
              と推定されます。燃料価格上昇により、年間
              <span className="font-bold text-red-600">
                {" "}
                +{formatOku(data.fuelIncreaseCost)}{" "}
              </span>
              のコスト増が見込まれる可能性があります。
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-4 text-2xl font-bold">改善余地</div>
            <div className="text-base leading-8 text-slate-700">
              現状の物流構造には、年間
              <span className="font-bold text-emerald-600">
                {" "}
                -{formatOku(data.improvement)}{" "}
              </span>
              （改善率 {(data.improvementRate * 100).toFixed(1)}%）
              の改善余地が存在する可能性があります。
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-4 text-2xl font-bold">統合評価</div>
          <div className="mb-4 text-lg font-semibold">{statusMessage}</div>
          <div className="text-base leading-8 text-slate-700">
            本診断結果では、差し引き
            <span
              className={`font-bold ${
                finalImpact >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {" "}
              {finalImpact >= 0 ? "+" : "-"}
              {formatOku(Math.abs(finalImpact))}{" "}
            </span>
            のインパクトが見込まれます。これは簡易試算であり、実際の改善ポテンシャルは
            構造分解と数理モデル設計により特定されます。
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-5 text-2xl font-bold">主な改善論点</div>
          <div className="space-y-5">
            {data.weakPoints.map((point, index) => (
              <div key={point.key} className="rounded-xl border border-slate-100 p-5">
                <div className="mb-2 text-lg font-semibold">
                  {index + 1}. {point.label}
                </div>
                <div className="text-base leading-8 text-slate-600">
                  {point.comment}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-4 text-2xl font-bold">次のアクション</div>
          <div className="mb-6 text-base leading-8 text-slate-700">
            このまま放置すると、原油高によるコスト増はそのまま固定化されます。
            本診断は簡易試算です。実際には、案件採算・配車構造・倉庫運用を分解し、
            数理モデルによって「どこを動かせばどれだけ変わるか」を特定する必要があります。
          </div>

          <button
            onClick={goContact}
            className="rounded-xl bg-[#0A2643] px-8 py-4 text-white transition hover:opacity-90"
          >
            物流改善ポテンシャルの特定を依頼する
          </button>
        </section>

        <div className="flex gap-4">
          <Link
            href="/diagnostic"
            className="rounded-xl border border-[#0A2643] px-6 py-3 text-[#0A2643] transition hover:bg-slate-50"
          >
            入力画面に戻る
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-[#0A2643] px-6 py-3 text-[#0A2643] transition hover:bg-slate-50"
          >
            トップに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}

function ResultPageFallback() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0A2643]">
      <header className="border-b-4 border-[#CEC1A1] bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <LogoWithFallback />
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-20 text-center text-slate-600">
        読み込み中…
      </div>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<ResultPageFallback />}>
      <ResultPageContent />
    </Suspense>
  );
}
