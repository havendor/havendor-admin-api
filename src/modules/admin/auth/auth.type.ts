import z from "zod";
import { AuthDto } from "./auth.dto";

export type TSignIn = z.infer<typeof AuthDto.signIn>["body"];
export type TChangePassword = z.infer<typeof AuthDto.changePassword>["body"];
export type TRefresh = z.infer<typeof AuthDto.refresh>["cookies"];
