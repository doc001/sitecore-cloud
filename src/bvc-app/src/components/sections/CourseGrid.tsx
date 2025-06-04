// components/sections/CourseGrid.tsx
import Link from 'next/link';
import { Course } from '@/types/course';

export default function CourseGrid({ courses }: { courses: Course[] }) {
  return (
    <div className="space-y-8">
      <div className="text-base text-neutral-60">
        Showing <span className="text-[color:var(--color-blue-100)]">{courses.length}</span> results of <span className="text-[color:var(--color-blue-100)]">{courses.length}</span> items.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course, index) => (
          <div key={index} className="rounded-lg border border-neutral-20 p-6 shadow-sm">
            <p className="text-sm font-medium text-neutral-60 mb-2">{course.area}</p>
            <Link href={course.href} className="text-lg font-semibold text-blue-600 hover:underline">
              {course.name}
            </Link>
            <p className="text-sm text-neutral-60 mt-2">{course.description}</p>
            <div className="mt-4">
              <Link
                href={course.href}
                className="inline-flex items-center gap-2 rounded bg-[color:var(--color-purple-100)] text-white px-4 py-2 hover:bg-[color:var(--color-purple--100-tr-80)]"
              >
                <span className="material-icon">shopping_cart</span>
                <span>View course</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
