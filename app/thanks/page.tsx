"use client";

import Link from "next/link";
import { LogoWithFallback } from "@/app/components/LogoWithFallback";

export default function ThanksPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0A2643]">
      <header className="border-b-4 border-[#CEC1A1] bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <LogoWithFallback />
        </div>
      </header>

      <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6 py-10">
        <section className="w-full rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mb-4 text-3xl font-bold">送信ありがとうございました</div>
          <div className="mb-8 text-base leading-8 text-slate-700">
            内容を確認のうえ、担当よりご連絡します。
          </div>
          <div className="flex justify-center gap-4">
            <Link
              href="/"
              className="rounded-xl bg-[#0A2643] px-8 py-4 text-white transition hover:opacity-90"
            >
              トップに戻る
            </Link>
            <Link
              href="/diagnostic"
              className="rounded-xl border border-[#0A2643] px-8 py-4 text-[#0A2643] transition hover:bg-slate-50"
            >
              もう一度診断する
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
