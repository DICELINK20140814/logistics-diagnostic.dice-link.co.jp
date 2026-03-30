import { NextRequest, NextResponse } from "next/server";

type ContactPayload = {
  company: string;
  name?: string;
  email: string;
  phone?: string;
  message?: string;
  diagnosticData?: {
    revenueOku?: number;
    businessType?: string;
    currentFuelCost?: number;
    fuelIncreaseCost?: number;
    improvement?: number;
    coverage?: number;
    status?: "full" | "partial" | "critical";
    weakPoints?: Array<{
      label: string;
    }>;
  } | null;
};

function buildMessage(body: ContactPayload) {
  const d = body.diagnosticData;
  if (!d) return body.message?.trim() || "";

  const weakPoints =
    d.weakPoints && d.weakPoints.length > 0
      ? d.weakPoints.map((p, i) => `${i + 1}. ${p.label}`).join(", ")
      : "なし";

  const diagnosticSummary = [
    "【診断結果サマリー】",
    d.businessType ? `事業形態: ${d.businessType}` : "",
    typeof d.revenueOku === "number" ? `年商: ${d.revenueOku}億円` : "",
    typeof d.coverage === "number"
      ? `吸収率: ${(d.coverage * 100).toFixed(0)}%`
      : "",
    `改善論点: ${weakPoints}`,
  ]
    .filter(Boolean)
    .join("\n");

  return [body.message?.trim() || "", diagnosticSummary].filter(Boolean).join("\n\n");
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContactPayload;

    if (!body.company?.trim()) {
      return NextResponse.json(
        { ok: false, error: "会社名は必須です" },
        { status: 400 }
      );
    }

    if (!body.email?.trim()) {
      return NextResponse.json(
        { ok: false, error: "メールアドレスは必須です" },
        { status: 400 }
      );
    }

    const mailEndpoint =
      process.env.XSERVER_MAIL_ENDPOINT?.trim() ||
      "https://jgx.dice-link.co.jp/mail.php";

    const form = new URLSearchParams();
    form.append("name", body.name?.trim() || "ご担当者様");
    form.append("company", body.company.trim());
    form.append("position", "");
    form.append("email", body.email.trim());
    form.append("tel", body.phone?.trim() || "");
    form.append("topic[]", "diagnosis");
    form.append("topic_other", "");
    form.append("message", buildMessage(body));
    form.append("agree", "1");

    const response = await fetch(mailEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
      redirect: "follow",
    });

    const text = await response.text();
    const hasValidationError =
      text.includes("入力にエラーがあります") ||
      text.includes("未入力です");

    if (!response.ok || hasValidationError) {
      console.error("[contact] xserver mail.php failed:", {
        status: response.status,
        url: response.url,
        hasValidationError,
      });
      return NextResponse.json(
        {
          ok: false,
          error:
            "問い合わせ送信に失敗しました。入力項目または外部フォーム連携設定をご確認ください。",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[contact] send failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          "メールの送信に失敗しました。詳細は Vercel の Logs を確認してください。",
      },
      { status: 500 }
    );
  }
}
