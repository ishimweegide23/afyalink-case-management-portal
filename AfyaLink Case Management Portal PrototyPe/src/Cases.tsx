import { useState } from 'react';
import { Search, Plus, Filter, FileText, Calendar, User, AlertCircle, CheckCircle2, Clock, History, Paperclip, MessageSquare, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const cases = [
  {
    id: 'CASE-001',
    beneficiary: 'John Mukiza',
    category: 'Child Support',
    status: 'active',
    priority: 'high',
    assignedTo: 'Jean Uwase',
    openedDate: '2024-11-15',
    lastUpdate: '2024-12-28',
    progress: 75,
    nextFollowUp: '2025-01-07',
    location: 'Kicukiro'
  },
  {
    id: 'CASE-002',
    beneficiary: 'Sarah Uwase',
    category: 'Youth Services',
    status: 'active',
    priority: 'medium',
    assignedTo: 'Marie Mukamana',
    openedDate: '2024-10-20',
    lastUpdate: '2024-12-25',
    progress: 60,
    nextFollowUp: '2025-01-08',
    location: 'Gasabo'
  },
  {
    id: 'CASE-003',
    beneficiary: 'Emmanuel Niyonzima',
    category: 'Child Support',
    status: 'pending',
    priority: 'low',
    assignedTo: 'Patrick Niyonzima',
    openedDate: '2024-12-10',
    lastUpdate: '2024-12-20',
    progress: 30,
    nextFollowUp: '2025-01-10',
    location: 'Nyarugenge'
  },
  {
    id: 'CASE-004',
    beneficiary: 'Grace Ishimwe',
    category: 'Family Care',
    status: 'active',
    priority: 'high',
    assignedTo: 'Grace Ishimwe',
    openedDate: '2024-09-05',
    lastUpdate: '2024-12-30',
    progress: 85,
    nextFollowUp: '2025-01-12',
    location: 'Kicukiro'
  },
  {
    id: 'CASE-005',
    beneficiary: 'David Habimana',
    category: 'Emergency',
    status: 'active',
    priority: 'high',
    assignedTo: 'Jean Uwase',
    openedDate: '2024-12-28',
    lastUpdate: '2024-12-30',
    progress: 45,
    nextFollowUp: '2025-01-05',
    location: 'Gasabo'
  },
];

export function Cases() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = 
      caseItem.beneficiary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || caseItem.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'closed':
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Case Management</h1>
          <p className="text-gray-600 mt-1">Track and manage all case files</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Case
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Case</DialogTitle>
              <DialogDescription>
                Register a new case file for a beneficiary
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="beneficiary">Select Beneficiary</Label>
                <Select>
                  <SelectTrigger id="beneficiary">
                    <SelectValue placeholder="Choose beneficiary" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="john">John Mukiza</SelectItem>
                    <SelectItem value="sarah">Sarah Uwase</SelectItem>
                    <SelectItem value="emmanuel">Emmanuel Niyonzima</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Case Category</Label>
                  <Select>
                    <SelectTrigger id="category">
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
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select>
                    <SelectTrigger id="priority">
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
                <Label htmlFor="description">Case Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide details about the case..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Create Case</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cases</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{cases.length}</p>
              </div>
              <FileText className="h-10 w-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Cases</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {cases.filter(c => c.status === 'active').length}
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
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {cases.filter(c => c.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-10 w-10 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {cases.filter(c => c.priority === 'high').length}
                </p>
              </div>
              <AlertCircle className="h-10 w-10 text-red-500 opacity-20" />
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
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Cases</CardTitle>
          <CardDescription>Complete case file listing with tracking information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Beneficiary</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Next Follow-up</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((caseItem) => (
                  <TableRow key={caseItem.id}>
                    <TableCell className="font-medium">{caseItem.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {caseItem.beneficiary.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{caseItem.beneficiary}</p>
                          <p className="text-xs text-gray-500">{caseItem.location}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{caseItem.category}</TableCell>
                    <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                    <TableCell>{getPriorityBadge(caseItem.priority)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{caseItem.assignedTo}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <Progress value={caseItem.progress} className="h-2 flex-1" />
                        <span className="text-xs text-gray-600">{caseItem.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {caseItem.nextFollowUp}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedCase(caseItem.id)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Case File: {caseItem.id}</DialogTitle>
                            <DialogDescription>
                              {caseItem.beneficiary} - {caseItem.category}
                            </DialogDescription>
                          </DialogHeader>
                          <Tabs defaultValue="overview" className="w-full">
                            <TabsList>
                              <TabsTrigger value="overview">Overview</TabsTrigger>
                              <TabsTrigger value="timeline">Case History</TabsTrigger>
                              <TabsTrigger value="notes">Progress Notes</TabsTrigger>
                              <TabsTrigger value="attachments">Attachments</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="overview" className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Case Information</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Status:</span>
                                      <span>{getStatusBadge(caseItem.status)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Priority:</span>
                                      <span>{getPriorityBadge(caseItem.priority)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Opened:</span>
                                      <span>{caseItem.openedDate}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Last Update:</span>
                                      <span>{caseItem.lastUpdate}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Assigned To:</span>
                                      <span>{caseItem.assignedTo}</span>
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Progress</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm">
                                        <span>Case Progress</span>
                                        <span className="font-medium">{caseItem.progress}%</span>
                                      </div>
                                      <Progress value={caseItem.progress} className="h-2" />
                                    </div>
                                    <div className="pt-2 border-t">
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="h-4 w-4" />
                                        <span>Next Follow-up: {caseItem.nextFollowUp}</span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </TabsContent>

                            <TabsContent value="timeline" className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                    <History className="h-5 w-5" />
                                    Case History Timeline
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-4">
                                    <div className="flex gap-4">
                                      <div className="flex flex-col items-center">
                                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                                        <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                                      </div>
                                      <div className="flex-1 pb-4">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-medium">Case Opened</span>
                                          <span className="text-sm text-gray-500">{caseItem.openedDate}</span>
                                        </div>
                                        <p className="text-sm text-gray-600">Case file created for {caseItem.beneficiary}</p>
                                        <p className="text-xs text-gray-500 mt-1">By {caseItem.assignedTo}</p>
                                      </div>
                                    </div>
                                    <div className="flex gap-4">
                                      <div className="flex flex-col items-center">
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                                      </div>
                                      <div className="flex-1 pb-4">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-medium">Initial Assessment</span>
                                          <span className="text-sm text-gray-500">2024-11-20</span>
                                        </div>
                                        <p className="text-sm text-gray-600">Initial vulnerability assessment completed</p>
                                      </div>
                                    </div>
                                    <div className="flex gap-4">
                                      <div className="flex flex-col items-center">
                                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                        <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                                      </div>
                                      <div className="flex-1 pb-4">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-medium">First Intervention</span>
                                          <span className="text-sm text-gray-500">2024-11-25</span>
                                        </div>
                                        <p className="text-sm text-gray-600">Home visit conducted</p>
                                      </div>
                                    </div>
                                    <div className="flex gap-4">
                                      <div className="flex flex-col items-center">
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-medium">Last Update</span>
                                          <span className="text-sm text-gray-500">{caseItem.lastUpdate}</span>
                                        </div>
                                        <p className="text-sm text-gray-600">Progress notes updated</p>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>

                            <TabsContent value="notes" className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle>Progress Notes</CardTitle>
                                  <CardDescription>Document case progress and observations</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="progressNote">Add Progress Note</Label>
                                    <Textarea
                                      id="progressNote"
                                      placeholder="Enter progress notes, observations, or updates..."
                                      rows={6}
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline">Save as Draft</Button>
                                    <Button>Save Note</Button>
                                  </div>
                                  <div className="border-t pt-4 space-y-3">
                                    <h4 className="font-medium">Recent Notes</h4>
                                    <div className="space-y-3">
                                      <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-sm font-medium">{caseItem.assignedTo}</span>
                                          <span className="text-xs text-gray-500">{caseItem.lastUpdate}</span>
                                        </div>
                                        <p className="text-sm text-gray-700">
                                          Follow-up visit completed. Beneficiary is making good progress with educational support.
                                        </p>
                                      </div>
                                      <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-sm font-medium">{caseItem.assignedTo}</span>
                                          <span className="text-xs text-gray-500">2024-12-20</span>
                                        </div>
                                        <p className="text-sm text-gray-700">
                                          Initial assessment completed. Identified key areas for intervention.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>

                            <TabsContent value="attachments" className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                    <Paperclip className="h-5 w-5" />
                                    Case Attachments
                                  </CardTitle>
                                  <CardDescription>Documents and files related to this case</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    <Paperclip className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600 mb-2">Upload documents related to this case</p>
                                    <Button variant="outline" size="sm">
                                      <Plus className="h-4 w-4 mr-2" />
                                      Upload File
                                    </Button>
                                  </div>
                                  <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Attached Documents</h4>
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                          <FileText className="h-5 w-5 text-primary" />
                                          <div>
                                            <p className="text-sm font-medium">Intake_Form.pdf</p>
                                            <p className="text-xs text-gray-500">Uploaded on {caseItem.openedDate}</p>
                                          </div>
                                        </div>
                                        <Button variant="ghost" size="sm">View</Button>
                                      </div>
                                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                          <FileText className="h-5 w-5 text-primary" />
                                          <div>
                                            <p className="text-sm font-medium">Assessment_Report.pdf</p>
                                            <p className="text-xs text-gray-500">Uploaded on 2024-11-20</p>
                                          </div>
                                        </div>
                                        <Button variant="ghost" size="sm">View</Button>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>
                          </Tabs>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

