import { Users, FileText, CheckCircle2, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';

/**
 * SUPERVISOR DASHBOARD
 * 
 * PERMISSIONS:
 * - View cases of assigned social workers only
 * - Review case progress and details
 * - Approve or comment on interventions
 * - Generate reports for their team
 * - Monitor team performance
 * - Cannot create users (monitoring role)
 */

const pendingApprovals = [
  { id: 1, worker: 'Jean Uwase', case: 'John Mukiza - Case Update', submitted: '2 hours ago', type: 'Case Update' },
  { id: 2, worker: 'Marie Mukamana', case: 'Sarah Uwase - Intervention Plan', submitted: '5 hours ago', type: 'Intervention' },
  { id: 3, worker: 'Patrick Niyonzima', case: 'Family Support Request', submitted: '1 day ago', type: 'Resource Request' },
];

const teamOverview = [
  { name: 'Jean Uwase', cases: 23, completed: 12, pending: 3, performance: 92 },
  { name: 'Marie Mukamana', cases: 19, completed: 10, pending: 2, performance: 88 },
  { name: 'Patrick Niyonzima', cases: 21, completed: 14, pending: 1, performance: 95 },
  { name: 'Grace Ishimwe', cases: 17, completed: 9, pending: 2, performance: 85 },
];

export function SupervisorDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Supervisor Dashboard</h1>
        <p className="text-gray-600 mt-1">Team oversight and approvals</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Team Members</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">4</p>
              </div>
              <Users className="h-10 w-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cases</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">80</p>
              </div>
              <FileText className="h-10 w-10 text-secondary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approvals</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">8</p>
              </div>
              <Clock className="h-10 w-10 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed This Week</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">45</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Pending Approvals
          </CardTitle>
          <CardDescription>Review and approve team submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingApprovals.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{item.case}</p>
                    <Badge variant="outline">{item.type}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">Submitted by {item.worker} • {item.submitted}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Reject</Button>
                  <Button size="sm">Approve</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Team Performance Overview
          </CardTitle>
          <CardDescription>Monitor social workers' caseload and productivity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamOverview.map((member, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <div className="flex gap-3 text-sm text-gray-600 mt-1">
                      <span>{member.cases} Cases</span>
                      <span>•</span>
                      <span>{member.completed} Completed</span>
                      <span>•</span>
                      <span className="text-orange-600">{member.pending} Pending</span>
                    </div>
                  </div>
                  <Badge variant={member.performance >= 90 ? 'default' : member.performance >= 80 ? 'secondary' : 'outline'}>
                    {member.performance}% Performance
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Overall Progress</span>
                    <span className="font-medium">{member.performance}%</span>
                  </div>
                  <Progress value={member.performance} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Case Progress Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Completed Cases</span>
                </div>
                <span className="text-lg font-bold text-green-600">45</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">In Progress</span>
                </div>
                <span className="text-lg font-bold text-blue-600">28</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium">Requires Attention</span>
                </div>
                <span className="text-lg font-bold text-orange-600">7</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">Quarterly Performance Review</p>
                <p className="text-xs text-gray-600 mt-1">Due in 5 days</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">Monthly Team Meeting</p>
                <p className="text-xs text-gray-600 mt-1">Scheduled for Jan 15, 2025</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">Program Impact Assessment</p>
                <p className="text-xs text-gray-600 mt-1">Due in 2 weeks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}