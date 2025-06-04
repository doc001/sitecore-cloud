// components/pages/ProgramList.tsx

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

// TypeScript interface for the transformed program data
interface ProgramData {
  name: string;
  programType: string;
  availableIntakes: string;
  slug: string;
  shortDescription: string;
  duration: string;
  code: string;
  school: string;
  programArea: string;
  pgwp: boolean;
}

// Props interface for the ProgramList component
interface ProgramListProps {
  programs: ProgramData[];
}

/**
 * ProgramList Component
 * 
 * Displays a comprehensive, filterable list of programs with search functionality.
 * Includes filtering by program type, school, and search capabilities.
 * 
 * @param {ProgramListProps} props - Component props containing programs array
 * @returns {React.JSX.Element} The program list component
 */
export default function ProgramList({ programs }: ProgramListProps): React.JSX.Element {
  // State for search and filter functionality
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedProgramType, setSelectedProgramType] = useState<string>('all');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  // Extract unique values for filter options
  const programTypes = useMemo(() => {
    const types = [...new Set(programs.map(program => program.programType))].filter(Boolean);
    return types.sort();
  }, [programs]);

  const schools = useMemo(() => {
    const schoolList = [...new Set(programs.map(program => program.school))].filter(Boolean);
    return schoolList.sort();
  }, [programs]);

  // Filter and sort programs based on current filters
  const filteredAndSortedPrograms = useMemo(() => {
    let filtered = programs.filter(program => {
      const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           program.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           program.code.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedProgramType === 'all' || program.programType === selectedProgramType;
      const matchesSchool = selectedSchool === 'all' || program.school === selectedSchool;
      
      return matchesSearch && matchesType && matchesSchool;
    });

    // Sort programs based on selected criteria
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.programType.localeCompare(b.programType);
        case 'duration':
          return a.duration.localeCompare(b.duration);
        default:
          return 0;
      }
    });

    return filtered;
  }, [programs, searchTerm, selectedProgramType, selectedSchool, sortBy]);

  /**
   * Formats the program type for display
   * @param {string} type - The program type string
   * @returns {string} Formatted program type
   */
  const formatProgramType = (type: string): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  /**
   * Formats the school name for display
   * @param {string} school - The school string
   * @returns {string} Formatted school name
   */
  const formatSchoolName = (school: string): string => {
    return school.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  /**
   * Formats the intake information for display
   * @param {string} intakes - The available intakes string
   * @returns {string[]} Array of formatted intake terms
   */
  const formatIntakes = (intakes: string): string[] => {
    if (!intakes) return [];
    return intakes.split(';').map(intake => intake.trim()).filter(Boolean);
  };

  /**
   * Clears all filters and search
   */
  const clearAllFilters = (): void => {
    setSearchTerm('');
    setSelectedProgramType('all');
    setSelectedSchool('all');
    setSortBy('name');
  };

  return (
    <div className="w-full">
      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-10 p-6 mb-8">
        <h3 className="text-xl font-semibold text-neutral-80 mb-6">
          Find Your Program
        </h3>
        
        {/* Search Input */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
          <div className="lg:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-neutral-70 mb-2">
              Search Programs
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by program name, code, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-20 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-100 outline-none transition-colors"
            />
          </div>

          {/* Program Type Filter */}
          <div>
            <label htmlFor="programType" className="block text-sm font-medium text-neutral-70 mb-2">
              Program Type
            </label>
            <select
              id="programType"
              value={selectedProgramType}
              onChange={(e) => setSelectedProgramType(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-20 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-100 outline-none transition-colors"
            >
              <option value="all">All Types</option>
              {programTypes.map(type => (
                <option key={type} value={type}>
                  {formatProgramType(type)}
                </option>
              ))}
            </select>
          </div>

          {/* School Filter */}
          <div>
            <label htmlFor="school" className="block text-sm font-medium text-neutral-70 mb-2">
              School
            </label>
            <select
              id="school"
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-20 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-100 outline-none transition-colors"
            >
              <option value="all">All Schools</option>
              {schools.map(school => (
                <option key={school} value={school}>
                  {formatSchoolName(school)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort and Clear Options */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <label htmlFor="sortBy" className="text-sm font-medium text-neutral-70">
              Sort by:
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-neutral-20 rounded focus:ring-2 focus:ring-blue-100 focus:border-blue-100 outline-none transition-colors"
            >
              <option value="name">Program Name</option>
              <option value="type">Program Type</option>
              <option value="duration">Duration</option>
            </select>
          </div>

          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-100 hover:text-blue-100 font-medium transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-neutral-60">
          Showing <span className="font-semibold text-neutral-80">{filteredAndSortedPrograms.length}</span> of <span className="font-semibold text-neutral-80">{programs.length}</span> programs
        </p>
        
        {/* Active Filters Display */}
        {(searchTerm || selectedProgramType !== 'all' || selectedSchool !== 'all') && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-neutral-60">Active filters:</span>
            {searchTerm && (
              <span className="bg-blue-100 text-white px-2 py-1 rounded text-xs">
                Search: "{searchTerm}"
              </span>
            )}
            {selectedProgramType !== 'all' && (
              <span className="bg-purple-100 text-white px-2 py-1 rounded text-xs">
                Type: {formatProgramType(selectedProgramType)}
              </span>
            )}
            {selectedSchool !== 'all' && (
              <span className="bg-orange-100 text-white px-2 py-1 rounded text-xs">
                School: {formatSchoolName(selectedSchool)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Programs Grid */}
      {filteredAndSortedPrograms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedPrograms.map((program) => (
            <div
              key={program.slug}
              className="bg-white rounded-lg shadow-sm border border-neutral-10 hover:shadow-md transition-shadow duration-200 overflow-hidden"
            >
              {/* Program Card Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-neutral-80 mb-1 line-clamp-2">
                      {program.name}
                    </h3>
                    <p className="text-sm text-neutral-60 font-medium">
                      {program.code}
                    </p>
                  </div>
                  {program.pgwp && (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full ml-2 flex-shrink-0">
                      PGWP
                    </span>
                  )}
                </div>

                {/* Program Type and Duration */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-neutral-10 text-neutral-70 text-xs font-medium px-2 py-1 rounded">
                    {formatProgramType(program.programType)}
                  </span>
                  {program.duration && (
                    <span className="text-xs text-neutral-60">
                      {program.duration}
                    </span>
                  )}
                </div>

                {/* Short Description */}
                <p className="text-sm text-neutral-60 line-clamp-3 mb-4">
                  {program.shortDescription}
                </p>

                {/* Available Intakes */}
                {program.availableIntakes && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-neutral-70 mb-2">Available Intakes:</p>
                    <div className="flex flex-wrap gap-1">
                      {formatIntakes(program.availableIntakes).slice(0, 3).map((intake, index) => (
                        <span
                          key={index}
                          className="text-xs bg-blue-100 text-white px-2 py-1 rounded"
                        >
                          {intake.split('-').slice(-1)[0].toUpperCase()}
                        </span>
                      ))}
                      {formatIntakes(program.availableIntakes).length > 3 && (
                        <span className="text-xs text-neutral-60">
                          +{formatIntakes(program.availableIntakes).length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* School Information */}
                <p className="text-xs text-neutral-60 mb-4">
                  {formatSchoolName(program.school)}
                </p>
              </div>

              {/* Card Footer with Action Button */}
              <div className="px-6 py-4 bg-neutral-5 border-t border-neutral-10">
                <Link
                  href={`/programs/${program.slug}`}
                  className="w-full bg-blue-100 hover:bg-navy-100 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-center text-sm inline-block"
                >
                  Learn More
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* No Results State */
        <div className="text-center py-12">
          <div className="text-neutral-40 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-neutral-70 mb-2">No programs found</h3>
          <p className="text-neutral-60 mb-4">
            Try adjusting your search criteria or clear all filters to see more results.
          </p>
          <button
            onClick={clearAllFilters}
            className="bg-blue-100 hover:bg-navy-100 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}