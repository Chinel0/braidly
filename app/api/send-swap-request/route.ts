import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const {
    requester_name,
    requester_email,
    requester_whatsapp,
    requester_message,
    target_name,
    target_email,
    target_whatsapp,
  } = await request.json();

  try {
    // Email 1 — to the TARGET buddy
    await resend.emails.send({
      from: "Braidely <hello@braidely.com>",
      to: target_email,
      subject: `${requester_name} wants to swap braiding with you`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#2C1A0E;">
        <h1 style="font-size:24px;color:#3D5212;">Someone wants to swap with you, ${target_name}.</h1>
        <p style="font-size:15px;line-height:1.8;margin-top:16px;"><strong>${requester_name}</strong> saw your Braid Buddy profile on Braidely and wants to swap braiding with you.</p>
        ${requester_message ? `
        <div style="background:#F5F0E8;padding:20px;margin-top:24px;border-left:4px solid #3D5212;">
          <p style="margin:0;font-size:14px;font-style:italic;">"${requester_message}"</p>
        </div>
        ` : ""}
        <div style="background:#E8EDE0;padding:20px;margin-top:24px;border-left:4px solid #6B8F5E;">
          <p style="margin:0;font-size:14px;font-weight:bold;color:#3D5212;">Here is their WhatsApp</p>
          <p style="margin:8px 0 0;font-size:16px;font-weight:bold;">${requester_whatsapp}</p>
        </div>
        <p style="font-size:14px;line-height:1.8;margin-top:24px;">Reach out to ${requester_name} directly on WhatsApp to arrange your swap.</p>
        <p style="font-size:13px;color:#9E8070;margin-top:32px;">The Braidely Team</p>
      </div>`,
    });

    // Email 2 — to the REQUESTER
    await resend.emails.send({
      from: "Braidely <hello@braidely.com>",
      to: requester_email,
      subject: "Your swap request has been sent",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#2C1A0E;">
        <h1 style="font-size:24px;color:#3D5212;">Your swap request has been sent, ${requester_name}.</h1>
        <p style="font-size:15px;line-height:1.8;margin-top:16px;">We've notified <strong>${target_name}</strong> that you want to swap braiding with them.</p>
        <div style="background:#E8EDE0;padding:20px;margin-top:24px;border-left:4px solid #6B8F5E;">
          <p style="margin:0;font-size:14px;font-weight:bold;color:#3D5212;">Here is their WhatsApp</p>
          <p style="margin:8px 0 0;font-size:16px;font-weight:bold;">${target_whatsapp}</p>
        </div>
        <p style="font-size:14px;line-height:1.8;margin-top:24px;">You can reach out to ${target_name} directly on WhatsApp if you'd like to connect sooner.</p>
        <p style="font-size:13px;color:#9E8070;margin-top:32px;">The Braidely Team</p>
      </div>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Failed to send swap request emails" }, { status: 500 });
  }
}
