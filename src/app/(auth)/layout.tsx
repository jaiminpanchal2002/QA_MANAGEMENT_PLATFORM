import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-lg font-semibold"
      >
        <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
          Q
        </span>
        QA Platform
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
