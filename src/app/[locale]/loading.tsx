export default function HomeLoading() {
  return (
    <div className="min-h-screen animate-pulse bg-background">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="h-4 w-32 rounded-sm bg-border" />
        <div className="mt-4 h-12 max-w-lg rounded-sm bg-border" />
        <div className="mt-6 h-24 max-w-2xl rounded-sm bg-surface" />
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <div className="h-48 rounded-sm bg-surface" />
          <div className="h-48 rounded-sm bg-surface" />
        </div>
      </div>
    </div>
  );
}
