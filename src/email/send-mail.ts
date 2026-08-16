import { sendEmail } from "@havendor/server-core";
import { APP_CONFIG } from "../config/index.js";
import { TEmailPayload } from "../type/index.js";

export const sendMail = async (
  payload: TEmailPayload,
): Promise<{ status: boolean; message: string }> => {
  const result = await sendEmail(
    {
      host: APP_CONFIG.SMTP.host,
      port: APP_CONFIG.SMTP.port,
      user: APP_CONFIG.SMTP.user,
      pass: APP_CONFIG.SMTP.pass,
      secure: false,
    },
    {
      from: `no-replay@${APP_CONFIG.EMAIL_DOMAIN}`,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    },
  );

  return { status: result.success, message: result.messageId || "" };
};
