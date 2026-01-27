import { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  User,
  MapPin,
  CheckCircle2,
  Users,
  Package,
  Target,
  Edit,
  Trash2,
  FileText,
  TrendingUp,
  X,
  Save,
  Play,
  Check,
  MessageSquare,
  Eye,
  Archive,
  Download,
  Filter,
  BarChart3,
  AlertCircle,
  Upload,
  Star,
  ChevronRight,
  Search,
  Settings
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useAuth } from '../context/AuthContext';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';

// Mock data for interventions
const initialInterventions = [
  {
    id: 'INT-001',
    title: 'Home Visit - John Mukiza',
    type: 'Home Visit',
    category: 'Social Support',
    beneficiary: 'John Mukiza',
    caseId: 'CASE-001',
    assignedTo: ['Jean Uwase'],
    plannedBy: 'Marie Supervisor',
    date: '2025-01-25',
    time: '10:00 AM',
    duration: '2 hours',
    location: 'Kicukiro, Rwanda',
    status: 'Planned',
    priority: 'High',
    description: 'Regular monthly check-up and progress assessment for child support case',
    resources: [
      { name: 'Transportation', allocated: true },
      { name: 'Assessment Forms', allocated: true },
      { name: 'Medical Supplies', allocated: false },
    ],
    expectedOutcomes: [
      'Complete health assessment',
      'Update care plan',
      'Family counseling session',
    ],
    actualOutcomes: [],
    effectiveness: null,
    completionNotes: '',
    supervisorReview: null,
    createdDate: '2025-01-15',
    lastUpdated: '2025-01-15',
  },
  {
    id: 'INT-002',
    title: 'Medical Check - Sarah Uwase',
    type: 'Medical',
    category: 'Healthcare',
    beneficiary: 'Sarah Uwase',
    caseId: 'CASE-002',
    assignedTo: ['Jean Uwase'],
    plannedBy: 'Admin User',
    date: '2025-01-26',
    time: '2:00 PM',
    duration: '1 hour',
    location: 'Health Center, Gasabo',
    status: 'Scheduled',
    priority: 'Medium',
    description: 'Quarterly health screening and vaccination',
    resources: [
      { name: 'Medical Equipment', allocated: true },
      { name: 'Vaccines', allocated: true },
      { name: 'Health Records', allocated: true },
    ],
    expectedOutcomes: [
      'Complete vaccination',
      'Health screening results',
      'Updated medical records',
    ],
    actualOutcomes: [],
    effectiveness: null,
    completionNotes: '',
    supervisorReview: null,
    createdDate: '2025-01-10',
    lastUpdated: '2025-01-12',
  },
  {
    id: 'INT-003',
    title: 'Education Review - Emmanuel Niyonzima',
    type: 'Education',
    category: 'Academic Support',
    beneficiary: 'Emmanuel Niyonzima',
    caseId: 'CASE-003',
    assignedTo: ['Grace Ishimwe'],
    plannedBy: 'Marie Supervisor',
    date: '2025-01-20',
    time: '11:00 AM',
    duration: '1.5 hours',
    location: 'Primary School, Nyarugenge',
    status: 'Completed',
    priority: 'Low',
    description: 'School performance review with teachers',
    resources: [
      { name: 'School Records', allocated: true },
      { name: 'Educational Materials', allocated: true },
    ],
    expectedOutcomes: [
      'Academic performance assessment',
      'Teacher feedback collection',
      'Identify support needs',
    ],
    actualOutcomes: [
      'Performance improved in mathematics',
      'Needs additional support in English',
      'Recommended tutoring program',
    ],
    effectiveness: 85,
    completionNotes: 'Student showing good progress. Recommended for advanced math program.',
    supervisorReview: {
      reviewer: 'Marie Supervisor',
      rating: 4.5,
      comments: 'Excellent work. The intervention was well-executed and achieved desired outcomes.',
      approved: true,
      reviewDate: '2025-01-21',
    },
    createdDate: '2025-01-05',
    lastUpdated: '2025-01-21',
  },
  {
    id: 'INT-004',
    title: 'Family Counseling - Grace Habimana',
    type: 'Counseling',
    category: 'Psychosocial Support',
    beneficiary: 'Grace Habimana',
    caseId: 'CASE-004',
    assignedTo: ['Marie Mukamana'],
    plannedBy: 'Marie Supervisor',
    date: '2025-01-23',
    time: '3:00 PM',
    duration: '2 hours',
    location: 'AMU Office, Kicukiro',
    status: 'In Progress',
    priority: 'High',
    description: 'Family counseling and support planning',
    resources: [
      { name: 'Counseling Room', allocated: true },
      { name: 'Support Materials', allocated: true },
      { name: 'Refreshments', allocated: true },
    ],
    expectedOutcomes: [
      'Family communication improvement',
      'Create support action plan',
      'Schedule follow-up sessions',
    ],
    actualOutcomes: ['Initial session completed, good rapport established'],
    effectiveness: null,
    completionNotes: '',
    supervisorReview: null,
    createdDate: '2025-01-08',
    lastUpdated: '2025-01-23',
  },
  {
    id: 'INT-005',
    title: 'Skills Training - Alice Mutoni',
    type: 'Training',
    category: 'Vocational',
    beneficiary: 'Alice Mutoni',
    caseId: 'CASE-006',
    assignedTo: ['Patrick Niyonzima'],
    plannedBy: 'Admin User',
    date: '2025-01-22',
    time: '9:00 AM',
    duration: '3 hours',
    location: 'Vocational Center, Kicukiro',
    status: 'Completed',
    priority: 'Medium',
    description: 'Tailoring skills workshop - Session 3',
    resources: [
      { name: 'Training Materials', allocated: true },
      { name: 'Equipment', allocated: true },
    ],
    expectedOutcomes: [
      'Master advanced stitching techniques',
      'Complete sample project',
      'Prepare for certification',
    ],
    actualOutcomes: [
      'Successfully completed advanced techniques',
      'Excellent quality sample produced',
      'Ready for certification exam',
    ],
    effectiveness: 92,
    completionNotes: 'Exceptional progress. Student ready for independent work.',
    supervisorReview: {
      reviewer: 'Marie Supervisor',
      rating: 5,
      comments: 'Outstanding intervention. Beneficiary has achieved remarkable progress.',
      approved: true,
      reviewDate: '2025-01-22',
    },
    createdDate: '2025-01-01',
    lastUpdated: '2025-01-22',
  },
];

