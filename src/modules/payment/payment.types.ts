export type TPaymentRequiredInput = {
  type: "text" | "radio" | "select";
  name: string;
  hash: string;
  is_required: boolean;
  enums?: string[] | null;
};

export type TPaymentInfoSubmit = {
  hash: string;
  value?: string | null;
};

export type TPaymentInfoSnapshot = {
  name: string;
  value: string | null;
  hash: string;
};
