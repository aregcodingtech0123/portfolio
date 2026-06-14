export default function HomeLoading() {
  return (
    <div className="min-h-screen animate-pulse bg-white dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-4 h-12 max-w-lg rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="mt-6 h-24 max-w-2xl rounded-xl bg-slate-100 dark:bg-slate-900" />
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <div className="h-48 rounded-3xl bg-slate-100 dark:bg-slate-900" />
          <div className="h-48 rounded-3xl bg-slate-100 dark:bg-slate-900" />
        </div>
      </div>
    </div>
  );
}
