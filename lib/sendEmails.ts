import emailjs from "@emailjs/browser";
import {
  EMAILJS_SERVICE_ID,
  EMAILJS_TEMPLATE_ID_BRAIDER,
  EMAILJS_TEMPLATE_ID_CLIENT,
  EMAILJS_PUBLIC_KEY,
} from "./emailjs";

export async function sendBraiderNotification(params: {
  braider_name: string;
  braider_email: string;
  client_name: string;
  style: string;
  date: string;
  client_city: string;
  client_note: string;
}) {
  await emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID_BRAIDER,
    params,
    EMAILJS_PUBLIC_KEY
  );
}

export async function sendClientConfirmation(params: {
  client_name: string;
  client_email: string;
  braider_name: string;
  braider_city: string;
  style: string;
  date: string;
}) {
  await emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID_CLIENT,
    params,
    EMAILJS_PUBLIC_KEY
  );
}