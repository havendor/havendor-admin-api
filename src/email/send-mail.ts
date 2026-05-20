import { sendEmail } from "@havendor/server-core";
import { appConfig } from "../config/index.js";
import { TEmailPayload } from "../type/index.js";

export const sendMail = async (
  payload: TEmailPayload,
): Promise<{ status: boolean; message: string }> => {
  const result = await sendEmail(
    {
      host: appConfig.SMTP.host,
      port: appConfig.SMTP.port,
      user: appConfig.SMTP.user,
      pass: appConfig.SMTP.pass,
      secure: false,
    },
    {
      from: `no-replay@${appConfig.EMAIL_DOMAIN}`,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    },
  );

  return { status: result.success, message: result.messageId || "" };
};
