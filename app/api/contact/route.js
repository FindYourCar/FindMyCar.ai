import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { name, email, message } = await req.json();

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 },
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || "contact@findmycar.app";
    const toEmail = process.env.RESEND_TO_EMAIL || "06fryderyk@gmail.com";

    if (!apiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured." },
        { status: 500 },
      );
    }

    const subject = `FindMyCar website message from ${name}`;
    const text = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
    const html = `
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, "<br />")}</p>
      <hr />
      <p>This message was sent from the FindMyCar website contact form.</p>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: toEmail,
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return NextResponse.json(
        { error: `Resend API request failed: ${errorBody}` },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
