"use client";

import { LogoWithFallback } from "@/app/components/LogoWithFallback";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

function formatOku(value: number) {
  return `${(value / 100000000).toFixed(1)}億円`;
}

/** よくある全角を半角へ（メール・電話用） */
function toHalfWidthAsciiFragment(s: string): string {
  let out = "";
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    if (c >= 0xff10 && c <= 0xff19) {
      out += String.fromCodePoint(c - 0xff10 + 0x30);
    } else if (c >= 0xff21 && c <= 0xff3a) {
      out += String.fromCodePoint(c - 0xff21 + 0x41);
    } else if (c >= 0xff41 && c <= 0xff5a) {
      out += String.fromCodePoint(c - 0xff41 + 0x61);
    } else if (ch === "＠") out += "@";
    else if (ch === "．") out += ".";
    else if (ch === "＿") out += "_";
    else if (ch === "－" || ch === "ー") out += "-";
    else if (ch === "（") out += "(";
    else if (ch === "）") out += ")";
    else if (ch === "\u3000") out += " ";
    else out += ch;
  }
  return out;
}

/** 半角のみ（メールでよく使う記号） */
function sanitizeHalfWidthEmail(value: string): string {
  const n = toHalfWidthAsciiFragment(value).replace(/\s/g, "");
  return n.replace(/[^a-zA-Z0-9.@_+%\-]/g, "");
}

/** 半角のみ（電話：数字・+・括弧・ハイフン・スペース） */
function sanitizeHalfWidthPhone(value: string): string {
  const n = toHalfWidthAsciiFragment(value);
  return n.replace(/[^0-9+\-()\s]/g, "");
}

export default function ContactPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("data");

  const diagnosticData = useMemo(() => {
    if (!raw) return null;
    try {
      return JSON.parse(decodeURIComponent(raw)) as {
        revenueOku: number;
        businessType: string;
        currentFuelCost: number;
        fuelIncreaseCost: number;
        improvement: number;
        coverage: number;
        status: "full" | "partial" | "critical";
        weakPoints: Array<{ label: string }>;
      };
    } catch {
      return null;
    }
  }, [raw]);

  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const submit = async () => {
    setErrorMessage("");

    if (!company.trim()) {
      setErrorMessage("会社名を入力してください。");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("メールアドレスを入力してください。");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company,
          name,
          email,
          phone,
          message,
          diagnosticData,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "送信に失敗しました");
      }

      router.push("/thanks");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "送信に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0A2643]">
      <header className="border-b-4 border-[#CEC1A1] bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <LogoWithFallback />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-4 text-3xl font-bold">
            物流改善ポテンシャルの特定依頼
          </div>
          <div className="text-base leading-8 text-slate-700">
            貴社の物流構造を分解し、数理モデルにより
            「どこを動かせばどれだけ変わるか」を特定します。
          </div>
        </section>

        {diagnosticData && (
          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-4 text-2xl font-bold">診断結果サマリー</div>
            <div className="space-y-2 text-base leading-8 text-slate-700">
              <div>年商：{diagnosticData.revenueOku}億円</div>
              <div>
                原油高コスト増：+{formatOku(diagnosticData.fuelIncreaseCost)}
              </div>
              <div>改善余地：-{formatOku(diagnosticData.improvement)}</div>
              <div>
                吸収率：{(diagnosticData.coverage * 100).toFixed(0)}%
              </div>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="grid gap-6">
            <div>
              <label className="mb-2 block text-sm font-semibold">会社名 *</label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">担当者名</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                メールアドレス *
              </label>
              <input
                type="text"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(sanitizeHalfWidthEmail(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
              <p className="mt-1 text-xs text-slate-500">半角英数字・記号のみ入力できます。</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">電話番号</label>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(sanitizeHalfWidthPhone(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
              <p className="mt-1 text-xs text-slate-500">半角数字・+（）- スペースのみ入力できます。</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">備考</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={submit}
                disabled={loading}
                className="rounded-xl bg-[#0A2643] px-8 py-4 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "送信中..." : "依頼を送信する"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
