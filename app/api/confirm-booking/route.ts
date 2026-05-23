import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebase-admin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  const bookingId = request.nextUrl.searchParams.get("id");
  if (!bookingId) {
    return new NextResponse("Missing booking ID", { status: 400 });
  }

  try {
    const bookingRef = adminDb.collection("bookings").doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return new NextResponse("Booking not found", { status: 404 });
    }

    const booking = bookingSnap.data()!;

    if (booking.status === "confirmed") {
      return new NextResponse(`
        <html><body style="font-family:Arial,sans-serif;max-width:600px;margin:80px auto;padding:0 20px;color:#2C1A0E;">
          <h2 style="color:#3D5212;">Already confirmed</h2>
          <p>This booking has already been confirmed.</p>
        </body></html>
      `, { headers: { "Content-Type": "text/html" } });
    }

    // Look up braider contact details
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
        // Continue without contact details if lookup fails
      }
    }

    // Update booking status to confirmed
    await bookingRef.update({ status: "confirmed" });

    // Send client confirmation with WhatsApp + Instagram only
    const hasContact = whatsapp || instagram;

    await resend.emails.send({
      from: "Braidely <hello@braidely.com>",
      to: booking.clientEmail,
      subject: `Your booking with ${booking.braiderName} is confirmed`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#2C1A0E;">
        <h1 style="font-size:24px;color:#3D5212;">You're booked, ${booking.clientName}.</h1>
        <p style="font-size:15px;line-height:1.8;margin-top:16px;">Your appointment with <strong>${booking.braiderName}</strong> is confirmed.</p>
        <div style="background:#F5F0E8;padding:20px;margin-top:24px;border-left:4px solid #3D5212;">
          <p style="margin:0;font-size:14px;"><strong>Style:</strong> ${booking.style}</p>
          <p style="margin:8px 0 0;font-size:14px;"><strong>Date:</strong> ${booking.date}</p>
        </div>
        ${hasContact ? `
        <div style="background:#E8EDE0;padding:20px;margin-top:24px;border-left:4px solid #6B8F5E;">
          <p style="margin:0;font-size:14px;font-weight:bold;color:#3D5212;">Contact your braider now</p>
          ${whatsapp ? `<p style="margin:8px 0 0;font-size:14px;"><strong>WhatsApp:</strong> ${whatsapp}</p>` : ""}
          ${instagram ? `<p style="margin:8px 0 0;font-size:14px;"><strong>Instagram:</strong> ${instagram}</p>` : ""}
        </div>
        <p style="font-size:14px;line-height:1.8;margin-top:24px;">We encourage you to message your braider now to discuss your style, hair length, and any questions before the appointment.</p>
        ` : `
        <p style="font-size:14px;line-height:1.8;margin-top:24px;">Your braider will contact you shortly to discuss the details.</p>
        `}
        <p style="font-size:13px;color:#9E8070;margin-top:32px;">The Braidely Team</p>
      </div>`
    });

    return new NextResponse(`
      <html><body style="font-family:Arial,sans-serif;max-width:600px;margin:80px auto;padding:0 20px;color:#2C1A0E;">
        <h2 style="color:#3D5212;">Booking confirmed.</h2>
        <p style="font-size:16px;margin-top:16px;">${booking.clientName} has been notified with your contact details.</p>
        <p style="font-size:14px;color:#7A5C48;margin-top:12px;">You can expect them to reach out via WhatsApp soon.</p>
      </body></html>
    `, { headers: { "Content-Type": "text/html" } });

  } catch (error) {
    console.error("Confirm booking error:", error);
    return new NextResponse("Something went wrong", { status: 500 });
  }
}
