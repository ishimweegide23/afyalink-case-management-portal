import { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  FileText,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  History,
  Paperclip,
  MessageSquare,
  Eye,
  Bell,
  CheckSquare,
  TrendingUp,
  MapPin,
  Edit,
  Save,
  X,
  Download,
  Upload,
  Phone,
  Mail,
  Home,
  Users,
  ChevronDown,
  ChevronRight,
  Archive,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Progress } from '../components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useAuth } from '../context/AuthContext';

// Mock data
const initialCases = [
  {
    id: 'CASE-001',
    beneficiary: 'John Mukiza',
    category: 'Child Support',
    status: 'in_progress',
    priority: 'high',
    assignedTo: 'Jean Uwase',
    openedDate: '2024-11-15',
    lastUpdate: '2024-12-28',
    dueDate: '2025-01-12',
    progress: 75,
    nextFollowUp: '2025-01-07',
    location: 'Kicukiro',
    phone: '+250 788 123 456',
    email: 'john.mukiza@example.com',
    address: 'KG 123 St, Kicukiro',
    age: 14,
    guardian: 'Marie Mukiza',
    interventions: [
      {
        id: 1,
        date: '2024-11-15',
        type: 'Initial Assessment',
        status: 'completed',
        notes: 'Comprehensive vulnerability assessment completed',
      },
      {
        id: 2,
        date: '2024-11-20',
        type: 'Home Visit',
        status: 'completed',
        notes: 'Family situation evaluated, basic needs identified',
      },
      {
        id: 3,
        date: '2024-12-05',
        type: 'Educational Support',
        status: 'completed',
        notes: 'School enrollment facilitated',
      },
      {
        id: 4,
        date: '2024-12-20',
        type: 'Follow-up Visit',
        status: 'completed',
        notes: 'Progress monitored, additional support provided',
      },
    ],
    tasks: [
      { id: 1, title: 'Schedule medical check-up', completed: true, dueDate: '2024-12-15', assignedTo: 'Jean Uwase' },
      { id: 2, title: 'Coordinate school supplies', completed: true, dueDate: '2024-12-20', assignedTo: 'Jean Uwase' },
      {
        id: 3,
        title: 'Home visit follow-up',
        completed: false,
        dueDate: '2025-01-07',
        assignedTo: 'Jean Uwase',
      },
      {
        id: 4,
        title: 'Update progress report',
        completed: false,
        dueDate: '2025-01-10',
        assignedTo: 'Jean Uwase',
      },
    ],
    milestones: [
      { id: 1, title: 'Initial Assessment', progress: 100, targetDate: '2024-11-20', status: 'completed' },
      { id: 2, title: 'Educational Enrollment', progress: 100, targetDate: '2024-12-05', status: 'completed' },
      { id: 3, title: 'Healthcare Access', progress: 80, targetDate: '2025-01-15', status: 'in_progress' },
      { id: 4, title: 'Family Stabilization', progress: 60, targetDate: '2025-02-28', status: 'in_progress' },
    ],
    notes: [
      {
        id: 1,
        author: 'Jean Uwase',
        date: '2024-12-28',
        content:
          'Follow-up visit completed. Beneficiary is making good progress with educational support. Family situation has stabilized.',
      },
      {
        id: 2,
        author: 'Jean Uwase',
        date: '2024-12-20',
        content:
          'School supplies delivered. Child is attending classes regularly. Guardian reports improved behavior.',
      },
    ],
    attachments: [
      { id: 1, name: 'Intake_Form.pdf', type: 'pdf', uploadDate: '2024-11-15', size: '245 KB' },
      { id: 2, name: 'Assessment_Report.pdf', type: 'pdf', uploadDate: '2024-11-20', size: '512 KB' },
      { id: 3, name: 'School_Enrollment.pdf', type: 'pdf', uploadDate: '2024-12-05', size: '189 KB' },
    ],
  },
  {
    id: 'CASE-002',
    beneficiary: 'Sarah Uwase',
    category: 'Youth Services',
    status: 'in_progress',
    priority: 'medium',
    assignedTo: 'Marie Mukamana',
    openedDate: '2024-10-20',
    lastUpdate: '2024-12-25',
    dueDate: '2025-01-15',
    progress: 60,
    nextFollowUp: '2025-01-08',
    location: 'Gasabo',
    phone: '+250 788 234 567',
    email: 'sarah.uwase@example.com',
    address: 'KG 456 St, Gasabo',
    age: 17,
    guardian: 'Paul Uwase',
    interventions: [
      {
        id: 1,
        date: '2024-10-20',
        type: 'Initial Assessment',
        status: 'completed',
        notes: 'Youth needs vocational training support',
      },
      {
        id: 2,
        date: '2024-11-10',
        type: 'Skills Assessment',
        status: 'completed',
        notes: 'Identified interest in tailoring',
      },
    ],
    tasks: [
      { id: 1, title: 'Enroll in vocational training', completed: true, dueDate: '2024-12-01', assignedTo: 'Marie Mukamana' },
      { id: 2, title: 'Monthly progress check', completed: false, dueDate: '2025-01-08', assignedTo: 'Marie Mukamana' },
    ],
    milestones: [
      { id: 1, title: 'Initial Assessment', progress: 100, targetDate: '2024-10-25', status: 'completed' },
      { id: 2, title: 'Training Enrollment', progress: 100, targetDate: '2024-12-01', status: 'completed' },
      { id: 3, title: 'Skill Development', progress: 45, targetDate: '2025-03-31', status: 'in_progress' },
    ],
    notes: [
      {
        id: 1,
        author: 'Marie Mukamana',
        date: '2024-12-25',
        content: 'Training is progressing well. Sarah shows excellent commitment and skill development.',
      },
    ],
    attachments: [{ id: 1, name: 'Youth_Profile.pdf', type: 'pdf', uploadDate: '2024-10-20', size: '198 KB' }],
  },
  {
    id: 'CASE-003',
    beneficiary: 'Emmanuel Niyonzima',
    category: 'Child Support',
    status: 'open',
    priority: 'low',
    assignedTo: 'Patrick Niyonzima',
    openedDate: '2024-12-10',
    lastUpdate: '2024-12-20',
    dueDate: '2025-01-20',
    progress: 30,
    nextFollowUp: '2025-01-10',
    location: 'Nyarugenge',
    phone: '+250 788 345 678',
    email: 'emmanuel.n@example.com',
    address: 'KG 789 St, Nyarugenge',
    age: 12,
    guardian: 'Grace Niyonzima',
    interventions: [
      {
        id: 1,
        date: '2024-12-10',
        type: 'Initial Assessment',
        status: 'completed',
        notes: 'Case opened, initial needs assessment conducted',
      },
    ],
    tasks: [
      {
        id: 1,
        title: 'Complete vulnerability assessment',
        completed: true,
        dueDate: '2024-12-15',
        assignedTo: 'Patrick Niyonzima',
      },
      {
        id: 2,
        title: 'Schedule first home visit',
        completed: false,
        dueDate: '2025-01-10',
        assignedTo: 'Patrick Niyonzima',
      },
    ],
    milestones: [
      { id: 1, title: 'Initial Assessment', progress: 100, targetDate: '2024-12-15', status: 'completed' },
      { id: 2, title: 'Needs Identification', progress: 20, targetDate: '2025-01-20', status: 'in_progress' },
    ],
    notes: [
      {
        id: 1,
        author: 'Patrick Niyonzima',
        date: '2024-12-20',
        content:
          'Initial assessment completed. Child requires educational support and nutritional assistance.',
      },
    ],
    attachments: [
      { id: 1, name: 'Initial_Assessment.pdf', type: 'pdf', uploadDate: '2024-12-10', size: '156 KB' },
    ],
  },
  {
    id: 'CASE-004',
    beneficiary: 'Grace Ishimwe',
    category: 'Family Care',
    status: 'in_progress',
    priority: 'high',
    assignedTo: 'Grace Ishimwe',
    openedDate: '2024-09-05',
    lastUpdate: '2024-12-30',
    dueDate: '2025-01-18',
    progress: 85,
    nextFollowUp: '2025-01-12',
    location: 'Kicukiro',
    phone: '+250 788 456 789',
    email: 'grace.ishimwe@example.com',
    address: 'KG 234 St, Kicukiro',
    age: 35,
    guardian: 'Self',
    interventions: [
      {
        id: 1,
        date: '2024-09-05',
        type: 'Initial Assessment',
        status: 'completed',
        notes: 'Family in need of comprehensive support',
      },
      { id: 2, date: '2024-09-20', type: 'Home Visit', status: 'completed', notes: 'Housing situation assessed' },
      {
        id: 3,
        date: '2024-10-15',
        type: 'Financial Counseling',
        status: 'completed',
        notes: 'Budget planning session conducted',
      },
      {
        id: 4,
        date: '2024-11-30',
        type: 'Follow-up Support',
        status: 'completed',
        notes: 'Progress monitored, additional resources provided',
      },
    ],
    tasks: [
      {
        id: 1,
        title: 'Income generation support',
        completed: true,
        dueDate: '2024-11-30',
        assignedTo: 'Grace Ishimwe',
      },
      { id: 2, title: 'Final assessment visit', completed: false, dueDate: '2025-01-12', assignedTo: 'Grace Ishimwe' },
      {
        id: 3,
        title: 'Case closure preparation',
        completed: false,
        dueDate: '2025-01-18',
        assignedTo: 'Grace Ishimwe',
      },
    ],
    milestones: [
      { id: 1, title: 'Initial Support', progress: 100, targetDate: '2024-10-01', status: 'completed' },
      { id: 2, title: 'Economic Empowerment', progress: 100, targetDate: '2024-12-01', status: 'completed' },
      { id: 3, title: 'Family Stabilization', progress: 90, targetDate: '2025-01-31', status: 'in_progress' },
    ],
    notes: [
      {
        id: 1,
        author: 'Grace Ishimwe',
        date: '2024-12-30',
        content:
          'Family has made exceptional progress. Income generation activities are successful. Preparing for case closure.',
      },
    ],
    attachments: [
      { id: 1, name: 'Family_Assessment.pdf', type: 'pdf', uploadDate: '2024-09-05', size: '387 KB' },
      { id: 2, name: 'Financial_Plan.pdf', type: 'pdf', uploadDate: '2024-10-15', size: '221 KB' },
    ],
  },
  {
    id: 'CASE-005',
    beneficiary: 'David Habimana',
    category: 'Emergency',
    status: 'in_progress',
    priority: 'high',
    assignedTo: 'Jean Uwase',
    openedDate: '2024-12-28',
    lastUpdate: '2024-12-30',
    dueDate: '2025-01-09',
    progress: 45,
    nextFollowUp: '2025-01-05',
    location: 'Gasabo',
    phone: '+250 788 567 890',
    email: 'david.h@example.com',
    address: 'KG 567 St, Gasabo',
    age: 8,
    guardian: 'Alice Habimana',
    interventions: [
      {
        id: 1,
        date: '2024-12-28',
        type: 'Emergency Response',
        status: 'completed',
        notes: 'Immediate needs assessment conducted',
      },
      {
        id: 2,
        date: '2024-12-29',
        type: 'Emergency Relief',
        status: 'completed',
        notes: 'Food and temporary shelter provided',
      },
    ],
    tasks: [
      {
        id: 1,
        title: 'Emergency relief distribution',
        completed: true,
        dueDate: '2024-12-29',
        assignedTo: 'Jean Uwase',
      },
      { id: 2, title: 'Find permanent housing', completed: false, dueDate: '2025-01-05', assignedTo: 'Jean Uwase' },
      { id: 3, title: 'Enroll child in school', completed: false, dueDate: '2025-01-09', assignedTo: 'Jean Uwase' },
    ],
    milestones: [
      { id: 1, title: 'Emergency Response', progress: 100, targetDate: '2024-12-29', status: 'completed' },
      { id: 2, title: 'Temporary Stabilization', progress: 70, targetDate: '2025-01-05', status: 'in_progress' },
      { id: 3, title: 'Permanent Solution', progress: 20, targetDate: '2025-01-31', status: 'in_progress' },
    ],
    notes: [
      {
        id: 1,
        author: 'Jean Uwase',
        date: '2024-12-30',
        content:
          'Emergency response activated. Family is in temporary shelter. Working on permanent housing solution.',
      },
    ],
    attachments: [
      { id: 1, name: 'Emergency_Assessment.pdf', type: 'pdf', uploadDate: '2024-12-28', size: '134 KB' },
    ],
  },
];

