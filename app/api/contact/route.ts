import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

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

function formatOku(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "";
  return `${(value / 100000000).toFixed(1)}億円`;
}

function businessLabel(value?: string) {
  switch (value) {
    case "transport":
      return "運送中心";
    case "warehouse":
      return "倉庫中心";
    case "both":
      return "運送＋倉庫";
    case "tpl":
      return "3PL";
    default:
      return "";
  }
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

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM;
    const notifyTo = process.env.NOTIFY_EMAIL_TO;
    /** SMTP 認証ユーザーと異なる From を使う場合、MAIL FROM はこちらにしないと拒否されることが多い */
    const smtpEnvelopeFrom =
      process.env.SMTP_ENVELOPE_FROM?.trim() || smtpUser;

    if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom || !notifyTo) {
      return NextResponse.json(
        { ok: false, error: "メール設定が不足しています" },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const d = body.diagnosticData;

    const weakPoints =
      d?.weakPoints && d.weakPoints.length > 0
        ? d.weakPoints.map((p, i) => `${i + 1}. ${p.label}`).join("\n")
        : "なし";

    const inquiryBody = `
会社名：${body.company || ""}
担当者名：${body.name || ""}
メールアドレス：${body.email || ""}
電話番号：${body.phone || ""}
備考：${body.message || ""}`.trim();

    const inquiryBlockInternal = `【問い合わせ情報】\n${inquiryBody}`;
    const inquiryBlockCustomer = `【お問い合わせ内容】\n${inquiryBody}`;

    const diagnosticBlock =
      d != null
        ? `

【診断結果の概要】
事業形態：${businessLabel(d.businessType)}
年商：${d.revenueOku != null ? `${d.revenueOku}億円` : ""}
現在燃料費：${formatOku(d.currentFuelCost)}
原油高コスト増：${formatOku(d.fuelIncreaseCost)}
改善余地：${formatOku(d.improvement)}
吸収率：${
            typeof d.coverage === "number"
              ? `${(d.coverage * 100).toFixed(0)}%`
              : ""
          }
ステータス：${d.status || ""}
改善論点：
${weakPoints}`
        : "";

    const subject = "【物流診断】新規問い合わせがありました";

    const text = `
新しい問い合わせがありました。

${inquiryBlockInternal}

【診断結果】
事業形態：${businessLabel(d?.businessType)}
年商：${d?.revenueOku ? `${d.revenueOku}億円` : ""}
現在燃料費：${formatOku(d?.currentFuelCost)}
原油高コスト増：${formatOku(d?.fuelIncreaseCost)}
改善余地：${formatOku(d?.improvement)}
吸収率：${
  typeof d?.coverage === "number" ? `${(d.coverage * 100).toFixed(0)}%` : ""
}
ステータス：${d?.status || ""}
改善論点：
${weakPoints}
`.trim();

    await transporter.sendMail({
      from: smtpFrom,
      envelope: { from: smtpEnvelopeFrom, to: notifyTo },
      to: notifyTo,
      replyTo: body.email,
      subject,
      text,
    });

    const customerSubject = "【物流診断】お問い合わせを承りました";
    const customerText = `
${body.company} 様

この度は、原油高対応 物流利益改善診断のお問い合わせフォームよりご連絡をいただき、誠にありがとうございます。

${inquiryBlockCustomer}
${diagnosticBlock}

内容を確認のうえ、担当者よりご連絡を差し上げます。
今しばらくお待ちくださいますようお願い申し上げます。

——————————
ダイスリンク株式会社
DICE LINK, Inc.
`.trim();

    const customerTo = body.email.trim();
    await transporter.sendMail({
      from: smtpFrom,
      envelope: { from: smtpEnvelopeFrom, to: customerTo },
      to: customerTo,
      subject: customerSubject,
      text: customerText,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const err = error as Error & { response?: string; responseCode?: number };
    console.error(
      "contact route error:",
      err.message,
      err.response ?? "",
      err.responseCode ?? ""
    );
    return NextResponse.json(
      { ok: false, error: "送信に失敗しました" },
      { status: 500 }
    );
  }
}
