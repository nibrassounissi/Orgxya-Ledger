import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Orgaxya Ledger",
  description: "Sign in to Orgaxya Ledger",
};

export default function SignIn() {
  return <SignInForm />;
}
