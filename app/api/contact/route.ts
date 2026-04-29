import { NextResponse } from "next/server";

type ContactPayload = {
  name?: string;
  email?: string;
  projectType?: string;
  timeline?: string;
  message?: string;
};

const emailPattern = /^\S+@\S+\.\S+$/;

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ContactPayload;
    const name = payload.name?.trim();
    const email = payload.email?.trim();
    const projectType = payload.projectType?.trim();
    const timeline = payload.timeline?.trim();
    const message = payload.message?.trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 },
      );
    }

    if (!emailPattern.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.CONTACT_FROM_EMAIL;
    const toEmail = process.env.CONTACT_TO_EMAIL;

    if (!apiKey || !fromEmail || !toEmail) {
      return NextResponse.json(
        {
          error:
            "Contact email is not configured yet. Set RESEND_API_KEY, CONTACT_FROM_EMAIL, and CONTACT_TO_EMAIL.",
        },
        { status: 500 },
      );
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: `Project enquiry from ${name}`,
        reply_to: email,
        text: [
          `Name: ${name}`,
          `Email: ${email}`,
          `Project type: ${projectType ?? "Not specified"}`,
          `Timeline: ${timeline ?? "Not specified"}`,
          "",
          message,
        ].join("\n"),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return NextResponse.json(
        {
          error: "Message delivery failed.",
          details: errorBody,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to process the contact request." },
      { status: 500 },
    );
  }
}
