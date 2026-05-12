import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { client_name, client_email, braider_name, style, date } = await request.json();
  try {
    await resend.emails.send({
      from: "Braidely <onboarding@resend.dev>",
      to: client_email,
      subject: "Your Braidely booking request has been sent",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#2C1A0E;">
        <h1 style="font-size:24px;color:#3D5212;">Booking request sent, ${client_name}.</h1>
        <p style="font-size:15px;line-height:1.8;margin-top:16px;">Your request has been sent to <strong>${braider_name}</strong>.</p>
        <div style="background:#F5F0E8;padding:20px;margin-top:24px;border-left:4px solid #3D5212;">
          <p style="margin:0;font-size:14px;"><strong>Style:</strong> ${style}</p>
          <p style="margin:8px 0 0;font-size:14px;"><strong>Date:</strong> ${date}</p>
        </div>
        <p style="font-size:14px;line-height:1.8;margin-top:24px;">Your braider will confirm within 24 hours.</p>
        <p style="font-size:13px;color:#9E8070;margin-top:32px;">The Braidely Team</p>
      </div>`
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