const staffMembers = [
  'Jean Uwase',
  'Marie Mukamana',
  'Patrick Niyonzima',
  'Grace Ishimwe',
];

const resourceTypes = [
  'Transportation',
  'Medical Equipment',
  'Educational Materials',
  'Counseling Room',
  'Assessment Forms',
  'Support Materials',
  'Vaccines',
  'Health Records',
  'Refreshments',
  'Training Materials',
  'Food Package',
];

const beneficiaries = [
  { id: 'BEN-001', name: 'John Mukiza', caseId: 'CASE-001' },
  { id: 'BEN-002', name: 'Sarah Uwase', caseId: 'CASE-002' },
  { id: 'BEN-003', name: 'Emmanuel Niyonzima', caseId: 'CASE-003' },
  { id: 'BEN-004', name: 'Grace Habimana', caseId: 'CASE-004' },
  { id: 'BEN-005', name: 'Alice Mutoni', caseId: 'CASE-006' },
  { id: 'BEN-006', name: 'David Habimana', caseId: 'CASE-007' },
];

export function Interventions() {
  const { user } = useAuth();
  const [interventions, setInterventions] = useState(initialInterventions);
  const [selectedTab, setSelectedTab] = useState('all');
  const [showPlanningDialog, setShowPlanningDialog] = useState(false);
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [workerFilter, setWorkerFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());

  // Form state for planning intervention
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    category: '',
    beneficiary: '',
    caseId: '',
    assignedTo: [] as string[],
    date: '',
    time: '',
    duration: '',
    location: '',
    priority: 'Medium',
    description: '',
    resources: [] as { name: string; allocated: boolean }[],
    expectedOutcomes: [''],
  });

  // Outcome form state
  const [outcomeForm, setOutcomeForm] = useState({
    actualOutcomes: [''],
    completionNotes: '',
    effectiveness: 75,
  });

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    rating: 3,
    comments: '',
    approved: true,
  });

  // Filter interventions based on role
  const getFilteredInterventions = () => {
    let filtered = interventions;

    // Role-based filtering
    if (user?.role === 'social_worker') {
      // Social workers see only their assigned interventions
      filtered = filtered.filter((int) =>
        int.assignedTo.includes('Jean Uwase') || int.assignedTo.includes(user.name)
      );
    } else if (user?.role === 'supervisor') {
      // Supervisors see all interventions (in real app, filter by team)
      filtered = interventions;
    } else if (user?.role === 'admin') {
      // Admins see all interventions system-wide
      filtered = interventions;
    }

    // Apply additional filters
    if (statusFilter !== 'all') {
      filtered = filtered.filter((int) => int.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((int) => int.type === typeFilter);
    }

    if (workerFilter !== 'all') {
      filtered = filtered.filter((int) => int.assignedTo.includes(workerFilter));
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (int) =>
          int.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          int.beneficiary.toLowerCase().includes(searchTerm.toLowerCase()) ||
          int.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          int.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredInterventions = getFilteredInterventions();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Planned':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Planned</Badge>;
      case 'Scheduled':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Scheduled</Badge>;
      case 'In Progress':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">In Progress</Badge>;
      case 'Completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'Cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return <Badge variant="destructive">High Priority</Badge>;
      case 'Medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium Priority</Badge>;
      case 'Low':
        return <Badge variant="secondary">Low Priority</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Home Visit':
        return <MapPin className="h-4 w-4" />;
      case 'Medical':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'Education':
        return <FileText className="h-4 w-4" />;
      case 'Counseling':
        return <MessageSquare className="h-4 w-4" />;
      case 'Training':
        return <TrendingUp className="h-4 w-4" />;
      case 'Emergency':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  // Handle intervention planning (Supervisor/Admin only)
  const handlePlanIntervention = () => {
    const newIntervention = {
      id: `INT-${String(interventions.length + 1).padStart(3, '0')}`,
      ...formData,
      plannedBy: user?.name || 'Current User',
      status: 'Planned',
      actualOutcomes: [],
      effectiveness: null,
      completionNotes: '',
      supervisorReview: null,
      createdDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    setInterventions((prev) => [newIntervention, ...prev]);
    setShowPlanningDialog(false);
    resetForm();
  };

  // Handle start intervention (Social Worker)
  const handleStartIntervention = (id: string) => {
    setInterventions((prev) =>
      prev.map((int) =>
        int.id === id ? { ...int, status: 'In Progress', lastUpdated: new Date().toISOString().split('T')[0] } : int
      )
    );
  };

  // Handle complete intervention (Social Worker)
  const handleCompleteIntervention = () => {
    if (selectedIntervention) {
      setInterventions((prev) =>
        prev.map((int) =>
          int.id === selectedIntervention.id
            ? {
                ...int,
                status: 'Completed',
                actualOutcomes: outcomeForm.actualOutcomes.filter((o) => o.trim() !== ''),
                completionNotes: outcomeForm.completionNotes,
                effectiveness: outcomeForm.effectiveness,
                lastUpdated: new Date().toISOString().split('T')[0],
              }
            : int
        )
      );
      setShowOutcomeDialog(false);
      setSelectedIntervention(null);
      setOutcomeForm({
        actualOutcomes: [''],
        completionNotes: '',
        effectiveness: 75,
      });
    }
  };

  // Handle review intervention (Supervisor)
  const handleReviewIntervention = () => {
    if (selectedIntervention) {
      setInterventions((prev) =>
        prev.map((int) =>
          int.id === selectedIntervention.id
            ? {
                ...int,
                supervisorReview: {
                  reviewer: user?.name || 'Supervisor',
                  rating: reviewForm.rating,
                  comments: reviewForm.comments,
                  approved: reviewForm.approved,
                  reviewDate: new Date().toISOString().split('T')[0],
                },
                lastUpdated: new Date().toISOString().split('T')[0],
              }
            : int
        )
      );
      setShowReviewDialog(false);
      setSelectedIntervention(null);
      setReviewForm({
        rating: 3,
        comments: '',
        approved: true,
      });
    }
  };

  // Handle delete intervention (Admin only)
  const handleDeleteIntervention = (id: string) => {
    if (confirm('Are you sure you want to delete this intervention?')) {
      setInterventions((prev) => prev.filter((int) => int.id !== id));
    }
  };

  // Handle archive intervention (Admin only)
  const handleArchiveIntervention = (id: string) => {
    // In a real app, this would move to archived state
    alert('Intervention archived successfully');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: '',
      category: '',
      beneficiary: '',
      caseId: '',
      assignedTo: [],
      date: '',
      time: '',
      duration: '',
      location: '',
      priority: 'Medium',
      description: '',
      resources: [],
      expectedOutcomes: [''],
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleResource = (resource: string) => {
    setFormData((prev) => ({
      ...prev,
      resources: prev.resources.some((r) => r.name === resource)
        ? prev.resources.filter((r) => r.name !== resource)
        : [...prev.resources, { name: resource, allocated: true }],
    }));
  };

  const toggleStaff = (staff: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(staff)
        ? prev.assignedTo.filter((s) => s !== staff)
        : [...prev.assignedTo, staff],
    }));
  };

  const handleAddExpectedOutcome = () => {
    setFormData((prev) => ({
      ...prev,
      expectedOutcomes: [...prev.expectedOutcomes, ''],
    }));
  };

  const handleRemoveExpectedOutcome = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      expectedOutcomes: prev.expectedOutcomes.filter((_, i) => i !== index),
    }));
  };

  const handleExpectedOutcomeChange = (index: number, value: string) => {
    const newOutcomes = [...formData.expectedOutcomes];
    newOutcomes[index] = value;
    setFormData((prev) => ({
      ...prev,
      expectedOutcomes: newOutcomes,
    }));
  };

  const handleAddActualOutcome = () => {
    setOutcomeForm((prev) => ({
      ...prev,
      actualOutcomes: [...prev.actualOutcomes, ''],
    }));
  };

  const handleRemoveActualOutcome = (index: number) => {
    setOutcomeForm((prev) => ({
      ...prev,
      actualOutcomes: prev.actualOutcomes.filter((_, i) => i !== index),
    }));
  };

  const handleActualOutcomeChange = (index: number, value: string) => {
    const newOutcomes = [...outcomeForm.actualOutcomes];
    newOutcomes[index] = value;
    setOutcomeForm((prev) => ({
      ...prev,
      actualOutcomes: newOutcomes,
    }));
  };

  const handleBeneficiaryChange = (beneficiaryName: string) => {
    const beneficiary = beneficiaries.find((b) => b.name === beneficiaryName);
    setFormData((prev) => ({
      ...prev,
      beneficiary: beneficiaryName,
      caseId: beneficiary?.caseId || '',
    }));
  };

  // Get statistics
  const stats = {
    total: interventions.length,
    planned: interventions.filter((i) => i.status === 'Planned').length,
    scheduled: interventions.filter((i) => i.status === 'Scheduled').length,
    inProgress: interventions.filter((i) => i.status === 'In Progress').length,
    completed: interventions.filter((i) => i.status === 'Completed').length,
    avgEffectiveness:
      interventions.filter((i) => i.effectiveness !== null).length > 0
        ? Math.round(
            interventions
              .filter((i) => i.effectiveness !== null)
              .reduce((acc, i) => acc + (i.effectiveness || 0), 0) /
              interventions.filter((i) => i.effectiveness !== null).length
          )
        : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Intervention Planning & Management</h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'social_worker' && 'Manage your assigned interventions'}
            {user?.role === 'supervisor' && 'Plan, assign, and review team interventions'}
            {user?.role === 'admin' && 'System-wide intervention oversight and analytics'}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Social Worker cannot plan interventions */}
          {user?.role !== 'social_worker' && (
            <Button onClick={() => setShowPlanningDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Plan Intervention
            </Button>
          )}
          {user?.role === 'admin' && (
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Planned</p>
            <p className="text-2xl font-bold text-gray-600 mt-1">{stats.planned}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Scheduled</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.scheduled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Avg. Effectiveness</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.avgEffectiveness}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative col-span-1 sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by ID, beneficiary, case..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Planned">Planned</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Home Visit">Home Visit</SelectItem>
                <SelectItem value="Medical">Medical</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Counseling">Counseling</SelectItem>
                <SelectItem value="Training">Training</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
            {user?.role !== 'social_worker' && (
              <Select value={workerFilter} onValueChange={setWorkerFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Workers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workers</SelectItem>
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff} value={staff}>
                      {staff}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Interventions</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          {user?.role !== 'social_worker' && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
        </TabsList>

        {/* All Interventions Tab */}
        <TabsContent value="all" className="space-y-4">
          {filteredInterventions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No interventions found</p>
              </CardContent>
            </Card>
          ) : (
            filteredInterventions.map((intervention) => (
              <Card key={intervention.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {getTypeIcon(intervention.type)}
                            <h3 className="text-lg font-semibold text-gray-900">{intervention.title}</h3>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {getStatusBadge(intervention.status)}
                            {getPriorityBadge(intervention.priority)}
                            <Badge variant="outline">{intervention.type}</Badge>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-700">{intervention.description}</p>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="h-4 w-4" />
                          <span>
                            <strong>Beneficiary:</strong> {intervention.beneficiary}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <FileText className="h-4 w-4" />
                          <span>
                            <strong>Case:</strong> {intervention.caseId}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <CalendarIcon className="h-4 w-4" />
                          <span>
                            {intervention.date} at {intervention.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{intervention.duration}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{intervention.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>{intervention.assignedTo.join(', ')}</span>
                        </div>
                      </div>

                      {/* Resources */}
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">
                          Resources: {intervention.resources.filter((r) => r.allocated).length}/
                          {intervention.resources.length} allocated
                        </span>
                      </div>

                      {/* Effectiveness for completed interventions */}
                      {intervention.status === 'Completed' && intervention.effectiveness !== null && (
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">Effectiveness</span>
                            <span className="text-sm font-bold text-gray-900">{intervention.effectiveness}%</span>
                          </div>
                          <Progress value={intervention.effectiveness} className="h-2" />
                        </div>
                      )}

                      {/* Supervisor Review for completed interventions */}
                      {intervention.supervisorReview && (
                        <div className="pt-2 border-t">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-700">Reviewed & Approved</span>
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < Math.floor(intervention.supervisorReview.rating)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 italic">"{intervention.supervisorReview.comments}"</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Reviewed by {intervention.supervisorReview.reviewer} on{' '}
                            {intervention.supervisorReview.reviewDate}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex lg:flex-col gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedIntervention(intervention);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4 lg:mr-0 mr-2" />
                        <span className="lg:hidden">Details</span>
                      </Button>

                      {/* Social Worker Actions */}
                      {user?.role === 'social_worker' && (
                        <>
                          {intervention.status === 'Scheduled' && (
                            <Button size="sm" onClick={() => handleStartIntervention(intervention.id)}>
                              <Play className="h-4 w-4 lg:mr-0 mr-2" />
                              <span className="lg:hidden">Start</span>
                            </Button>
                          )}
                          {intervention.status === 'In Progress' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedIntervention(intervention);
                                setShowOutcomeDialog(true);
                              }}
                            >
                              <Check className="h-4 w-4 lg:mr-0 mr-2" />
                              <span className="lg:hidden">Complete</span>
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4 lg:mr-0 mr-2" />
                            <span className="lg:hidden">Message</span>
                          </Button>
                        </>
                      )}

                      {/* Supervisor Actions */}
                      {user?.role === 'supervisor' && (
                        <>
                          {intervention.status !== 'Completed' && (
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 lg:mr-0 mr-2" />
                              <span className="lg:hidden">Edit</span>
                            </Button>
                          )}
                          {intervention.status === 'Completed' && !intervention.supervisorReview && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedIntervention(intervention);
                                setShowReviewDialog(true);
                              }}
                            >
                              <Star className="h-4 w-4 lg:mr-0 mr-2" />
                              <span className="lg:hidden">Review</span>
                            </Button>
                          )}
                        </>
                      )}

                      {/* Admin Actions */}
                      {user?.role === 'admin' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleArchiveIntervention(intervention.id)}
                          >
                            <Archive className="h-4 w-4 lg:mr-0 mr-2" />
                            <span className="lg:hidden">Archive</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteIntervention(intervention.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600 lg:mr-0 mr-2" />
                            <span className="lg:hidden">Delete</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Calendar View Tab */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-shrink-0">
                  <Calendar
                    mode="single"
                    selected={calendarDate}
                    onSelect={setCalendarDate}
                    className="rounded-md border"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-4">
                    Scheduled Interventions for {calendarDate?.toDateString()}
                  </h3>
                  <div className="space-y-3">
                    {filteredInterventions
                      .filter((int) => int.date === calendarDate?.toISOString().split('T')[0])
                      .map((intervention) => (
                        <div
                          key={intervention.id}
                          className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            setSelectedIntervention(intervention);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                {getTypeIcon(intervention.type)}
                                <span className="font-medium">{intervention.title}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {intervention.time} • {intervention.duration}
                              </p>
                              <p className="text-sm text-gray-600">{intervention.location}</p>
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                              {getStatusBadge(intervention.status)}
                              {getPriorityBadge(intervention.priority)}
                            </div>
                          </div>
                        </div>
                      ))}
                    {filteredInterventions.filter((int) => int.date === calendarDate?.toISOString().split('T')[0])
                      .length === 0 && (
                      <p className="text-gray-500 text-center py-8">No interventions scheduled for this date</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Intervention Lifecycle Timeline</CardTitle>
              <CardDescription>Track the progress and lifecycle of interventions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {filteredInterventions.map((intervention, index) => (
                  <div key={intervention.id} className="relative">
                    {index !== filteredInterventions.length - 1 && (
                      <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200" />
                    )}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            intervention.status === 'Completed'
                              ? 'bg-green-100'
                              : intervention.status === 'In Progress'
                              ? 'bg-orange-100'
                              : 'bg-blue-100'
                          }`}
                        >
                          {intervention.status === 'Completed' ? (
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                          ) : intervention.status === 'In Progress' ? (
                            <Clock className="h-6 w-6 text-orange-600" />
                          ) : (
                            <CalendarIcon className="h-6 w-6 text-blue-600" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{intervention.title}</h4>
                            <p className="text-sm text-gray-600">
                              {intervention.beneficiary} • {intervention.caseId}
                            </p>
                          </div>
                          {getStatusBadge(intervention.status)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <strong>Scheduled:</strong> {intervention.date} at {intervention.time}
                          </p>
                          <p>
                            <strong>Assigned to:</strong> {intervention.assignedTo.join(', ')}
                          </p>
                          {intervention.effectiveness !== null && (
                            <div className="mt-2">
                              <p className="mb-1">
                                <strong>Effectiveness:</strong> {intervention.effectiveness}%
                              </p>
                              <Progress value={intervention.effectiveness} className="h-2" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab (Supervisor/Admin only) */}
        {user?.role !== 'social_worker' && (
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* By Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Interventions by Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Planned</span>
                    <span className="font-semibold">{stats.planned}</span>
                  </div>
                  <Progress value={(stats.planned / stats.total) * 100} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Scheduled</span>
                    <span className="font-semibold">{stats.scheduled}</span>
                  </div>
                  <Progress value={(stats.scheduled / stats.total) * 100} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">In Progress</span>
                    <span className="font-semibold">{stats.inProgress}</span>
                  </div>
                  <Progress value={(stats.inProgress / stats.total) * 100} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="font-semibold">{stats.completed}</span>
                  </div>
                  <Progress value={(stats.completed / stats.total) * 100} className="h-2" />
                </CardContent>
              </Card>

              {/* By Worker */}
              <Card>
                <CardHeader>
                  <CardTitle>Interventions by Social Worker</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {staffMembers.map((staff) => {
                    const count = interventions.filter((int) => int.assignedTo.includes(staff)).length;
                    return (
                      <div key={staff}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">{staff}</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                        <Progress value={(count / stats.total) * 100} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* By Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Interventions by Type</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {['Home Visit', 'Medical', 'Education', 'Counseling', 'Training'].map((type) => {
                    const count = interventions.filter((int) => int.type === type).length;
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">{type}</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                        <Progress value={(count / stats.total) * 100} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Effectiveness Report */}
              <Card>
                <CardHeader>
                  <CardTitle>Effectiveness Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-purple-600">{stats.avgEffectiveness}%</p>
                      <p className="text-sm text-gray-600 mt-1">Average Effectiveness</p>
                    </div>
                    <div className="space-y-2">
                      {interventions
                        .filter((int) => int.effectiveness !== null)
                        .slice(0, 5)
                        .map((int) => (
                          <div key={int.id}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-600 truncate">{int.title}</span>
                              <span className="text-xs font-semibold">{int.effectiveness}%</span>
                            </div>
                            <Progress value={int.effectiveness || 0} className="h-1" />
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Plan Intervention Dialog (Supervisor/Admin) */}
      <Dialog open={showPlanningDialog} onOpenChange={setShowPlanningDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Plan New Intervention</DialogTitle>
            <DialogDescription>
              Create a structured intervention plan with activity details, staff assignment, and resource allocation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-900">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Intervention Title *</Label>
                  <Input
                    placeholder="e.g., Home Visit - John Mukiza"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Intervention Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Home Visit">Home Visit</SelectItem>
                      <SelectItem value="Medical">Medical</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Counseling">Counseling</SelectItem>
                      <SelectItem value="Training">Training</SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Social Support">Social Support</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Academic Support">Academic Support</SelectItem>
                      <SelectItem value="Psychosocial Support">Psychosocial Support</SelectItem>
                      <SelectItem value="Vocational">Vocational</SelectItem>
                      <SelectItem value="Crisis Support">Crisis Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Beneficiary *</Label>
                  <Select
                    value={formData.beneficiary}
                    onValueChange={(value) => handleBeneficiaryChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select beneficiary" />
                    </SelectTrigger>
                    <SelectContent>
                      {beneficiaries.map((ben) => (
                        <SelectItem key={ben.id} value={ben.name}>
                          {ben.name} ({ben.caseId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Case ID</Label>
                  <Input value={formData.caseId} disabled className="bg-gray-50" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  placeholder="Describe the purpose and objectives of this intervention..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Scheduling */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-sm text-gray-900">Scheduling</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time *</Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration *</Label>
                  <Input
                    placeholder="e.g., 2 hours"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Location *</Label>
                  <Input
                    placeholder="e.g., Health Center, Gasabo"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Staff Assignment */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-sm text-gray-900">Staff Assignment</h3>
              <div className="space-y-2">
                <Label>Assign Social Workers *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {staffMembers.map((staff) => (
                    <div key={staff} className="flex items-center space-x-2">
                      <Checkbox
                        id={staff}
                        checked={formData.assignedTo.includes(staff)}
                        onCheckedChange={() => toggleStaff(staff)}
                      />
                      <label htmlFor={staff} className="text-sm cursor-pointer">
                        {staff}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Resource Allocation */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-sm text-gray-900">Resource Allocation</h3>
              <div className="space-y-2">
                <Label>Required Resources</Label>
                <div className="grid grid-cols-2 gap-3">
                  {resourceTypes.map((resource) => (
                    <div key={resource} className="flex items-center space-x-2">
                      <Checkbox
                        id={resource}
                        checked={formData.resources.some((r) => r.name === resource)}
                        onCheckedChange={() => toggleResource(resource)}
                      />
                      <label htmlFor={resource} className="text-sm cursor-pointer">
                        {resource}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Expected Outcomes */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-sm text-gray-900">Expected Outcomes</h3>
              <div className="space-y-3">
                {formData.expectedOutcomes.map((outcome, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Expected outcome ${index + 1}`}
                      value={outcome}
                      onChange={(e) => handleExpectedOutcomeChange(index, e.target.value)}
                    />
                    {formData.expectedOutcomes.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveExpectedOutcome(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={handleAddExpectedOutcome}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expected Outcome
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanningDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePlanIntervention}>
              <Save className="h-4 w-4 mr-2" />
              Plan Intervention
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Outcome Dialog (Social Worker) */}
      <Dialog open={showOutcomeDialog} onOpenChange={setShowOutcomeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete Intervention & Add Outcomes</DialogTitle>
            <DialogDescription>
              Document the actual outcomes and effectiveness of this intervention
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Actual Outcomes */}
            <div className="space-y-3">
              <Label>Actual Outcomes Achieved *</Label>
              {outcomeForm.actualOutcomes.map((outcome, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    placeholder={`Describe outcome ${index + 1}`}
                    value={outcome}
                    onChange={(e) => handleActualOutcomeChange(index, e.target.value)}
                    rows={2}
                  />
                  {outcomeForm.actualOutcomes.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveActualOutcome(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={handleAddActualOutcome}>
                <Plus className="h-4 w-4 mr-2" />
                Add Outcome
              </Button>
            </div>

            {/* Completion Notes */}
            <div className="space-y-2">
              <Label>Completion Notes *</Label>
              <Textarea
                placeholder="Add any additional notes, observations, or recommendations..."
                value={outcomeForm.completionNotes}
                onChange={(e) => setOutcomeForm((prev) => ({ ...prev, completionNotes: e.target.value }))}
                rows={4}
              />
            </div>

            {/* Effectiveness Rating */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Intervention Effectiveness</Label>
                <span className="text-2xl font-bold text-purple-600">{outcomeForm.effectiveness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={outcomeForm.effectiveness}
                onChange={(e) => setOutcomeForm((prev) => ({ ...prev, effectiveness: Number(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>Not Effective</span>
                <span>Partially Effective</span>
                <span>Highly Effective</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOutcomeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteIntervention}>
              <Check className="h-4 w-4 mr-2" />
              Complete Intervention
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog (Supervisor) */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review & Approve Intervention</DialogTitle>
            <DialogDescription>
              Review the completed intervention and provide supervisor feedback
            </DialogDescription>
          </DialogHeader>

          {selectedIntervention && (
            <div className="space-y-4">
              {/* Intervention Summary */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <h4 className="font-semibold">{selectedIntervention.title}</h4>
                <p className="text-sm text-gray-600">
                  <strong>Beneficiary:</strong> {selectedIntervention.beneficiary} •{' '}
                  <strong>Case:</strong> {selectedIntervention.caseId}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Completed by:</strong> {selectedIntervention.assignedTo.join(', ')}
                </p>
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-1">Actual Outcomes:</p>
                  <ul className="space-y-1">
                    {selectedIntervention.actualOutcomes?.map((outcome: string, idx: number) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-2">
                  <p className="text-sm font-medium mb-1">Completion Notes:</p>
                  <p className="text-sm text-gray-600">{selectedIntervention.completionNotes}</p>
                </div>
                <div className="pt-2">
                  <p className="text-sm font-medium mb-1">Worker's Effectiveness Rating:</p>
                  <div className="flex items-center gap-3">
                    <Progress value={selectedIntervention.effectiveness} className="flex-1 h-2" />
                    <span className="font-semibold">{selectedIntervention.effectiveness}%</span>
                  </div>
                </div>
              </div>

              {/* Supervisor Rating */}
              <div className="space-y-3">
                <Label>Your Rating (1-5 stars)</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm((prev) => ({ ...prev, rating: star }))}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= reviewForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-lg font-semibold">{reviewForm.rating}/5</span>
                </div>
              </div>

              {/* Supervisor Comments */}
              <div className="space-y-2">
                <Label>Supervisor Comments *</Label>
                <Textarea
                  placeholder="Provide feedback on the intervention execution and outcomes..."
                  value={reviewForm.comments}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, comments: e.target.value }))}
                  rows={4}
                />
              </div>

              {/* Approval */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="approve"
                  checked={reviewForm.approved}
                  onCheckedChange={(checked) =>
                    setReviewForm((prev) => ({ ...prev, approved: checked as boolean }))
                  }
                />
                <label htmlFor="approve" className="text-sm font-medium cursor-pointer">
                  Approve this intervention as successfully completed
                </label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReviewIntervention}>
              <Star className="h-4 w-4 mr-2" />
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Intervention Details</DialogTitle>
          </DialogHeader>

          {selectedIntervention && (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h3 className="text-xl font-semibold mb-2">{selectedIntervention.title}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(selectedIntervention.status)}
                  {getPriorityBadge(selectedIntervention.priority)}
                  <Badge variant="outline">{selectedIntervention.type}</Badge>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Intervention ID</p>
                  <p className="font-medium">{selectedIntervention.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-medium">{selectedIntervention.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Beneficiary</p>
                  <p className="font-medium">{selectedIntervention.beneficiary}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Case ID</p>
                  <p className="font-medium">{selectedIntervention.caseId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Scheduled Date</p>
                  <p className="font-medium">{selectedIntervention.date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-medium">{selectedIntervention.time}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-medium">{selectedIntervention.duration}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">{selectedIntervention.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Planned By</p>
                  <p className="font-medium">{selectedIntervention.plannedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Assigned To</p>
                  <p className="font-medium">{selectedIntervention.assignedTo.join(', ')}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-sm text-gray-600 mb-1">Description</p>
                <p className="text-gray-900">{selectedIntervention.description}</p>
              </div>

              {/* Resources */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Allocated Resources</p>
                <div className="flex flex-wrap gap-2">
                  {selectedIntervention.resources.map((resource: any, idx: number) => (
                    <Badge key={idx} variant={resource.allocated ? 'default' : 'outline'}>
                      {resource.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Expected Outcomes */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Expected Outcomes</p>
                <ul className="space-y-1">
                  {selectedIntervention.expectedOutcomes.map((outcome: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actual Outcomes (if completed) */}
              {selectedIntervention.actualOutcomes && selectedIntervention.actualOutcomes.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Actual Outcomes Achieved</p>
                  <ul className="space-y-1">
                    {selectedIntervention.actualOutcomes.map((outcome: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Completion Notes (if completed) */}
              {selectedIntervention.completionNotes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completion Notes</p>
                  <p className="text-gray-900">{selectedIntervention.completionNotes}</p>
                </div>
              )}

              {/* Effectiveness (if completed) */}
              {selectedIntervention.effectiveness !== null && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Intervention Effectiveness</p>
                    <span className="text-lg font-bold text-purple-600">{selectedIntervention.effectiveness}%</span>
                  </div>
                  <Progress value={selectedIntervention.effectiveness} className="h-3" />
                </div>
              )}

              {/* Supervisor Review (if available) */}
              {selectedIntervention.supervisorReview && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Supervisor Review</p>
                  <div className="p-4 bg-green-50 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-700">Approved</span>
                      <div className="flex gap-1 ml-auto">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(selectedIntervention.supervisorReview.rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 italic">"{selectedIntervention.supervisorReview.comments}"</p>
                    <p className="text-xs text-gray-600">
                      Reviewed by {selectedIntervention.supervisorReview.reviewer} on{' '}
                      {selectedIntervention.supervisorReview.reviewDate}
                    </p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="pt-4 border-t text-xs text-gray-500 grid grid-cols-2 gap-2">
                <div>
                  <strong>Created:</strong> {selectedIntervention.createdDate}
                </div>
                <div>
                  <strong>Last Updated:</strong> {selectedIntervention.lastUpdated}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
