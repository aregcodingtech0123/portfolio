import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-background px-6 text-center text-foreground">
      <p className="font-mono text-sm tracking-widest text-accent uppercase">
        404
      </p>
      <h1 className="mt-4 font-heading text-3xl font-bold text-foreground">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-muted">
        The page you are looking for does not exist or has moved.
      </p>
      <Link href="/en" className={`mt-10 ${buttonClasses("primary")}`}>
        Go home
      </Link>
    </div>
  );
}
