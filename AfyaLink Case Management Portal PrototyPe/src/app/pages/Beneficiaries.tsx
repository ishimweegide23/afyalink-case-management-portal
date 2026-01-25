import { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  UserCircle,
  Users,
  Upload,
  Camera,
  Hash,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Home,
  User,
  Edit,
  Eye,
  MessageSquare,
  FileText,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Target,
  Paperclip,
  Send,
  X,
  Save,
  Shield,
  TrendingUp,
  BarChart3,
  Download,
  CheckSquare,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Avatar,
  AvatarFallback,
} from '../components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useAuth } from '../context/AuthContext';
import { Checkbox } from '../components/ui/checkbox';

// Mock data
const initialBeneficiaries = [
  {
    id: 'BEN-001',
    name: 'John Mukiza',
    age: 12,
    gender: 'Male',
    dateOfBirth: '2012-03-15',
    category: 'Child Support',
    caseType: 'Education & Health',
    status: 'Active',
    vulnerabilityLevel: 'High',
    location: 'Kicukiro',
    district: 'Kicukiro',
    sector: 'Niboye',
    cell: 'Kagugu',
    village: 'Umuganda',
    caseWorker: 'Jean Uwase',
    assignedDate: '2024-11-15',
    phone: '+250 788 123 456',
    email: 'john.mukiza@example.com',
    guardian: 'Marie Mukiza',
    guardianPhone: '+250 788 123 457',
    guardianRelation: 'Mother',
    interventions: [
      { id: 1, type: 'Educational Support', date: '2024-12-05', status: 'Completed', outcome: 'Enrolled in school' },
      { id: 2, type: 'Health Assessment', date: '2024-12-15', status: 'Completed', outcome: 'Medical checkup done' },
      { id: 3, type: 'Follow-up Visit', date: '2025-01-07', status: 'Scheduled', outcome: '' },
    ],
    documents: [
      { id: 1, name: 'Birth_Certificate.pdf', type: 'Legal', uploadDate: '2024-11-15', uploadedBy: 'Jean Uwase' },
      { id: 2, name: 'Assessment_Report.pdf', type: 'Report', uploadDate: '2024-11-20', uploadedBy: 'Jean Uwase' },
    ],
    notes: [
      { id: 1, date: '2024-12-28', author: 'Jean Uwase', content: 'Child is progressing well in school. Family situation stable.' },
    ],
    needs: ['Education', 'Healthcare', 'Nutrition'],
    createdDate: '2024-11-15',
    lastUpdated: '2024-12-28',
  },
  {
    id: 'BEN-002',
    name: 'Sarah Uwase',
    age: 15,
    gender: 'Female',
    dateOfBirth: '2009-07-22',
    category: 'Youth Services',
    caseType: 'Vocational Training',
    status: 'Active',
    vulnerabilityLevel: 'Medium',
    location: 'Gasabo',
    district: 'Gasabo',
    sector: 'Remera',
    cell: 'Rukiri',
    village: 'Amahoro',
    caseWorker: 'Marie Mukamana',
    assignedDate: '2024-10-20',
    phone: '+250 788 234 567',
    email: 'sarah.uwase@example.com',
    guardian: 'Paul Uwase',
    guardianPhone: '+250 788 234 568',
    guardianRelation: 'Father',
    interventions: [
      { id: 1, type: 'Skills Assessment', date: '2024-11-10', status: 'Completed', outcome: 'Identified interest in tailoring' },
      { id: 2, type: 'Training Enrollment', date: '2024-12-01', status: 'Completed', outcome: 'Enrolled in vocational center' },
    ],
    documents: [
      { id: 1, name: 'Youth_Profile.pdf', type: 'Profile', uploadDate: '2024-10-20', uploadedBy: 'Marie Mukamana' },
    ],
    notes: [
      { id: 1, date: '2024-12-25', author: 'Marie Mukamana', content: 'Training progressing well. Shows excellent commitment.' },
    ],
    needs: ['Vocational Training', 'Mentorship'],
    createdDate: '2024-10-20',
    lastUpdated: '2024-12-25',
  },
  {
    id: 'BEN-003',
    name: 'Emmanuel Niyonzima',
    age: 8,
    gender: 'Male',
    dateOfBirth: '2016-05-10',
    category: 'Child Support',
    caseType: 'Nutrition & Education',
    status: 'Pending',
    vulnerabilityLevel: 'Medium',
    location: 'Nyarugenge',
    district: 'Nyarugenge',
    sector: 'Nyarugenge',
    cell: 'Rwampara',
    village: 'Ubumwe',
    caseWorker: 'Patrick Niyonzima',
    assignedDate: '2024-12-10',
    phone: '+250 788 345 678',
    email: 'emmanuel.n@example.com',
    guardian: 'Grace Niyonzima',
    guardianPhone: '+250 788 345 679',
    guardianRelation: 'Mother',
    interventions: [
      { id: 1, type: 'Initial Assessment', date: '2024-12-10', status: 'Completed', outcome: 'Needs identified' },
    ],
    documents: [
      { id: 1, name: 'Initial_Assessment.pdf', type: 'Report', uploadDate: '2024-12-10', uploadedBy: 'Patrick Niyonzima' },
    ],
    notes: [
      { id: 1, date: '2024-12-20', author: 'Patrick Niyonzima', content: 'Child requires nutritional support and school enrollment.' },
    ],
    needs: ['Nutrition', 'Education'],
    createdDate: '2024-12-10',
    lastUpdated: '2024-12-20',
  },
  {
    id: 'BEN-004',
    name: 'Grace Habimana',
    age: 35,
    gender: 'Female',
    dateOfBirth: '1989-11-08',
    category: 'Family Care',
    caseType: 'Economic Empowerment',
    status: 'Active',
    vulnerabilityLevel: 'High',
    location: 'Kicukiro',
    district: 'Kicukiro',
    sector: 'Gatenga',
    cell: 'Kabuga',
    village: 'Ineza',
    caseWorker: 'Jean Uwase',
    assignedDate: '2024-09-05',
    phone: '+250 788 456 789',
    email: 'grace.h@example.com',
    guardian: 'Self',
    guardianPhone: '+250 788 456 789',
    guardianRelation: 'Self',
    interventions: [
      { id: 1, type: 'Financial Counseling', date: '2024-10-15', status: 'Completed', outcome: 'Budget planning completed' },
      { id: 2, type: 'Income Generation Support', date: '2024-11-30', status: 'Completed', outcome: 'Small business started' },
    ],
    documents: [
      { id: 1, name: 'Family_Assessment.pdf', type: 'Report', uploadDate: '2024-09-05', uploadedBy: 'Jean Uwase' },
      { id: 2, name: 'Business_Plan.pdf', type: 'Document', uploadDate: '2024-11-30', uploadedBy: 'Jean Uwase' },
    ],
    notes: [
      { id: 1, date: '2024-12-30', author: 'Jean Uwase', content: 'Family showing excellent progress. Income generation successful.' },
    ],
    needs: ['Economic Empowerment', 'Skills Training'],
    createdDate: '2024-09-05',
    lastUpdated: '2024-12-30',
  },
  {
    id: 'BEN-005',
    name: 'Alice Mutoni',
    age: 19,
    gender: 'Female',
    dateOfBirth: '2005-02-14',
    category: 'Youth Services',
    caseType: 'Vocational Training',
    status: 'Active',
    vulnerabilityLevel: 'Low',
    location: 'Kicukiro',
    district: 'Kicukiro',
    sector: 'Kicukiro',
    cell: 'Nyanza',
    village: 'Umudugudu',
    caseWorker: 'Marie Mukamana',
    assignedDate: '2024-08-12',
    phone: '+250 788 567 890',
    email: 'alice.m@example.com',
    guardian: 'Self',
    guardianPhone: '+250 788 567 890',
    guardianRelation: 'Self',
    interventions: [
      { id: 1, type: 'Skills Training', date: '2024-09-15', status: 'Completed', outcome: 'Completed tailoring training' },
      { id: 2, type: 'Job Placement', date: '2024-12-01', status: 'Completed', outcome: 'Placed in cooperative' },
    ],
    documents: [
      { id: 1, name: 'Training_Certificate.pdf', type: 'Certificate', uploadDate: '2024-12-01', uploadedBy: 'Marie Mukamana' },
    ],
    notes: [
      { id: 1, date: '2024-12-20', author: 'Marie Mukamana', content: 'Successfully employed. Case ready for closure.' },
    ],
    needs: ['Job Placement'],
    createdDate: '2024-08-12',
    lastUpdated: '2024-12-20',
  },
];

