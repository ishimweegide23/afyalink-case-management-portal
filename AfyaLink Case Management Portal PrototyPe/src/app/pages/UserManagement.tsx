import { useState } from 'react';
import {
  UserPlus,
  Search,
  Shield,
  Briefcase,
  UserCircle,
  MoreVertical,
  Edit,
  Trash2,
  Key,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Upload,
  Filter,
  X,
  Save,
  Eye,
  EyeOff,
  Lock,
  Unlock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../context/AuthContext';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

/**
 * USER MANAGEMENT PAGE
 * 
 * PERMISSIONS:
 * - ADMIN ONLY: Full access to create, edit, deactivate users
 * - Supervisors: Can view team members but cannot manage users
 * - Social Workers: No access to this page
 */

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'social_worker';
  status: 'Active' | 'Inactive' | 'Suspended';
  joinDate: string;
  lastActive: string;
  casesAssigned: number;
  phone?: string;
  district?: string;
  supervisor?: string;
  permissions?: string[];
}

const initialUsers: User[] = [
  {
    id: 1,
    name: 'Jean Uwase',
    email: 'jean.uwase@amu.rw',
    role: 'social_worker',
    status: 'Active',
    joinDate: '2024-01-15',
    lastActive: '2 hours ago',
    casesAssigned: 23,
    phone: '+250 788 123 456',
    district: 'Kicukiro',
    supervisor: 'Emmanuel Kabera',
    permissions: ['view_cases', 'create_cases', 'update_cases', 'upload_documents'],
  },
  {
    id: 2,
    name: 'Marie Mukamana',
    email: 'marie.mukamana@amu.rw',
    role: 'social_worker',
    status: 'Active',
    joinDate: '2024-02-20',
    lastActive: '5 hours ago',
    casesAssigned: 19,
    phone: '+250 788 234 567',
    district: 'Gasabo',
    supervisor: 'Emmanuel Kabera',
    permissions: ['view_cases', 'create_cases', 'update_cases', 'upload_documents'],
  },
  {
    id: 3,
    name: 'Patrick Niyonzima',
    email: 'patrick.n@amu.rw',
    role: 'social_worker',
    status: 'Active',
    joinDate: '2024-03-10',
    lastActive: '1 day ago',
    casesAssigned: 21,
    phone: '+250 788 345 678',
    district: 'Nyarugenge',
    supervisor: 'Sarah Umutoni',
    permissions: ['view_cases', 'create_cases', 'update_cases', 'upload_documents'],
  },
  {
    id: 4,
    name: 'Grace Ishimwe',
    email: 'grace.ishimwe@amu.rw',
    role: 'social_worker',
    status: 'Active',
    joinDate: '2024-04-05',
    lastActive: '3 hours ago',
    casesAssigned: 17,
    phone: '+250 788 456 789',
    district: 'Kicukiro',
    supervisor: 'Sarah Umutoni',
    permissions: ['view_cases', 'create_cases', 'update_cases', 'upload_documents'],
  },
  {
    id: 5,
    name: 'Emmanuel Kabera',
    email: 'emmanuel.k@amu.rw',
    role: 'supervisor',
    status: 'Active',
    joinDate: '2023-11-01',
    lastActive: '1 hour ago',
    casesAssigned: 0,
    phone: '+250 788 567 890',
    district: 'Kicukiro',
    permissions: ['view_cases', 'approve_interventions', 'generate_reports', 'manage_team'],
  },
  {
    id: 6,
    name: 'Sarah Umutoni',
    email: 'sarah.u@amu.rw',
    role: 'supervisor',
    status: 'Active',
    joinDate: '2023-12-15',
    lastActive: '4 hours ago',
    casesAssigned: 0,
    phone: '+250 788 678 901',
    district: 'Gasabo',
    permissions: ['view_cases', 'approve_interventions', 'generate_reports', 'manage_team'],
  },
  {
    id: 7,
    name: 'Admin User',
    email: 'admin@amu.rw',
    role: 'admin',
    status: 'Active',
    joinDate: '2023-10-01',
    lastActive: 'Just now',
    casesAssigned: 0,
    phone: '+250 788 789 012',
    permissions: ['all_permissions'],
  },
  {
    id: 8,
    name: 'David Habimana',
    email: 'david.h@amu.rw',
    role: 'social_worker',
    status: 'Inactive',
    joinDate: '2023-09-10',
    lastActive: '30 days ago',
    casesAssigned: 0,
    phone: '+250 788 890 123',
    district: 'Gasabo',
    supervisor: 'Emmanuel Kabera',
    permissions: ['view_cases'],
  },
];

