import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { braider_name, braider_email } = await request.json();
  try {
    await resend.emails.send({
      from: "Braidely <hello@braidely.com>",
      to: braider_email,
      subject: "Your Braidely profile is now live",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#2C1A0E;">
        <h1 style="font-size:24px;color:#3D5212;">Welcome to Braidely, ${braider_name}.</h1>
        <p style="font-size:15px;line-height:1.8;margin-top:16px;">Your profile is now live. Clients in your city can already find and book you.</p>
        <a href="https://braidely.com/#braiders" style="display:inline-block;margin-top:24px;background:#3D5212;color:white;padding:14px 28px;text-decoration:none;font-weight:bold;">View Your Profile</a>
        <p style="font-size:13px;color:#9E8070;margin-top:32px;">Need to update your profile? Reply to this email.</p>
        <p style="font-size:13px;color:#9E8070;">The Braidely Team</p>
      </div>`
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