export function Beneficiaries() {
  const { user } = useAuth();
  const [beneficiaries, setBeneficiaries] = useState(initialBeneficiaries);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [vulnerabilityFilter, setVulnerabilityFilter] = useState('all');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showInterventionDialog, setShowInterventionDialog] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  // Registration form state
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    age: '',
    gender: '',
    dateOfBirth: '',
    category: '',
    caseType: '',
    district: '',
    sector: '',
    phone: '',
    guardian: '',
    guardianPhone: '',
    guardianRelation: '',
    needs: [] as string[],
    initialNotes: '',
  });

  // Intervention form state
  const [interventionForm, setInterventionForm] = useState({
    type: '',
    description: '',
    scheduledDate: '',
    expectedOutcome: '',
  });

  // Filter beneficiaries based on role
  const getFilteredBeneficiaries = () => {
    let filtered = beneficiaries;

    // Role-based filtering
    if (user?.role === 'social_worker') {
      // Social workers see only their assigned beneficiaries
      filtered = filtered.filter(
        (ben) => ben.caseWorker === 'Jean Uwase' || ben.caseWorker === user.name
      );
    } else if (user?.role === 'supervisor') {
      // Supervisors see all beneficiaries (in real app, filter by team)
      filtered = beneficiaries;
    } else if (user?.role === 'admin') {
      // Admins should not access this page directly
      return [];
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (ben) =>
          ben.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ben.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ben.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((ben) => ben.status === statusFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((ben) => ben.category === categoryFilter);
    }

    // Apply vulnerability filter
    if (vulnerabilityFilter !== 'all') {
      filtered = filtered.filter((ben) => ben.vulnerabilityLevel === vulnerabilityFilter);
    }

    return filtered;
  };

  const filteredBeneficiaries = getFilteredBeneficiaries();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'Closed':
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getVulnerabilityBadge = (level: string) => {
    switch (level) {
      case 'High':
        return <Badge variant="destructive">High Risk</Badge>;
      case 'Medium':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Medium Risk</Badge>;
      case 'Low':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Low Risk</Badge>;
      default:
        return <Badge variant="secondary">{level}</Badge>;
    }
  };

  const handleRegisterBeneficiary = () => {
    const newBeneficiary = {
      id: `BEN-${String(beneficiaries.length + 1).padStart(3, '0')}`,
      name: registrationForm.name,
      age: parseInt(registrationForm.age),
      gender: registrationForm.gender,
      dateOfBirth: registrationForm.dateOfBirth,
      category: registrationForm.category,
      caseType: registrationForm.caseType,
      status: 'Pending',
      vulnerabilityLevel: 'Medium',
      location: registrationForm.district,
      district: registrationForm.district,
      sector: registrationForm.sector,
      cell: '',
      village: '',
      caseWorker: user?.name || 'Current User',
      assignedDate: new Date().toISOString().split('T')[0],
      phone: registrationForm.phone,
      email: '',
      guardian: registrationForm.guardian,
      guardianPhone: registrationForm.guardianPhone,
      guardianRelation: registrationForm.guardianRelation,
      interventions: [],
      documents: [],
      notes: registrationForm.initialNotes
        ? [
            {
              id: 1,
              date: new Date().toISOString().split('T')[0],
              author: user?.name || 'Current User',
              content: registrationForm.initialNotes,
            },
          ]
        : [],
      needs: registrationForm.needs,
      createdDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    setBeneficiaries([newBeneficiary, ...beneficiaries]);
    setShowRegisterDialog(false);
    // Reset form
    setRegistrationForm({
      name: '',
      age: '',
      gender: '',
      dateOfBirth: '',
      category: '',
      caseType: '',
      district: '',
      sector: '',
      phone: '',
      guardian: '',
      guardianPhone: '',
      guardianRelation: '',
      needs: [],
      initialNotes: '',
    });
  };

  const handleCreateIntervention = () => {
    if (selectedBeneficiary) {
      const newIntervention = {
        id: selectedBeneficiary.interventions.length + 1,
        type: interventionForm.type,
        date: interventionForm.scheduledDate,
        status: 'Scheduled',
        outcome: '',
        description: interventionForm.description,
        expectedOutcome: interventionForm.expectedOutcome,
      };

      const updatedBeneficiary = {
        ...selectedBeneficiary,
        interventions: [...selectedBeneficiary.interventions, newIntervention],
        lastUpdated: new Date().toISOString().split('T')[0],
      };

      setBeneficiaries(beneficiaries.map((b) => (b.id === updatedBeneficiary.id ? updatedBeneficiary : b)));
      setSelectedBeneficiary(updatedBeneficiary);
      setShowInterventionDialog(false);
      setInterventionForm({
        type: '',
        description: '',
        scheduledDate: '',
        expectedOutcome: '',
      });
    }
  };

  const handleUpdateBeneficiary = () => {
    if (selectedBeneficiary) {
      const updatedBeneficiary = {
        ...selectedBeneficiary,
        lastUpdated: new Date().toISOString().split('T')[0],
      };

      setBeneficiaries(beneficiaries.map((b) => (b.id === updatedBeneficiary.id ? updatedBeneficiary : b)));
      setSelectedBeneficiary(updatedBeneficiary);
      setEditMode(false);
    }
  };

  const handleSendMessage = () => {
    // In a real app, this would send a message to the supervisor
    alert(`Message sent to supervisor:\n${newMessage}`);
    setNewMessage('');
    setShowMessageDialog(false);
  };

  const toggleNeed = (need: string) => {
    setRegistrationForm((prev) => ({
      ...prev,
      needs: prev.needs.includes(need) ? prev.needs.filter((n) => n !== need) : [...prev.needs, need],
    }));
  };

  // Get statistics
  const stats = {
    total: filteredBeneficiaries.length,
    active: filteredBeneficiaries.filter((b) => b.status === 'Active').length,
    pending: filteredBeneficiaries.filter((b) => b.status === 'Pending').length,
    highRisk: filteredBeneficiaries.filter((b) => b.vulnerabilityLevel === 'High').length,
  };

  // Admin redirect
  if (user?.role === 'admin') {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Administrators do not manage beneficiaries directly. Please access beneficiary data through the Reports
            and Analytics pages.
          </AlertDescription>
        </Alert>
        <Card>
          <CardHeader>
            <CardTitle>Quick Links for Administrators</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button variant="outline" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              View Reports
            </Button>
            <Button variant="outline" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Beneficiary Management</h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'social_worker' && 'Register and manage your assigned beneficiaries'}
            {user?.role === 'supervisor' && 'Monitor beneficiaries and review interventions'}
          </p>
        </div>
        <div className="flex gap-2">
          {user?.role === 'social_worker' && (
            <Button onClick={() => setShowRegisterDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Register Beneficiary
            </Button>
          )}
          {user?.role === 'supervisor' && (
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Generate Report
            </Button>
          )}
        </div>
      </div>

      {/* Role-based permission notice */}
      {user?.role === 'social_worker' && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You can only view and manage beneficiaries assigned to you. To discuss cases or request support, use the
            messaging feature.
          </AlertDescription>
        </Alert>
      )}

      {user?.role === 'supervisor' && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You have read-only access to beneficiary profiles. You can review interventions and request reports from
            social workers.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {user?.role === 'social_worker' ? 'My Beneficiaries' : 'Total Beneficiaries'}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <Users className="h-10 w-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Cases</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.active}</p>
              </div>
              <Activity className="h-10 w-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pending}</p>
              </div>
              <Clock className="h-10 w-10 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Risk</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.highRisk}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-red-500 opacity-20" />
            </div>
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
                placeholder="Search by name, ID, or location..."
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
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Child Support">Child Support</SelectItem>
                <SelectItem value="Youth Services">Youth Services</SelectItem>
                <SelectItem value="Family Care">Family Care</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
            <Select value={vulnerabilityFilter} onValueChange={setVulnerabilityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Vulnerability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="High">High Risk</SelectItem>
                <SelectItem value="Medium">Medium Risk</SelectItem>
                <SelectItem value="Low">Low Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Beneficiaries List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBeneficiaries.map((beneficiary) => (
          <Card
            key={beneficiary.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedBeneficiary(beneficiary)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                      {beneficiary.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">{beneficiary.name}</h3>
                    <p className="text-sm text-gray-600">{beneficiary.id}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(beneficiary.status)}
                  {getVulnerabilityBadge(beneficiary.vulnerabilityLevel)}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="h-4 w-4" />
                    <span>
                      {beneficiary.gender}, {beneficiary.age} years
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{beneficiary.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>{beneficiary.category}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <UserCircle className="h-4 w-4" />
                    <span>SW: {beneficiary.caseWorker}</span>
                  </div>
                </div>

                <div className="pt-3 border-t flex items-center justify-between text-xs text-gray-500">
                  <span>{beneficiary.interventions.length} interventions</span>
                  <span>Updated: {beneficiary.lastUpdated}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBeneficiaries.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No beneficiaries found</p>
          </CardContent>
        </Card>
      )}

      {/* Beneficiary Detail Dialog */}
      <Dialog open={selectedBeneficiary !== null} onOpenChange={() => setSelectedBeneficiary(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {selectedBeneficiary && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="flex items-center gap-3">
                      <span>{selectedBeneficiary.name}</span>
                      {getStatusBadge(selectedBeneficiary.status)}
                      {getVulnerabilityBadge(selectedBeneficiary.vulnerabilityLevel)}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedBeneficiary.id} • Assigned to {selectedBeneficiary.caseWorker} •{' '}
                      {selectedBeneficiary.assignedDate}
                    </DialogDescription>
                  </div>
                  {user?.role === 'social_worker' && (
                    <div className="flex gap-2">
                      {!editMode ? (
                        <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" onClick={handleUpdateBeneficiary}>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </DialogHeader>

              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="interventions">Interventions</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="messages">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Messages
                  </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Full Name</p>
                        {editMode ? (
                          <Input
                            value={selectedBeneficiary.name}
                            onChange={(e) =>
                              setSelectedBeneficiary({ ...selectedBeneficiary, name: e.target.value })
                            }
                          />
                        ) : (
                          <p className="font-medium">{selectedBeneficiary.name}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-gray-600">Date of Birth</p>
                        <p className="font-medium">{selectedBeneficiary.dateOfBirth}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Age</p>
                        <p className="font-medium">{selectedBeneficiary.age} years</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Gender</p>
                        <p className="font-medium">{selectedBeneficiary.gender}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Category</p>
                        <p className="font-medium">{selectedBeneficiary.category}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Case Type</p>
                        {editMode ? (
                          <Input
                            value={selectedBeneficiary.caseType}
                            onChange={(e) =>
                              setSelectedBeneficiary({ ...selectedBeneficiary, caseType: e.target.value })
                            }
                          />
                        ) : (
                          <p className="font-medium">{selectedBeneficiary.caseType}</p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600 mb-2">Identified Needs</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedBeneficiary.needs.map((need: string, idx: number) => (
                            <Badge key={idx} variant="outline">
                              {need}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <p className="font-medium">{selectedBeneficiary.phone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <p className="font-medium">{selectedBeneficiary.email || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600">Location</p>
                        <p className="font-medium">
                          {selectedBeneficiary.village}, {selectedBeneficiary.cell}, {selectedBeneficiary.sector},{' '}
                          {selectedBeneficiary.district}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Guardian Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Guardian Name</p>
                        <p className="font-medium">{selectedBeneficiary.guardian}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Relation</p>
                        <p className="font-medium">{selectedBeneficiary.guardianRelation}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600">Guardian Phone</p>
                        <p className="font-medium">{selectedBeneficiary.guardianPhone}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Case Status</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Status</p>
                        {editMode && user?.role === 'social_worker' ? (
                          <Select
                            value={selectedBeneficiary.status}
                            onValueChange={(value) =>
                              setSelectedBeneficiary({ ...selectedBeneficiary, status: value })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          getStatusBadge(selectedBeneficiary.status)
                        )}
                      </div>
                      <div>
                        <p className="text-gray-600">Vulnerability Level</p>
                        {editMode && user?.role === 'social_worker' ? (
                          <Select
                            value={selectedBeneficiary.vulnerabilityLevel}
                            onValueChange={(value) =>
                              setSelectedBeneficiary({ ...selectedBeneficiary, vulnerabilityLevel: value })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="High">High Risk</SelectItem>
                              <SelectItem value="Medium">Medium Risk</SelectItem>
                              <SelectItem value="Low">Low Risk</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          getVulnerabilityBadge(selectedBeneficiary.vulnerabilityLevel)
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Interventions Tab */}
                <TabsContent value="interventions" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Intervention History</h3>
                    {user?.role === 'social_worker' && (
                      <Button size="sm" onClick={() => setShowInterventionDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Intervention
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {selectedBeneficiary.interventions.map((intervention: any) => (
                      <Card key={intervention.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{intervention.type}</h4>
                                <Badge
                                  variant={
                                    intervention.status === 'Completed'
                                      ? 'outline'
                                      : intervention.status === 'Scheduled'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                >
                                  {intervention.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">Date: {intervention.date}</p>
                              {intervention.outcome && (
                                <p className="text-sm text-gray-700 mt-2">
                                  <strong>Outcome:</strong> {intervention.outcome}
                                </p>
                              )}
                            </div>
                            {user?.role === 'supervisor' && intervention.status === 'Completed' && (
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline">
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Documents</h3>
                    {user?.role === 'social_worker' && (
                      <Button size="sm" onClick={() => setShowDocumentDialog(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {selectedBeneficiary.documents.map((doc: any) => (
                      <Card key={doc.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Paperclip className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="font-medium">{doc.name}</p>
                                <p className="text-xs text-gray-600">
                                  Uploaded by {doc.uploadedBy} on {doc.uploadDate}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Notes Tab */}
                <TabsContent value="notes" className="space-y-4">
                  <div className="space-y-3">
                    {selectedBeneficiary.notes.map((note: any) => (
                      <Card key={note.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{note.author[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium text-sm">{note.author}</p>
                                <p className="text-xs text-gray-600">{note.date}</p>
                              </div>
                              <p className="text-sm text-gray-700">{note.content}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Messages Tab */}
                <TabsContent value="messages" className="space-y-4">
                  {user?.role === 'social_worker' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Message Supervisor</CardTitle>
                        <CardDescription>
                          Send a message to your supervisor about this beneficiary
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Textarea
                          placeholder="Type your message here..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          rows={4}
                        />
                        <Button onClick={handleSendMessage}>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {user?.role === 'supervisor' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Request Report</CardTitle>
                        <CardDescription>
                          Request a report from the assigned social worker
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button>
                          <FileText className="h-4 w-4 mr-2" />
                          Request Progress Report
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Register Beneficiary Dialog (Social Worker Only) */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register New Beneficiary</DialogTitle>
            <DialogDescription>
              Add a new beneficiary to your caseload. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-900">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    placeholder="e.g., John Mukiza"
                    value={registrationForm.name}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth *</Label>
                  <Input
                    type="date"
                    value={registrationForm.dateOfBirth}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, dateOfBirth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Age *</Label>
                  <Input
                    type="number"
                    placeholder="Age"
                    value={registrationForm.age}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, age: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <Select
                    value={registrationForm.gender}
                    onValueChange={(value) => setRegistrationForm({ ...registrationForm, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    placeholder="+250 xxx xxx xxx"
                    value={registrationForm.phone}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Case Information */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-sm text-gray-900">Case Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Case Category *</Label>
                  <Select
                    value={registrationForm.category}
                    onValueChange={(value) => setRegistrationForm({ ...registrationForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Child Support">Child Support</SelectItem>
                      <SelectItem value="Youth Services">Youth Services</SelectItem>
                      <SelectItem value="Family Care">Family Care</SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Case Type *</Label>
                  <Select
                    value={registrationForm.caseType}
                    onValueChange={(value) => setRegistrationForm({ ...registrationForm, caseType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Health">Health</SelectItem>
                      <SelectItem value="Protection">Protection</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Nutrition">Nutrition</SelectItem>
                      <SelectItem value="Vocational Training">Vocational Training</SelectItem>
                      <SelectItem value="Economic Empowerment">Economic Empowerment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Identified Needs</Label>
                <div className="grid grid-cols-2 gap-3">
                  {['Education', 'Healthcare', 'Nutrition', 'Protection', 'Vocational Training', 'Economic Support'].map(
                    (need) => (
                      <div key={need} className="flex items-center space-x-2">
                        <Checkbox
                          id={need}
                          checked={registrationForm.needs.includes(need)}
                          onCheckedChange={() => toggleNeed(need)}
                        />
                        <label htmlFor={need} className="text-sm cursor-pointer">
                          {need}
                        </label>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-sm text-gray-900">Location</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>District *</Label>
                  <Select
                    value={registrationForm.district}
                    onValueChange={(value) => setRegistrationForm({ ...registrationForm, district: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kicukiro">Kicukiro</SelectItem>
                      <SelectItem value="Gasabo">Gasabo</SelectItem>
                      <SelectItem value="Nyarugenge">Nyarugenge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sector *</Label>
                  <Input
                    placeholder="Enter sector"
                    value={registrationForm.sector}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, sector: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Guardian Information */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-sm text-gray-900">Guardian Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Guardian Name *</Label>
                  <Input
                    placeholder="Guardian name"
                    value={registrationForm.guardian}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, guardian: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Guardian Phone</Label>
                  <Input
                    placeholder="+250 xxx xxx xxx"
                    value={registrationForm.guardianPhone}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, guardianPhone: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Relation to Beneficiary *</Label>
                  <Select
                    value={registrationForm.guardianRelation}
                    onValueChange={(value) => setRegistrationForm({ ...registrationForm, guardianRelation: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mother">Mother</SelectItem>
                      <SelectItem value="Father">Father</SelectItem>
                      <SelectItem value="Grandmother">Grandmother</SelectItem>
                      <SelectItem value="Grandfather">Grandfather</SelectItem>
                      <SelectItem value="Aunt">Aunt</SelectItem>
                      <SelectItem value="Uncle">Uncle</SelectItem>
                      <SelectItem value="Sibling">Sibling</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                      <SelectItem value="Self">Self</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Initial Notes */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-sm text-gray-900">Initial Assessment Notes</h3>
              <Textarea
                placeholder="Document initial findings, observations, and immediate needs..."
                rows={4}
                value={registrationForm.initialNotes}
                onChange={(e) => setRegistrationForm({ ...registrationForm, initialNotes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegisterDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRegisterBeneficiary}>
              <Save className="h-4 w-4 mr-2" />
              Register Beneficiary
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Intervention Dialog (Social Worker Only) */}
      <Dialog open={showInterventionDialog} onOpenChange={setShowInterventionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Intervention</DialogTitle>
            <DialogDescription>
              Plan an intervention for {selectedBeneficiary?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Intervention Type *</Label>
              <Select
                value={interventionForm.type}
                onValueChange={(value) => setInterventionForm({ ...interventionForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Home Visit">Home Visit</SelectItem>
                  <SelectItem value="Health Assessment">Health Assessment</SelectItem>
                  <SelectItem value="Educational Support">Educational Support</SelectItem>
                  <SelectItem value="Counseling">Counseling</SelectItem>
                  <SelectItem value="Skills Training">Skills Training</SelectItem>
                  <SelectItem value="Follow-up Visit">Follow-up Visit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe the intervention plan..."
                rows={3}
                value={interventionForm.description}
                onChange={(e) => setInterventionForm({ ...interventionForm, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Scheduled Date *</Label>
              <Input
                type="date"
                value={interventionForm.scheduledDate}
                onChange={(e) => setInterventionForm({ ...interventionForm, scheduledDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Expected Outcome</Label>
              <Textarea
                placeholder="What do you expect to achieve?"
                rows={2}
                value={interventionForm.expectedOutcome}
                onChange={(e) => setInterventionForm({ ...interventionForm, expectedOutcome: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInterventionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateIntervention}>
              <Save className="h-4 w-4 mr-2" />
              Create Intervention
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document for {selectedBeneficiary?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Legal">Legal Document</SelectItem>
                  <SelectItem value="Report">Report</SelectItem>
                  <SelectItem value="Assessment">Assessment</SelectItem>
                  <SelectItem value="Certificate">Certificate</SelectItem>
                  <SelectItem value="Photo">Photo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG up to 10MB</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDocumentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowDocumentDialog(false)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
