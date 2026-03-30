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

function buildMessages(body: ContactPayload) {
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

  const subjectInternal = "【物流診断】新規問い合わせがありました";

  const textInternal = `
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

  return {
    subjectInternal,
    textInternal,
    customerSubject,
    customerText,
  };
}

async function sendWithResend(opts: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}) {
  const payload: Record<string, unknown> = {
    from: opts.from,
    to: [opts.to],
    subject: opts.subject,
    text: opts.text,
  };
  if (opts.replyTo) {
    payload.reply_to = opts.replyTo;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as {
    message?: string;
    name?: string;
  };

  if (!res.ok) {
    const msg =
      typeof data.message === "string"
        ? data.message
        : `Resend API error (${res.status})`;
    throw new Error(msg);
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

    const notifyTo = process.env.NOTIFY_EMAIL_TO?.trim();
    const {
      subjectInternal,
      textInternal,
      customerSubject,
      customerText,
    } = buildMessages(body);
    const customerTo = body.email.trim();

    const resendKey = process.env.RESEND_API_KEY?.trim();
    const resendFrom =
      process.env.RESEND_FROM?.trim() || process.env.SMTP_FROM?.trim();

    if (resendKey) {
      const missingEnv: string[] = [];
      if (!notifyTo) missingEnv.push("NOTIFY_EMAIL_TO");
      if (!resendFrom) missingEnv.push("RESEND_FROM");
      if (missingEnv.length > 0) {
        console.warn("[contact] Resend env missing:", missingEnv.join(", "));
        return NextResponse.json(
          {
            ok: false,
            failure: "config" as const,
            error: "メール設定が不足しています（Resend）",
            missingEnv,
          },
          { status: 500 }
        );
      }

      const fromAddr = resendFrom as string;
      const notify = notifyTo as string;

      await sendWithResend({
        apiKey: resendKey,
        from: fromAddr,
        to: notify,
        subject: subjectInternal,
        text: textInternal,
        replyTo: body.email.trim(),
      });

      await sendWithResend({
        apiKey: resendKey,
        from: fromAddr,
        to: customerTo,
        subject: customerSubject,
        text: customerText,
      });

      return NextResponse.json({ ok: true });
    }

    const smtpHost = process.env.SMTP_HOST?.trim();
    const smtpPort = Number(process.env.SMTP_PORT?.trim() || 587);
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();
    const smtpFrom = process.env.SMTP_FROM?.trim();
    const smtpEnvelopeFrom =
      process.env.SMTP_ENVELOPE_FROM?.trim() || smtpUser;

    const missingEnv: string[] = [];
    if (!smtpHost) missingEnv.push("SMTP_HOST");
    if (!smtpUser) missingEnv.push("SMTP_USER");
    if (!smtpPass) missingEnv.push("SMTP_PASS");
    if (!smtpFrom) missingEnv.push("SMTP_FROM");
    if (!notifyTo) missingEnv.push("NOTIFY_EMAIL_TO");

    if (missingEnv.length > 0) {
      console.warn("[contact] SMTP env missing:", missingEnv.join(", "));
      return NextResponse.json(
        {
          ok: false,
          failure: "config" as const,
          error:
            "メール設定が不足しています。Vercel 本番では RESEND_API_KEY・RESEND_FROM・NOTIFY_EMAIL_TO の併用を推奨します。",
          missingEnv,
        },
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
      connectionTimeout: 25_000,
      greetingTimeout: 25_000,
      socketTimeout: 25_000,
    });

    await transporter.sendMail({
      from: smtpFrom,
      envelope: { from: smtpEnvelopeFrom!, to: notifyTo },
      to: notifyTo,
      replyTo: body.email,
      subject: subjectInternal,
      text: textInternal,
    });

    await transporter.sendMail({
      from: smtpFrom,
      envelope: { from: smtpEnvelopeFrom!, to: customerTo },
      to: customerTo,
      subject: customerSubject,
      text: customerText,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const err = error as Error & { response?: string; responseCode?: number };
    console.error(
      "[contact] send failed:",
      err.message,
      err.response ?? "",
      err.responseCode ?? "",
      error
    );
    return NextResponse.json(
      {
        ok: false,
        failure: "smtp" as const,
        error:
          "メールの送信に失敗しました。Resend を利用している場合はダッシュボードでドメイン・API キーを確認してください。SMTP の場合はサーバーがリレーを拒否していないか確認してください。詳細は Vercel の Logs を参照してください。",
      },
      { status: 500 }
    );
  }
}