interface AccessRequest {
  id: number;
  name: string;
  email: string;
  requestedRole: string;
  requestDate: string;
  message: string;
}

const initialAccessRequests: AccessRequest[] = [
  {
    id: 1,
    name: 'David Mugisha',
    email: 'david.m@amu.rw',
    requestedRole: 'social_worker',
    requestDate: '2025-01-25',
    message: 'I am a qualified social worker with 5 years of experience.',
  },
  {
    id: 2,
    name: 'Alice Uwera',
    email: 'alice.u@amu.rw',
    requestedRole: 'supervisor',
    requestDate: '2025-01-24',
    message: 'I have been working as a social worker and would like to take on supervisory responsibilities.',
  },
];

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(initialAccessRequests);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showViewUserDialog, setShowViewUserDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // New user form
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'social_worker' as 'admin' | 'supervisor' | 'social_worker',
    district: '',
    supervisor: '',
    password: '',
    confirmPassword: '',
  });

  // Edit user form
  const [editUserForm, setEditUserForm] = useState<Partial<User>>({});

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'supervisor':
        return <Briefcase className="h-4 w-4" />;
      case 'social_worker':
        return <UserCircle className="h-4 w-4" />;
      default:
        return <UserCircle className="h-4 w-4" />;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'supervisor':
        return 'Supervisor';
      case 'social_worker':
        return 'Social Worker';
      default:
        return 'User';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'supervisor':
        return 'default';
      case 'social_worker':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'Inactive':
        return (
          <Badge variant="outline">
            <XCircle className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        );
      case 'Suspended':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Suspended
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleAddUser = () => {
    const newUser: User = {
      id: users.length + 1,
      name: newUserForm.name,
      email: newUserForm.email,
      phone: newUserForm.phone,
      role: newUserForm.role,
      district: newUserForm.district,
      supervisor: newUserForm.supervisor,
      status: 'Active',
      joinDate: new Date().toISOString().split('T')[0],
      lastActive: 'Just now',
      casesAssigned: 0,
      permissions: [],
    };

    setUsers([...users, newUser]);
    setShowAddUserDialog(false);
    setNewUserForm({
      name: '',
      email: '',
      phone: '',
      role: 'social_worker',
      district: '',
      supervisor: '',
      password: '',
      confirmPassword: '',
    });
  };

  const handleEditUser = () => {
    if (selectedUser) {
      setUsers(
        users.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                ...editUserForm,
              }
            : u
        )
      );
      setShowEditUserDialog(false);
      setSelectedUser(null);
      setEditUserForm({});
    }
  };

  const handleDeleteUser = () => {
    if (selectedUser) {
      setUsers(users.filter((u) => u.id !== selectedUser.id));
      setShowDeleteDialog(false);
      setSelectedUser(null);
    }
  };

  const handleToggleUserStatus = (userId: number) => {
    setUsers(
      users.map((u) =>
        u.id === userId
          ? {
              ...u,
              status: u.status === 'Active' ? 'Inactive' : 'Active',
            }
          : u
      )
    );
  };

  const handleApproveRequest = (requestId: number) => {
    const request = accessRequests.find((r) => r.id === requestId);
    if (request) {
      const newUser: User = {
        id: users.length + 1,
        name: request.name,
        email: request.email,
        role: request.requestedRole as 'admin' | 'supervisor' | 'social_worker',
        status: 'Active',
        joinDate: new Date().toISOString().split('T')[0],
        lastActive: 'Just now',
        casesAssigned: 0,
        permissions: [],
      };
      setUsers([...users, newUser]);
      setAccessRequests(accessRequests.filter((r) => r.id !== requestId));
    }
  };

  const handleRejectRequest = (requestId: number) => {
    setAccessRequests(accessRequests.filter((r) => r.id !== requestId));
  };

  const handleResetPassword = () => {
    alert(`Password reset link sent to ${selectedUser?.email}`);
    setShowResetPasswordDialog(false);
    setSelectedUser(null);
  };

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'Active').length,
    socialWorkers: users.filter((u) => u.role === 'social_worker').length,
    supervisors: users.filter((u) => u.role === 'supervisor').length,
    admins: users.filter((u) => u.role === 'admin').length,
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to access this page. Only administrators can manage users.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users, roles, and permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Users
          </Button>
          <Button onClick={() => setShowAddUserDialog(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add New User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <UserCircle className="h-10 w-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
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
                <p className="text-sm text-gray-600">Social Workers</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.socialWorkers}</p>
              </div>
              <UserCircle className="h-10 w-10 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Supervisors</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.supervisors}</p>
              </div>
              <Briefcase className="h-10 w-10 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Administrators</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.admins}</p>
              </div>
              <Shield className="h-10 w-10 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative col-span-1 sm:col-span-2 lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="social_worker">Social Worker</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">All Users ({filteredUsers.length})</TabsTrigger>
          <TabsTrigger value="requests">
            Access Requests
            {accessRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {accessRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Users List */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Users</CardTitle>
              <CardDescription>
                Manage all users in the AfyaLink system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-medium text-gray-900">{user.name}</h4>
                        <Badge variant={getRoleColor(user.role)} className="gap-1">
                          {getRoleIcon(user.role)}
                          {getRoleName(user.role)}
                        </Badge>
                        {getStatusBadge(user.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Mail className="h-3 w-3" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        {user.phone && (
                          <>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{user.phone}</span>
                            </div>
                            <span>•</span>
                          </>
                        )}
                        {user.district && (
                          <>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{user.district}</span>
                            </div>
                            <span>•</span>
                          </>
                        )}
                        <span>Joined: {user.joinDate}</span>
                        <span>•</span>
                        <span>Last active: {user.lastActive}</span>
                        {user.casesAssigned > 0 && (
                          <>
                            <span>•</span>
                            <span>{user.casesAssigned} cases assigned</span>
                          </>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setShowViewUserDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setEditUserForm(user);
                            setShowEditUserDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id)}>
                          {user.status === 'Active' ? (
                            <>
                              <Lock className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Unlock className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setShowResetPasswordDialog(true);
                          }}
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteDialog(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>

              {filteredUsers.length === 0 && (
                <div className="p-12 text-center">
                  <UserCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No users found matching your search.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Requests */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Access Requests</CardTitle>
              <CardDescription>
                Review and approve or reject access requests from new users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {accessRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{request.name}</p>
                        <Badge variant="outline">{getRoleName(request.requestedRole)}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Mail className="h-3 w-3" />
                        <span>{request.email}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{request.message}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Requested on {request.requestDate}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectRequest(request.id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button size="sm" onClick={() => handleApproveRequest(request.id)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}

                {accessRequests.length === 0 && (
                  <div className="p-12 text-center">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No pending access requests</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account in the system</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  placeholder="e.g., Jean Uwase"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input
                  type="email"
                  placeholder="email@amu.rw"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  placeholder="+250 xxx xxx xxx"
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select
                  value={newUserForm.role}
                  onValueChange={(value: any) => setNewUserForm({ ...newUserForm, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social_worker">Social Worker</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newUserForm.role === 'social_worker' && (
                <>
                  <div className="space-y-2">
                    <Label>District</Label>
                    <Select
                      value={newUserForm.district}
                      onValueChange={(value) => setNewUserForm({ ...newUserForm, district: value })}
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
                    <Label>Supervisor</Label>
                    <Select
                      value={newUserForm.supervisor}
                      onValueChange={(value) => setNewUserForm({ ...newUserForm, supervisor: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select supervisor" />
                      </SelectTrigger>
                      <SelectContent>
                        {users
                          .filter((u) => u.role === 'supervisor')
                          .map((supervisor) => (
                            <SelectItem key={supervisor.id} value={supervisor.name}>
                              {supervisor.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label>Temporary Password *</Label>
                <Input
                  type="password"
                  placeholder="Enter temporary password"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm Password *</Label>
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={newUserForm.confirmPassword}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, confirmPassword: e.target.value })
                  }
                />
              </div>
            </div>

            <Alert>
              <AlertDescription>
                A welcome email with login credentials will be sent to the user's email address.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>
              <Save className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={editUserForm.name || ''}
                    onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={editUserForm.email || ''}
                    onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={editUserForm.phone || ''}
                    onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={editUserForm.role}
                    onValueChange={(value: any) => setEditUserForm({ ...editUserForm, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="social_worker">Social Worker</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editUserForm.role === 'social_worker' && (
                  <>
                    <div className="space-y-2">
                      <Label>District</Label>
                      <Select
                        value={editUserForm.district}
                        onValueChange={(value) => setEditUserForm({ ...editUserForm, district: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Kicukiro">Kicukiro</SelectItem>
                          <SelectItem value="Gasabo">Gasabo</SelectItem>
                          <SelectItem value="Nyarugenge">Nyarugenge</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Supervisor</Label>
                      <Select
                        value={editUserForm.supervisor}
                        onValueChange={(value) => setEditUserForm({ ...editUserForm, supervisor: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {users
                            .filter((u) => u.role === 'supervisor')
                            .map((supervisor) => (
                              <SelectItem key={supervisor.id} value={supervisor.name}>
                                {supervisor.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={showViewUserDialog} onOpenChange={setShowViewUserDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>Detailed user information</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {selectedUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={getRoleColor(selectedUser.role)} className="gap-1">
                      {getRoleIcon(selectedUser.role)}
                      {getRoleName(selectedUser.role)}
                    </Badge>
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                {selectedUser.phone && (
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-medium">{selectedUser.phone}</p>
                  </div>
                )}
                {selectedUser.district && (
                  <div>
                    <p className="text-gray-600">District</p>
                    <p className="font-medium">{selectedUser.district}</p>
                  </div>
                )}
                {selectedUser.supervisor && (
                  <div>
                    <p className="text-gray-600">Supervisor</p>
                    <p className="font-medium">{selectedUser.supervisor}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-600">Join Date</p>
                  <p className="font-medium">{selectedUser.joinDate}</p>
                </div>
                <div>
                  <p className="text-gray-600">Last Active</p>
                  <p className="font-medium">{selectedUser.lastActive}</p>
                </div>
                {selectedUser.casesAssigned > 0 && (
                  <div>
                    <p className="text-gray-600">Cases Assigned</p>
                    <p className="font-medium">{selectedUser.casesAssigned}</p>
                  </div>
                )}
              </div>

              {selectedUser.permissions && selectedUser.permissions.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Permissions</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.permissions.map((perm, idx) => (
                      <Badge key={idx} variant="outline">
                        {perm.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowViewUserDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You are about to permanently delete <strong>{selectedUser.name}</strong> (
                {selectedUser.email}). All associated data will be removed.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Send a password reset link to the user's email address
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                A password reset link will be sent to <strong>{selectedUser.email}</strong>
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword}>
              <Key className="h-4 w-4 mr-2" />
              Send Reset Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
