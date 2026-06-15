export const runtime = 'nodejs';

import { Resend } from 'resend';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('Missing RESEND_API_KEY');
      return NextResponse.json({ error: 'Email service is not configured.' }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    const { name, email, subject, message, honeypot } = await request.json();

    if (honeypot) return NextResponse.json({ success: true });

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email and message are required.' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    await resend.emails.send({
      from: 'FindMyCar <onboarding@resend.dev>',
      to: ['06fryderyk@gmail.com'],
      replyTo: email,
      subject: `[FindMyCar] ${subject || 'New message'} — from ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0a0908;padding:24px;border-radius:12px 12px 0 0;">
            <h2 style="color:#fbbf24;margin:0;">FindMyCar — New Contact Message</h2>
          </div>
          <div style="background:#1a1a1a;padding:24px;border-radius:0 0 12px 12px;color:#fff;">
            <p><strong style="color:#fbbf24;">From:</strong> ${name}</p>
            <p><strong style="color:#fbbf24;">Email:</strong> <a href="mailto:${email}" style="color:#fff;">${email}</a></p>
            <p><strong style="color:#fbbf24;">Subject:</strong> ${subject || '(none)'}</p>
            <hr style="border-color:#333;margin:16px 0;">
            <p><strong style="color:#fbbf24;">Message:</strong></p>
            <p style="line-height:1.6;white-space:pre-wrap;">${message.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
            <hr style="border-color:#333;margin:16px 0;">
            <p style="color:#666;font-size:12px;">
              ${new Date().toLocaleString('en-NL', { timeZone: 'Europe/Amsterdam' })} · Amsterdam
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Resend error:', err);
    return NextResponse.json({ error: 'Failed to send. Please email us directly.' }, { status: 500 });
  }
}
