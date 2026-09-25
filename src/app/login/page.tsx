import Link from "next/link";
import { signIn } from "@/app/actions";
import { getRandomQuote } from "@/lib/quotes";

export default function LoginPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  const quote = getRandomQuote();

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
      <div className="flex items-center gap-3 mb-2">
        <img
          src="/icons/icon-main.jpg"
          alt="Farm Emblem Logo"
          className="h-12 w-12 rounded-xl shadow-md border border-forest/20 object-cover"
        />
        <h1 className="font-display text-3xl font-semibold text-forest">Farm Expense Tracker</h1>
      </div>
      <p className="mt-1 text-ink/70">Log in to track spending on your fields.</p>

      <div className="mt-4 rounded-lg border border-sprout/30 bg-sprout/10 p-3 text-xs italic text-forest">
        🌱 &quot;{quote}&quot;
      </div>

      {searchParams.error && (
        <p className="mt-4 rounded-md bg-clay/10 px-4 py-3 text-sm text-clay">
          {searchParams.error}
        </p>
      )}

      <form action={signIn} className="mt-8 flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">Email</label>
          <input type="email" name="email" required className="field-input" placeholder="you@example.com" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">Password</label>
          <input type="password" name="password" required className="field-input" placeholder="••••••••" />
        </div>
        <button type="submit" className="btn-primary mt-2 w-full">Log in</button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/70">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-forest underline underline-offset-2">
          Create an account
        </Link>
      </p>
    </main>
  );
}
