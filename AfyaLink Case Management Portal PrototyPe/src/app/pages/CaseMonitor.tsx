import React, { useMemo, useState } from 'react';
import { Search, Plus, Eye, Filter, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

export function CaseMonitor() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [cases, setCases] = useState([
    { id: 'CS-2024-215', beneficiary: 'Sophie Kayitesi', type: 'Educational Support', status: 'In Progress', priority: 'High', assignedTo: 'Jean Uwase', dueDate: '2025-01-15', lastUpdate: '2 hours ago', interventions: 3 },
    { id: 'CS-2024-208', beneficiary: 'Jean Paul Habimana', type: 'Healthcare Access', status: 'Pending Review', priority: 'Medium', assignedTo: 'Marie Mukamana', dueDate: '2025-01-20', lastUpdate: '1 day ago', interventions: 2 },
    { id: 'CS-2024-201', beneficiary: 'Alice Ingabire', type: 'Family Counseling', status: 'In Progress', priority: 'Medium', assignedTo: 'Patrick Niyonzima', dueDate: '2025-01-18', lastUpdate: '3 hours ago', interventions: 5 },
    { id: 'CS-2024-195', beneficiary: 'Esperance Mukeshimana', type: 'Food Security', status: 'In Progress', priority: 'High', assignedTo: 'Grace Ishimwe', dueDate: '2025-01-22', lastUpdate: '5 hours ago', interventions: 4 },
    { id: 'CS-2024-187', beneficiary: 'Marie Uwase', type: 'Protection Services', status: 'Urgent', priority: 'High', assignedTo: 'Jean Uwase', dueDate: '2025-01-10', lastUpdate: '30 mins ago', interventions: 6 },
    { id: 'CS-2024-156', beneficiary: 'Emmanuel Mugabo', type: 'Psychosocial Support', status: 'Under Review', priority: 'Medium', assignedTo: 'Jean Uwase', dueDate: '2025-01-25', lastUpdate: '2 days ago', interventions: 3 },
  ]);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [assignTo, setAssignTo] = useState('Jean Uwase');
  const [assignPriority, setAssignPriority] = useState('Medium');
  const [assignDueDate, setAssignDueDate] = useState('2025-01-15');
  const [assignNote, setAssignNote] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'In Progress':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'Pending Review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Under Review':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchesSearch =
        c.beneficiary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || c.status.toLowerCase().includes(filterStatus.replace('-', ' '));
      return matchesSearch && matchesStatus;
    });
  }, [cases, searchQuery, filterStatus]);

  const handleAssign = () => {
    if (!selectedCase) return;
    setCases((prev) =>
      prev.map((c) =>
        c.id === selectedCase
          ? {
              ...c,
              assignedTo: assignTo,
              priority: assignPriority,
              dueDate: assignDueDate,
              status: c.status === 'Pending Review' ? 'In Progress' : c.status,
              lastUpdate: 'Just now (assignment sent)',
            }
          : c
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Case Monitor</h1>
          <p className="text-gray-600 mt-1">Track and monitor team case progress</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New Case
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-gray-900">187</div>
            <div className="text-sm text-gray-600 mt-1">Total Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-red-600">8</div>
            <div className="text-sm text-gray-600 mt-1">Urgent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-orange-600">15</div>
            <div className="text-sm text-gray-600 mt-1">Pending Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-green-600">42</div>
            <div className="text-sm text-gray-600 mt-1">Closed (Month)</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by case ID, beneficiary name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cases</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Case Files</CardTitle>
          <CardDescription>All registered cases in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Beneficiary</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Interventions</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Last Update</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((caseItem) => (
                  <TableRow key={caseItem.id}>
                    <TableCell className="font-mono text-sm">{caseItem.id}</TableCell>
                    <TableCell className="font-medium">{caseItem.beneficiary}</TableCell>
                    <TableCell className="text-sm">{caseItem.type}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(caseItem.status)}>
                        {caseItem.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={caseItem.priority === 'High' ? 'destructive' : 'secondary'}>
                        {caseItem.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{caseItem.interventions}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{caseItem.assignedTo}</TableCell>
                    <TableCell className="text-sm">{caseItem.dueDate}</TableCell>
                    <TableCell className="text-sm text-gray-600">{caseItem.lastUpdate}</TableCell>
                    <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCase(caseItem.id);
                            setAssignTo(caseItem.assignedTo);
                            setAssignPriority(caseItem.priority);
                            setAssignDueDate(caseItem.dueDate || assignDueDate);
                            setAssignNote('');
                          }}
                        >
                          Assign
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Assign / Reassign Case</DialogTitle>
                          <DialogDescription>
                            Notify the selected social worker with priority and due date.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Social Worker</Label>
                            <Select value={assignTo} onValueChange={setAssignTo}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select worker" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Jean Uwase">Jean Uwase</SelectItem>
                                <SelectItem value="Marie Mukamana">Marie Mukamana</SelectItem>
                                <SelectItem value="Patrick Niyonzima">Patrick Niyonzima</SelectItem>
                                <SelectItem value="Grace Ishimwe">Grace Ishimwe</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select value={assignPriority} onValueChange={setAssignPriority}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Due Date</Label>
                            <Input type="date" value={assignDueDate} onChange={(e) => setAssignDueDate(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Note (optional)</Label>
                            <Textarea
                              placeholder="Add instructions or context for the social worker"
                              value={assignNote}
                              onChange={(e) => setAssignNote(e.target.value)}
                              rows={3}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline">Cancel</Button>
                            <Button onClick={handleAssign}>Assign</Button>
                          </div>
                          <p className="text-xs text-gray-500">
                            The assignee will receive a notification and the case will appear in their dashboard.
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
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