import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase-admin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  try {
    const snap = await adminDb
      .collection("bookings")
      .where("status", "==", "confirmed")
      .where("date", "==", tomorrowStr)
      .get();

    const results: string[] = [];

    for (const bookingDoc of snap.docs) {
      const booking = bookingDoc.data();

      let whatsapp = "";
      let instagram = "";
      if (booking.braiderId) {
        try {
          const braiderSnap = await adminDb.collection("braiders").doc(booking.braiderId).get();
          if (braiderSnap.exists) {
            whatsapp = braiderSnap.data()?.whatsapp || "";
            instagram = braiderSnap.data()?.instagram || "";
          }
        } catch {
          // Continue without contact details
        }
      }

      await resend.emails.send({
        from: "Braidely <hello@braidely.com>",
        to: booking.clientEmail,
        subject: `Your appointment is tomorrow — ${booking.braiderName}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#2C1A0E;">
          <h1 style="font-size:24px;color:#3D5212;">Your appointment is tomorrow, ${booking.clientName}.</h1>
          <div style="background:#F5F0E8;padding:20px;margin-top:24px;border-left:4px solid #3D5212;">
            <p style="margin:0;font-size:14px;"><strong>Braider:</strong> ${booking.braiderName}</p>
            <p style="margin:8px 0 0;font-size:14px;"><strong>Style:</strong> ${booking.style}</p>
            <p style="margin:8px 0 0;font-size:14px;"><strong>Date:</strong> ${booking.date}</p>
          </div>
          <div style="background:#E8EDE0;padding:20px;margin-top:24px;border-left:4px solid #6B8F5E;">
            <p style="margin:0;font-size:14px;font-weight:bold;color:#3D5212;">Your braider's contact</p>
            ${whatsapp ? `<p style="margin:8px 0 0;font-size:14px;"><strong>WhatsApp:</strong> ${whatsapp}</p>` : ""}
            ${instagram ? `<p style="margin:8px 0 0;font-size:14px;"><strong>Instagram:</strong> ${instagram}</p>` : ""}
          </div>
          <div style="background:#FDF6EE;padding:20px;margin-top:24px;border-left:4px solid #C8A97A;">
            <p style="margin:0;font-size:14px;font-weight:bold;">A few reminders</p>
            <p style="margin:8px 0 0;font-size:14px;">Message your braider today to confirm the time and location.</p>
            <p style="margin:8px 0 0;font-size:14px;">Meet in a public place or shared space for your first appointment.</p>
            <p style="margin:8px 0 0;font-size:14px;">Come with clean, detangled hair to make the most of your session.</p>
            <p style="margin:8px 0 0;font-size:14px;">If anything feels wrong, trust your instincts and contact us by replying to this email.</p>
          </div>
          <p style="font-size:13px;color:#9E8070;margin-top:32px;">Enjoy your appointment. The Braidely Team</p>
        </div>`
      });

      results.push(bookingDoc.id);
    }

    return NextResponse.json({ sent: results.length, bookings: results });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
