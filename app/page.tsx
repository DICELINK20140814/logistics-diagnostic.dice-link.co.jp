import Link from "next/link";
import { LogoWithFallback } from "@/app/components/LogoWithFallback";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-[#0A2643]">
      <header className="border-b-4 border-[#CEC1A1] bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <LogoWithFallback />
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-4xl">
          <div className="mb-4 inline-flex rounded-full border border-[#CEC1A1] px-4 py-1 text-sm font-medium text-[#0A2643]">
            Logistics Diagnostic
          </div>

          <h1 className="mb-6 text-4xl font-bold leading-tight md:text-5xl">
            原油高対応
            <br />
            物流利益改善診断
          </h1>

          <p className="mb-10 max-w-3xl text-lg leading-8 text-slate-600">
            原油高により今後増加する燃料関連コストを可視化し、
            <br />
            物流最適化によってどこまで利益圧迫を吸収できるかを診断します。
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/diagnostic"
              className="rounded-xl bg-[#0A2643] px-8 py-4 text-white transition hover:opacity-90"
            >
              診断を開始する
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 text-sm font-semibold text-[#CEC1A1]">
              対象
            </div>
            <div className="text-base leading-7 text-slate-700">
              物流会社・運送会社・倉庫会社・3PL
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 text-sm font-semibold text-[#CEC1A1]">
              出力
            </div>
            <div className="text-base leading-7 text-slate-700">
              原油高による想定コスト増、改善余地、吸収可否、改善論点TOP3
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 text-sm font-semibold text-[#CEC1A1]">
              目的
            </div>
            <div className="text-base leading-7 text-slate-700">
              利益圧迫リスクを可視化し、物流改善ポテンシャルの特定につなげる
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
