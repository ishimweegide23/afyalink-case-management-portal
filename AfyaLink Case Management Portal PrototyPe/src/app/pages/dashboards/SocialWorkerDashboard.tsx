import { Calendar, Clock, Users, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';

/**
 * SOCIAL WORKER DASHBOARD
 * 
 * PERMISSIONS:
 * - Manage ONLY their assigned cases
 * - Register new beneficiaries
 * - Create and update case files for assigned beneficiaries
 * - Record interventions for their cases
 * - Schedule follow-ups
 * - Upload documents for their cases
 * - View own performance summary
 * - Cannot access other workers' cases
 */

const upcomingFollowUps = [
  { id: 1, beneficiary: 'John Mukiza', type: 'Home Visit', date: '2025-01-07', time: '10:00 AM', priority: 'high' },
  { id: 2, beneficiary: 'Sarah Uwase', type: 'Medical Check', date: '2025-01-08', time: '2:00 PM', priority: 'medium' },
  { id: 3, beneficiary: 'Emmanuel Niyonzima', type: 'Education Review', date: '2025-01-10', time: '11:00 AM', priority: 'low' },
  { id: 4, beneficiary: 'Grace Ishimwe', type: 'Family Meeting', date: '2025-01-12', time: '3:00 PM', priority: 'high' },
];

const myCases = [
  { id: 1, name: 'John Mukiza', age: 12, status: 'active', progress: 75, lastVisit: '2024-12-28' },
  { id: 2, name: 'Sarah Uwase', age: 15, status: 'active', progress: 60, lastVisit: '2024-12-25' },
  { id: 3, name: 'Emmanuel Niyonzima', age: 8, status: 'pending', progress: 30, lastVisit: '2024-12-20' },
  { id: 4, name: 'Grace Ishimwe', age: 17, status: 'active', progress: 85, lastVisit: '2024-12-30' },
];

export function SocialWorkerDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Social Worker Dashboard</h1>
        <p className="text-gray-600 mt-1">My cases and upcoming activities</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assigned Cases</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">23</p>
              </div>
              <FileText className="h-10 w-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Beneficiaries</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">45</p>
              </div>
              <Users className="h-10 w-10 text-secondary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Follow-ups Today</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">3</p>
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
                <p className="text-3xl font-bold text-gray-900 mt-1">12</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Follow-ups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Follow-ups
          </CardTitle>
          <CardDescription>Scheduled visits and activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingFollowUps.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{item.beneficiary}</p>
                    <Badge variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'default' : 'secondary'}>
                      {item.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{item.type}</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    {item.date}
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="h-4 w-4" />
                    {item.time}
                  </div>
                </div>
                <Button size="sm">View Details</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* My Cases */}
      <Card>
        <CardHeader>
          <CardTitle>My Active Cases</CardTitle>
          <CardDescription>Current beneficiaries under your care</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {myCases.map((caseItem) => (
              <div key={caseItem.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium">{caseItem.name}</p>
                    <p className="text-sm text-gray-600">Age: {caseItem.age} • Last visit: {caseItem.lastVisit}</p>
                  </div>
                  <Badge variant={caseItem.status === 'active' ? 'default' : 'secondary'}>
                    {caseItem.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Case Progress</span>
                    <span className="font-medium">{caseItem.progress}%</span>
                  </div>
                  <Progress value={caseItem.progress} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts & Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Alerts & Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Overdue intervention report</p>
                <p className="text-xs text-gray-600 mt-1">Submit report for Sarah Uwase medical check</p>
              </div>
              <Button size="sm" variant="outline">Submit</Button>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Weekly report due tomorrow</p>
                <p className="text-xs text-gray-600 mt-1">Complete and submit your weekly activity report</p>
              </div>
              <Button size="sm" variant="outline">Start Report</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}