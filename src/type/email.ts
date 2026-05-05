export type TEmailPayload = {
  to: string;
  from?: string;
  html?: string;
  subject: string;
  text?: string;
};
