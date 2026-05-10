import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBraiderWelcome(params: {
  braider_name: string;
  braider_email: string;
}) {
  await resend.emails.send({
    from: "Braidely <onboarding@resend.dev>",
    to: params.braider_email,
    subject: "Your Braidely profile is now live",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #2C1A0E;">
        <h1 style="font-size: 24px; color: #3D5212;">Welcome to Braidely, ${params.braider_name}.</h1>
        <p style="font-size: 15px; line-height: 1.8; margin-top: 16px;">Your profile is now live. Clients in your city can already find and book you.</p>
        <a href="https://braidely.vercel.app/#braiders" style="display: inline-block; margin-top: 24px; background: #3D5212; color: white; padding: 14px 28px; text-decoration: none; font-weight: bold; letter-spacing: 1px;">View Your Profile</a>
        <p style="font-size: 13px; color: #9E8070; margin-top: 32px;">Need to update your profile? Reply to this email and we will help within 24 hours.</p>
        <p style="font-size: 13px; color: #9E8070;">The Braidely Team</p>
      </div>
    `,
  });
}

export async function sendClientConfirmation(params: {
  client_name: string;
  client_email: string;
  braider_name: string;
  style: string;
  date: string;
}) {
  await resend.emails.send({
    from: "Braidely <onboarding@resend.dev>",
    to: params.client_email,
    subject: "Your Braidely booking request has been sent",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #2C1A0E;">
        <h1 style="font-size: 24px; color: #3D5212;">Booking request sent, ${params.client_name}.</h1>
        <p style="font-size: 15px; line-height: 1.8; margin-top: 16px;">Your request has been sent to <strong>${params.braider_name}</strong>.</p>
        <div style="background: #F5F0E8; padding: 20px; margin-top: 24px; border-left: 4px solid #3D5212;">
          <p style="margin: 0; font-size: 14px;"><strong>Style:</strong> ${params.style}</p>
          <p style="margin: 8px 0 0; font-size: 14px;"><strong>Date:</strong> ${params.date}</p>
        </div>
        <p style="font-size: 14px; line-height: 1.8; margin-top: 24px;">Your braider will confirm within 24 hours. Once confirmed you will receive their contact details.</p>
        <p style="font-size: 13px; color: #9E8070; margin-top: 32px;">Need to cancel? Reply to this email.</p>
        <p style="font-size: 13px; color: #9E8070;">The Braidely Team</p>
      </div>
    `,
  });
}

export async function sendBraiderNotification(params: {
  braider_name: string;
  braider_email: string;
  client_name: string;
  style: string;
  date: string;
  client_city: string;
  client_note: string;
}) {
  await resend.emails.send({
    from: "Braidely <onboarding@resend.dev>",
    to: params.braider_email,
    subject: "New booking request on Braidely",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #2C1A0E;">
        <h1 style="font-size: 24px; color: #3D5212;">New booking request, ${params.braider_name}.</h1>
        <div style="background: #F5F0E8; padding: 20px; margin-top: 24px; border-left: 4px solid #3D5212;">
          <p style="margin: 0; font-size: 14px;"><strong>Client:</strong> ${params.client_name}</p>
          <p style="margin: 8px 0 0; font-size: 14px;"><strong>Style:</strong> ${params.style}</p>
          <p style="margin: 8px 0 0; font-size: 14px;"><strong>Date:</strong> ${params.date}</p>
          <p style="margin: 8px 0 0; font-size: 14px;"><strong>City:</strong> ${params.client_city}</p>
          ${params.client_note ? `<p style="margin: 8px 0 0; font-size: 14px;"><strong>Note:</strong> ${params.client_note}</p>` : ""}
        </div>
        <p style="font-size: 14px; line-height: 1.8; margin-top: 24px;">Reply to this email to confirm or decline this booking.</p>
        <p style="font-size: 13px; color: #9E8070; margin-top: 32px;">The Braidely Team</p>
      </div>
    `,
  });
}

export async function sendDayBeforeReminder(params: {
  client_name: string;
  client_email: string;
  braider_name: string;
  braider_whatsapp: string;
  braider_instagram: string;
  style: string;
  date: string;
}) {
  await resend.emails.send({
    from: "Braidely <onboarding@resend.dev>",
    to: params.client_email,
    subject: "Your appointment is tomorrow",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #2C1A0E;">
        <h1 style="font-size: 24px; color: #3D5212;">Your appointment is tomorrow, ${params.client_name}.</h1>
        <div style="background: #F5F0E8; padding: 20px; margin-top: 24px; border-left: 4px solid #3D5212;">
          <p style="margin: 0; font-size: 14px;"><strong>Braider:</strong> ${params.braider_name}</p>
          <p style="margin: 8px 0 0; font-size: 14px;"><strong>Style:</strong> ${params.style}</p>
          <p style="margin: 8px 0 0; font-size: 14px;"><strong>Date:</strong> ${params.date}</p>
        </div>
        <p style="font-size: 15px; font-weight: bold; margin-top: 24px; color: #3D5212;">Contact your braider:</p>
        <p style="font-size: 14px; margin-top: 8px;">WhatsApp: <a href="https://wa.me/${params.braider_whatsapp}" style="color: #3D5212;">${params.braider_whatsapp}</a></p>
        ${params.braider_instagram ? `<p style="font-size: 14px; margin-top: 4px;">Instagram: <a href="https://instagram.com/${params.braider_instagram}" style="color: #3D5212;">${params.braider_instagram}</a></p>` : ""}
        <p style="font-size: 13px; color: #9E8070; margin-top: 32px;">Need to cancel? Reply to this email as soon as possible.</p>
        <p style="font-size: 13px; color: #9E8070;">The Braidely Team</p>
      </div>
    `,
  });
}
