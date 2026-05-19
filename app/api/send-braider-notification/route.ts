import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function escapeHtml(str: string) {
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

export async function POST(request: Request) {
  const { braider_name, braider_email, client_name, client_email, style, date, note, booking_id } = await request.json();
  if (!isValidEmail(braider_email) || !isValidEmail(client_email)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (!braider_name || !client_name || !style || !date || !booking_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  try {
    await resend.emails.send({
      from: "Braidely <hello@braidely.com>",
      to: braider_email,
      subject: `New booking request from ${escapeHtml(client_name)}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#2C1A0E;">
        <h1 style="font-size:24px;color:#3D5212;">New booking request, ${escapeHtml(braider_name)}.</h1>
        <div style="background:#F5F0E8;padding:20px;margin-top:24px;border-left:4px solid #3D5212;">
          <p style="margin:0;font-size:14px;"><strong>Client:</strong> ${escapeHtml(client_name)}</p>
          <p style="margin:8px 0 0;font-size:14px;"><strong>Style:</strong> ${escapeHtml(style)}</p>
          <p style="margin:8px 0 0;font-size:14px;"><strong>Date:</strong> ${escapeHtml(date)}</p>
          ${note ? `<p style="margin:8px 0 0;font-size:14px;"><strong>Note:</strong> ${escapeHtml(note)}</p>` : ""}
        </div>
        <p style="font-size:14px;line-height:1.8;margin-top:24px;">Click below to confirm this booking. The client will receive your WhatsApp and Instagram so they can reach you.</p>
        <a href="https://braidely.com/api/confirm-booking?id=${booking_id}" style="display:inline-block;margin-top:24px;background:#3D5212;color:white;padding:14px 32px;text-decoration:none;font-weight:bold;font-family:Arial,sans-serif;font-size:14px;letter-spacing:1px;">CONFIRM BOOKING</a>
        <p style="font-size:13px;color:#9E8070;margin-top:32px;">If you cannot take this booking, simply ignore this email.</p>
        <p style="font-size:13px;color:#9E8070;">The Braidely Team</p>
      </div>`
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
