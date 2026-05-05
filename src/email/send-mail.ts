import { sendEmail } from "@havendor/server-core";
import { appConfig } from "../config";
import { TEmailPayload } from "../type";

export const sendMail = async (payload: TEmailPayload) => {
  await sendEmail(
    {
      host: appConfig.SMTP.host,
      port: appConfig.SMTP.port,
      user: appConfig.SMTP.user,
      pass: appConfig.SMTP.pass,
      secure: false,
    },
    {
      from: payload.from || "[EMAIL_ADDRESS]",
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    },
  );
};
