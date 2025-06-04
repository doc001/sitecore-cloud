'use client';

import { useState } from 'react';

export default function HeroBanner() {
  const [query, setQuery] = useState('Open Studies');

  return (
    <section className="bg-program-gradient py-20 text-white">
      <div className="container-layout max-w-screen-xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-semibold mb-8 leading-tight">
          Search results
        </h1>
        <form
          action="/search"
          method="GET"
          className="flex flex-col sm:flex-row gap-4"
        >
          <input
            type="search"
            name="query"
            id="search"
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            maxLength={256}
            className="w-full sm:flex-1 px-6 py-3 text-black text-base rounded-md border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="submit"
            value="Search"
            className="w-full sm:w-auto px-6 py-3 bg-[--color-blue-100] text-white rounded-md font-medium hover:bg-blue-500 transition"
          />
        </form>
      </div>
    </section>
  );
}
