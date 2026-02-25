import { NextResponse } from "next/server";
import { Resend } from "resend";

type LeadPayload = {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  storeUrl?: string;
  revenueStream?: string;
  message?: string;
};

export async function POST(request: Request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY || process.env.NEXT_PUBLIC_RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json(
        { error: "Email service is not configured. Set RESEND_API_KEY in your server environment." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as LeadPayload;
    const fullName = body.fullName?.trim() ?? "";
    const phoneNumber = body.phoneNumber?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const storeUrl = body.storeUrl?.trim() ?? "";
    const revenueStream = body.revenueStream?.trim() ?? "";
    const message = body.message?.trim() ?? "";

    if (!fullName || !phoneNumber || !email || !revenueStream) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const resend = new Resend(resendApiKey);
    const toEmail = "timothytitenokspam@gmail.com";
    const fromEmail = "onboarding@resend.dev";

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: `New Stratova call request: ${fullName}`,
      replyTo: email,
      text: [
        "New book a call request",
        `Full name: ${fullName}`,
        `Phone number: ${phoneNumber}`,
        `Email: ${email}`,
        `Store URL: ${storeUrl || "N/A (needs build from scratch)"}`,
        `Revenue stream: ${revenueStream}`,
        `Message: ${message || "N/A"}`,
      ].join("\n"),
      html: `
        <h2>New book a call request</h2>
        <p><strong>Full name:</strong> ${fullName}</p>
        <p><strong>Phone number:</strong> ${phoneNumber}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Store URL:</strong> ${storeUrl || "N/A (needs build from scratch)"}</p>
        <p><strong>Revenue stream:</strong> ${revenueStream}</p>
        <p><strong>Message:</strong> ${message || "N/A"}</p>
      `,
    });
    if (error) {
      const resendErrorMessage = typeof error.message === "string" && error.message.length > 0 ? error.message : "Unable to send email.";
      return NextResponse.json({ error: `Resend error: ${resendErrorMessage}` }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
