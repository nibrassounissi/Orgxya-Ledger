import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | Orgaxya Ledger",
  description: "Create an Orgaxya Ledger account",
};

export default function SignUp() {
  return <SignUpForm />;
}
