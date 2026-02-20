import React from 'react';
import { HiSearch, HiFilter } from 'react-icons/hi';

const REPORT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'DAILY', label: 'Daily Report' },
  { value: 'WEEKLY', label: 'Weekly Report' },
  { value: 'MONTHLY', label: 'Monthly Report' },
  { value: 'SUPERVISOR_TEAM', label: 'Team Consolidated' },
  { value: 'ORGANIZATION', label: 'Organization Combined' },
  { value: 'CUSTOM', label: 'Custom' },
];

const REPORT_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'FINAL', label: 'Final' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

const ReportFilters = ({ filters, onFilterChange }) => {
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4">
      {/* Search Bar */}
      <div className="flex-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <HiSearch className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          name="search"
          value={filters.search || ''}
          onChange={handleChange}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-colors"
          placeholder="Search reports by title..."
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Type Filter */}
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HiFilter className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <select
            name="type"
            value={filters.type || ''}
            onChange={handleChange}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-colors cursor-pointer"
          >
            {REPORT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative flex items-center">
          <select
            name="status"
            value={filters.status || ''}
            onChange={handleChange}
            className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-colors cursor-pointer"
          >
            {REPORT_STATUSES.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;