export function Cases() {
  const { user } = useAuth();
  const [cases, setCases] = useState(initialCases);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [viewMode, setViewMode] = useState('list');
  const [editingNote, setEditingNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [showReminders, setShowReminders] = useState(false);
  const [expandedSections, setExpandedSections] = useState<any>({});
  const [showCaseDialog, setShowCaseDialog] = useState(false);
  const [showFileUploadDialog, setShowFileUploadDialog] = useState(false);

  // Filter cases based on role
  const getFilteredCases = () => {
    let filtered = cases;

    // Role-based filtering
    if (user?.role === 'social_worker') {
      // Social workers see only their assigned cases
      filtered = filtered.filter(
        (caseItem) => caseItem.assignedTo === 'Jean Uwase' || caseItem.assignedTo === user.name
      );
    } else if (user?.role === 'supervisor') {
      // Supervisors see all cases (in real app, filter by team)
      filtered = cases;
    } else if (user?.role === 'admin') {
      // Admins see all cases system-wide
      filtered = cases;
    }

    // Apply additional filters
    if (searchTerm) {
      filtered = filtered.filter(
        (caseItem) =>
          caseItem.beneficiary.toLowerCase().includes(searchTerm.toLowerCase()) ||
          caseItem.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          caseItem.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((caseItem) => caseItem.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((caseItem) => caseItem.priority === priorityFilter);
    }

    return filtered;
  };

  const filteredCases = getFilteredCases();

  const getReminders = () => {
    const today = new Date();
    const reminders: any[] = [];

    filteredCases.forEach((caseItem) => {
      const followUpDate = new Date(caseItem.nextFollowUp);
      const dueDate = new Date(caseItem.dueDate);
      const daysDiff = Math.ceil((followUpDate - today) / (1000 * 60 * 60 * 24));

      if (daysDiff >= 0 && daysDiff <= 7) {
        reminders.push({
          type: 'follow-up',
          caseId: caseItem.id,
          beneficiary: caseItem.beneficiary,
          date: caseItem.nextFollowUp,
          priority: caseItem.priority,
          daysUntil: daysDiff,
        });
      }

      if (dueDate < today && caseItem.status !== 'closed') {
        reminders.push({
          type: 'overdue',
          caseId: caseItem.id,
          beneficiary: caseItem.beneficiary,
          date: caseItem.dueDate,
          priority: caseItem.priority,
        });
      }

      caseItem.tasks?.forEach((task) => {
        if (!task.completed) {
          const taskDate = new Date(task.dueDate);
          const taskDaysDiff = Math.ceil((taskDate - today) / (1000 * 60 * 60 * 24));

          if (taskDaysDiff >= 0 && taskDaysDiff <= 3) {
            reminders.push({
              type: 'task',
              caseId: caseItem.id,
              beneficiary: caseItem.beneficiary,
              task: task.title,
              date: task.dueDate,
              daysUntil: taskDaysDiff,
            });
          }
        }
      });
    });

    return reminders;
  };

  const reminders = getReminders();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
      case 'open':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Open</Badge>;
      case 'closed':
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High Priority</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium Priority</Badge>;
      case 'low':
        return <Badge variant="secondary">Low Priority</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev: any) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleTaskToggle = (taskId: number) => {
    if (selectedCase) {
      const updatedCase = {
        ...selectedCase,
        tasks: selectedCase.tasks.map((task: any) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        ),
      };
      setSelectedCase(updatedCase);
      setCases(cases.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
    }
  };

  const handleSaveNote = () => {
    if (newNote.trim() && selectedCase) {
      const note = {
        id: selectedCase.notes.length + 1,
        author: user?.name || 'Current User',
        date: new Date().toISOString().split('T')[0],
        content: newNote,
      };

      const updatedCase = {
        ...selectedCase,
        notes: [note, ...selectedCase.notes],
        lastUpdate: note.date,
      };

      setSelectedCase(updatedCase);
      setCases(cases.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
      setNewNote('');
      setEditingNote(false);
    }
  };

  const handleDeleteCase = (caseId: string) => {
    if (confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
      setCases(cases.filter((c) => c.id !== caseId));
      setSelectedCase(null);
    }
  };

  const handleArchiveCase = (caseId: string) => {
    // In real app, this would move to archived state
    alert('Case archived successfully');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Case File Management & Tracking</h1>
            <p className="text-gray-600 mt-1">
              {user?.role === 'social_worker' && 'Manage your assigned case files'}
              {user?.role === 'supervisor' && 'Monitor team case files and progress'}
              {user?.role === 'admin' && 'System-wide case oversight and management'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="gap-2 relative"
              onClick={() => setShowReminders(!showReminders)}
            >
              <Bell className="h-4 w-4" />
              Reminders
              {reminders.length > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {reminders.length}
                </Badge>
              )}
            </Button>
            {user?.role !== 'supervisor' && (
              <Button className="gap-2" onClick={() => setShowCaseDialog(true)}>
                <Plus className="h-4 w-4" />
                New Case
              </Button>
            )}
            {user?.role === 'admin' && (
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Automated Reminders Panel */}
        {showReminders && reminders.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <Bell className="h-5 w-5" />
                Active Reminders & Alerts ({reminders.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reminders.map((reminder, idx) => (
                <Alert key={idx} className="bg-white">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {reminder.type === 'follow-up' && (
                      <span>
                        <strong>{reminder.beneficiary}</strong> - Follow-up visit scheduled in {reminder.daysUntil}{' '}
                        day(s) ({reminder.date})
                      </span>
                    )}
                    {reminder.type === 'overdue' && (
                      <span className="text-red-600">
                        <strong>{reminder.beneficiary}</strong> - Case overdue! Due date was {reminder.date}
                      </span>
                    )}
                    {reminder.type === 'task' && (
                      <span>
                        <strong>{reminder.beneficiary}</strong> - Task "{reminder.task}" due in {reminder.daysUntil}{' '}
                        day(s)
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Cases</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{filteredCases.length}</p>
                </div>
                <FileText className="h-10 w-10 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {filteredCases.filter((c) => c.status === 'in_progress').length}
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Open Cases</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {filteredCases.filter((c) => c.status === 'open').length}
                  </p>
                </div>
                <CheckCircle2 className="h-10 w-10 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">High Priority</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {filteredCases.filter((c) => c.priority === 'high').length}
                  </p>
                </div>
                <AlertCircle className="h-10 w-10 text-red-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Due This Week</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {reminders.filter((r) => r.type === 'follow-up').length}
                  </p>
                </div>
                <Clock className="h-10 w-10 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by case ID, beneficiary name, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Case Files List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredCases.map((caseItem) => (
            <Card key={caseItem.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Left: Case Information */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{caseItem.beneficiary}</h3>
                          <Badge variant="outline">{caseItem.id}</Badge>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(caseItem.status)}
                          {getPriorityBadge(caseItem.priority)}
                          <Badge variant="outline">{caseItem.category}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="h-4 w-4" />
                        <span>{caseItem.assignedTo}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Next: {caseItem.nextFollowUp}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{caseItem.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>Updated: {caseItem.lastUpdate}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Case Progress</span>
                        <span className="text-sm font-semibold text-gray-900">{caseItem.progress}%</span>
                      </div>
                      <Progress value={caseItem.progress} className="h-2" />
                    </div>

                    {/* Quick Stats */}
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <History className="h-4 w-4" />
                        <span>{caseItem.interventions.length} interventions</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <CheckSquare className="h-4 w-4" />
                        <span>
                          {caseItem.tasks.filter((t) => t.completed).length}/{caseItem.tasks.length} tasks
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Paperclip className="h-4 w-4" />
                        <span>{caseItem.attachments.length} files</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex lg:flex-col gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCase(caseItem)}
                    >
                      <Eye className="h-4 w-4 lg:mr-0 mr-2" />
                      <span className="lg:hidden">View Details</span>
                    </Button>
                    {user?.role !== 'supervisor' && (
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 lg:mr-0 mr-2" />
                        <span className="lg:hidden">Edit</span>
                      </Button>
                    )}
                    {user?.role === 'admin' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleArchiveCase(caseItem.id)}
                        >
                          <Archive className="h-4 w-4 lg:mr-0 mr-2" />
                          <span className="lg:hidden">Archive</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCase(caseItem.id)}
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
          ))}
        </div>

        {/* Case Detail Dialog */}
        <Dialog open={selectedCase !== null} onOpenChange={() => setSelectedCase(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            {selectedCase && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <span>Case File: {selectedCase.beneficiary}</span>
                    {getStatusBadge(selectedCase.status)}
                    {getPriorityBadge(selectedCase.priority)}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedCase.id} • Opened {selectedCase.openedDate} • Assigned to {selectedCase.assignedTo}
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                    <TabsTrigger value="notes">Progress Notes</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks & Follow-ups</TabsTrigger>
                    <TabsTrigger value="milestones">Milestones</TabsTrigger>
                    <TabsTrigger value="attachments">Attachments</TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Beneficiary Information</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Name</p>
                          <p className="font-medium">{selectedCase.beneficiary}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Age</p>
                          <p className="font-medium">{selectedCase.age} years</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Guardian</p>
                          <p className="font-medium">{selectedCase.guardian}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Category</p>
                          <p className="font-medium">{selectedCase.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <p className="font-medium">{selectedCase.phone}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <p className="font-medium">{selectedCase.email}</p>
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                          <Home className="h-4 w-4 text-gray-500" />
                          <p className="font-medium">{selectedCase.address}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Case Progress</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Overall Progress</span>
                            <span className="text-lg font-bold text-gray-900">{selectedCase.progress}%</span>
                          </div>
                          <Progress value={selectedCase.progress} className="h-3" />
                          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                            <div>
                              <p className="text-gray-600">Next Follow-up</p>
                              <p className="font-medium">{selectedCase.nextFollowUp}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Due Date</p>
                              <p className="font-medium">{selectedCase.dueDate}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* History Timeline Tab */}
                  <TabsContent value="history" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Intervention History Timeline</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedCase.interventions.map((intervention: any, index: number) => (
                            <div key={intervention.id} className="relative pb-4">
                              {index !== selectedCase.interventions.length - 1 && (
                                <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-gray-200" />
                              )}
                              <div className="flex gap-3">
                                <div className="flex-shrink-0">
                                  <div className="w-4 h-4 rounded-full bg-blue-600 mt-1" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-semibold text-gray-900">{intervention.type}</h4>
                                    <Badge variant={intervention.status === 'completed' ? 'outline' : 'secondary'}>
                                      {intervention.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600">{intervention.date}</p>
                                  <p className="text-sm text-gray-700 mt-1">{intervention.notes}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Progress Notes Tab */}
                  <TabsContent value="notes" className="space-y-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Progress Notes</CardTitle>
                        {user?.role !== 'supervisor' && (
                          <Button size="sm" onClick={() => setEditingNote(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Note
                          </Button>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {editingNote && (
                          <div className="p-4 border rounded-lg space-y-3">
                            <Textarea
                              placeholder="Enter progress note..."
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              rows={4}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSaveNote}>
                                <Save className="h-4 w-4 mr-2" />
                                Save Note
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingNote(false)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {selectedCase.notes.map((note: any) => (
                          <div key={note.id} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{note.author[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{note.author}</p>
                                  <p className="text-xs text-gray-600">{note.date}</p>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700">{note.content}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Tasks & Follow-ups Tab */}
                  <TabsContent value="tasks" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Task Completion Checklist</CardTitle>
                        <CardDescription>
                          Track and manage follow-up tasks with automated deadline alerts
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedCase.tasks.map((task: any) => (
                          <div
                            key={task.id}
                            className={`p-4 border rounded-lg ${
                              new Date(task.dueDate) < new Date() && !task.completed
                                ? 'border-red-200 bg-red-50'
                                : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {user?.role !== 'supervisor' && (
                                <Checkbox
                                  checked={task.completed}
                                  onCheckedChange={() => handleTaskToggle(task.id)}
                                  className="mt-1"
                                />
                              )}
                              <div className="flex-1">
                                <p
                                  className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}
                                >
                                  {task.title}
                                </p>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Due: {task.dueDate}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {task.assignedTo}
                                  </span>
                                </div>
                              </div>
                              {task.completed && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Milestones Tab */}
                  <TabsContent value="milestones" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Progress Milestone Tracker</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {selectedCase.milestones.map((milestone: any) => (
                          <div key={milestone.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{milestone.title}</p>
                                <p className="text-sm text-gray-600">Target: {milestone.targetDate}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">{milestone.progress}%</span>
                                <Badge
                                  variant={milestone.status === 'completed' ? 'default' : 'secondary'}
                                >
                                  {milestone.status}
                                </Badge>
                              </div>
                            </div>
                            <Progress value={milestone.progress} className="h-2" />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Attachments Tab */}
                  <TabsContent value="attachments" className="space-y-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Secure File Attachments</CardTitle>
                        {user?.role !== 'supervisor' && (
                          <Button size="sm" onClick={() => setShowFileUploadDialog(true)}>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload File
                          </Button>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedCase.attachments.map((file: any) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-3">
                                <Paperclip className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="font-medium text-sm">{file.name}</p>
                                  <p className="text-xs text-gray-600">
                                    {file.size} • Uploaded {file.uploadDate}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* New Case Dialog */}
        <Dialog open={showCaseDialog} onOpenChange={setShowCaseDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Case File</DialogTitle>
              <DialogDescription>Register a new case for a beneficiary</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Beneficiary Name</Label>
                  <Input placeholder="Full name" />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input placeholder="+250 xxx xxx xxx" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Case Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="child">Child Support</SelectItem>
                      <SelectItem value="youth">Youth Services</SelectItem>
                      <SelectItem value="family">Family Care</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority Level</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assign Social Worker</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select social worker" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jean">Jean Uwase</SelectItem>
                    <SelectItem value="marie">Marie Mukamana</SelectItem>
                    <SelectItem value="patrick">Patrick Niyonzima</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Initial Assessment Notes</Label>
                <Textarea rows={4} placeholder="Document initial assessment findings..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCaseDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowCaseDialog(false)}>Create Case File</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}