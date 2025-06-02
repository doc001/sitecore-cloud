// components/pages/ProgramList.tsx

'use client';

import React from 'react';

export default function ProgramList() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-6">Program List</h1>
      {/* Example content */}
      <ul className="list-disc pl-6">
        <li>Business Administration</li>
        <li>Technology Fundamentals</li>
        <li>Health & Wellness</li>
      </ul>
    </main>
  );
}
