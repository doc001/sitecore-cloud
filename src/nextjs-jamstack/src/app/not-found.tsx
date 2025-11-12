// Server Component (no "use client" and NO hooks)
export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="mt-2 opacity-80">
        The page you’re looking for doesn’t exist.
      </p>
    </main>
  );
}
