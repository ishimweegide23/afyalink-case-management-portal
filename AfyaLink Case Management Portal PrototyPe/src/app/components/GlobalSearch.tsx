// Fix linting warnings and format code
import { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, Users, Calendar, FolderOpen, ClipboardList } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth, UserRole } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: 'beneficiaries' | 'cases' | 'interventions' | 'documents' | 'followups';
  path: string;
}

// Mock data for search - in real app, this would come from API
const mockSearchData = {
  beneficiaries: [
    { id: 'BEN001', name: 'Jean Marie Nkurunziza', age: 15, status: 'Active' },
    { id: 'BEN002', name: 'Grace Uwimana', age: 12, status: 'Active' },
    { id: 'BEN003', name: 'Eric Mugisha', age: 17, status: 'Pending' },
    { id: 'BEN004', name: 'Marie Claire Iradukunda', age: 14, status: 'Active' },
    { id: 'BEN005', name: 'David Habimana', age: 16, status: 'Active' },
  ],
  cases: [
    { id: 'CASE001', title: 'Educational Support', beneficiary: 'Jean Marie Nkurunziza', status: 'Open' },
    { id: 'CASE002', title: 'Health Care', beneficiary: 'Grace Uwimana', status: 'In Progress' },
    { id: 'CASE003', title: 'Family Counseling', beneficiary: 'Eric Mugisha', status: 'Open' },
    { id: 'CASE004', title: 'Nutrition Program', beneficiary: 'Marie Claire Iradukunda', status: 'Closed' },
  ],
  interventions: [
    { id: 'INT001', type: 'Home Visit', case: 'CASE001', date: '2025-01-10' },
    { id: 'INT002', type: 'Counseling Session', case: 'CASE002', date: '2025-01-12' },
    { id: 'INT003', type: 'Medical Checkup', case: 'CASE003', date: '2025-01-14' },
    { id: 'INT004', type: 'School Visit', case: 'CASE001', date: '2025-01-08' },
  ],
  documents: [
    { id: 'DOC001', name: 'Birth Certificate - Jean Marie', type: 'Legal', uploadDate: '2024-12-15' },
    { id: 'DOC002', name: 'Medical Report - Grace', type: 'Medical', uploadDate: '2025-01-05' },
    { id: 'DOC003', name: 'School Report - Eric', type: 'Education', uploadDate: '2024-12-20' },
    { id: 'DOC004', name: 'Case Assessment Form', type: 'Case File', uploadDate: '2025-01-10' },
  ],
  followups: [
    { id: 'FU001', title: 'Follow-up Home Visit', case: 'CASE001', dueDate: '2025-01-20' },
    { id: 'FU002', title: 'Health Check Reminder', case: 'CASE002', dueDate: '2025-01-22' },
    { id: 'FU003', title: 'School Progress Review', case: 'CASE003', dueDate: '2025-01-25' },
  ],
};

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Perform search based on query and user permissions
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search beneficiaries
    mockSearchData.beneficiaries
      .filter(b => 
        b.name.toLowerCase().includes(query) || 
        b.id.toLowerCase().includes(query)
      )
      .forEach(b => {
        searchResults.push({
          id: b.id,
          title: b.name,
          subtitle: `${b.id} • Age: ${b.age} • ${b.status}`,
          category: 'beneficiaries',
          path: `/${role?.replace('_', '-')}/beneficiaries`,
        });
      });

    // Search cases
    mockSearchData.cases
      .filter(c => 
        c.title.toLowerCase().includes(query) || 
        c.id.toLowerCase().includes(query) ||
        c.beneficiary.toLowerCase().includes(query)
      )
      .forEach(c => {
        searchResults.push({
          id: c.id,
          title: `Case: ${c.title}`,
          subtitle: `${c.id} • ${c.beneficiary} • ${c.status}`,
          category: 'cases',
          path: `/${role?.replace('_', '-')}/cases`,
        });
      });

    // Search interventions
    mockSearchData.interventions
      .filter(i => 
        i.type.toLowerCase().includes(query) || 
        i.id.toLowerCase().includes(query) ||
        i.case.toLowerCase().includes(query)
      )
      .forEach(i => {
        searchResults.push({
          id: i.id,
          title: i.type,
          subtitle: `${i.id} • ${i.case} • ${i.date}`,
          category: 'interventions',
          path: `/${role?.replace('_', '-')}/interventions`,
        });
      });

    // Search documents
    mockSearchData.documents
      .filter(d => 
        d.name.toLowerCase().includes(query) || 
        d.id.toLowerCase().includes(query) ||
        d.type.toLowerCase().includes(query)
      )
      .forEach(d => {
        searchResults.push({
          id: d.id,
          title: d.name,
          subtitle: `${d.type} • ${d.uploadDate}`,
          category: 'documents',
          path: `/${role?.replace('_', '-')}/documents`,
        });
      });

    // Search follow-ups
    mockSearchData.followups
      .filter(f => 
        f.title.toLowerCase().includes(query) || 
        f.id.toLowerCase().includes(query) ||
        f.case.toLowerCase().includes(query)
      )
      .forEach(f => {
        searchResults.push({
          id: f.id,
          title: f.title,
          subtitle: `${f.case} • Due: ${f.dueDate}`,
          category: 'followups',
          path: `/${role?.replace('_', '-')}/interventions`,
        });
      });

    // Filter results based on role permissions
    let filteredResults = searchResults;
    if (role === 'social_worker') {
      // Social workers only see their assigned cases
      // For demo purposes, showing all but would filter by assignment in real app
      filteredResults = searchResults;
    } else if (role === 'supervisor') {
      // Supervisors see cases of their assigned social workers
      filteredResults = searchResults;
    } else if (role === 'admin') {
      // Admin sees everything
      filteredResults = searchResults;
    }

    setResults(filteredResults.slice(0, 15)); // Limit to 15 results
  }, [searchQuery, role]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'beneficiaries':
        return Users;
      case 'cases':
        return FileText;
      case 'interventions':
        return Calendar;
      case 'documents':
        return FolderOpen;
      case 'followups':
        return ClipboardList;
      default:
        return Search;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'beneficiaries':
        return 'bg-blue-100 text-blue-700';
      case 'cases':
        return 'bg-green-100 text-green-700';
      case 'interventions':
        return 'bg-purple-100 text-purple-700';
      case 'documents':
        return 'bg-orange-100 text-orange-700';
      case 'followups':
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.path);
    setIsOpen(false);
    setSearchQuery('');
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search beneficiaries, cases, documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-9 w-full md:w-80 lg:w-96"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => {
              setSearchQuery('');
              setResults([]);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (searchQuery.length >= 2 || results.length > 0) && (
        <div className="absolute top-full mt-2 w-full md:w-[500px] lg:w-[600px] bg-white rounded-lg shadow-lg border max-h-[500px] overflow-y-auto z-50">
          {results.length === 0 && searchQuery.length >= 2 ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No results found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="p-2">
              {Object.entries(groupedResults).map(([category, items]) => (
                <div key={category} className="mb-4 last:mb-0">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {category.replace('_', ' ')}
                  </div>
                  <div className="space-y-1">
                    {items.map((result) => {
                      const Icon = getCategoryIcon(result.category);
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-start gap-3 group"
                        >
                          <div className={`p-2 rounded-md ${getCategoryColor(result.category)} shrink-0 mt-0.5`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 group-hover:text-primary truncate">
                              {result.title}
                            </p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {result.subtitle}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
