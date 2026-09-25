import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-3xl font-semibold text-forest">Not found</h1>
      <p className="mt-2 text-ink/60">That field doesn&apos;t exist or isn&apos;t yours.</p>
      <Link href="/dashboard" className="btn-primary mt-6">Back to dashboard</Link>
    </main>
  );
}
