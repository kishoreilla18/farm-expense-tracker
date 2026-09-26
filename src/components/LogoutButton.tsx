"use client";

import { signOut } from "@/app/actions";
import { SubmitButton } from "./SubmitButton";

export default function LogoutButton() {
  return (
    <form action={signOut}>
      <SubmitButton
        loadingText="Logging out..."
        className="rounded-lg border border-ink/20 bg-transparent px-2.5 py-1 text-xs font-medium text-ink/70 hover:bg-ink/5 hover:text-ink transition-colors"
      >
        Log out
      </SubmitButton>
    </form>
  );
}
