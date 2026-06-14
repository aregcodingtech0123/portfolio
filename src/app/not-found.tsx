import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center text-slate-200">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-400">
        404
      </p>
      <h1 className="mt-4 text-3xl font-bold text-slate-50">Page not found</h1>
      <p className="mt-3 max-w-md text-slate-400">
        The page you are looking for does not exist or has moved.
      </p>
      <Link
        href="/en"
        className="mt-10 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-8 py-3 text-sm font-semibold text-slate-950"
      >
        Go home
      </Link>
    </div>
  );
}
