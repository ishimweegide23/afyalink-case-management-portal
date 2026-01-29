import { Users, FileText, TrendingUp, AlertCircle, UserPlus, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Button } from '../../components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

/**
 * ADMIN DASHBOARD
 * 
 * PERMISSIONS:
 * - Full system access
 * - View all beneficiaries, cases, interventions across all workers
 * - Manage all users and system settings
 * - Generate comprehensive system-wide reports
 * - View analytics for entire organization
 */

const monthlyData = [
  { month: 'Jan', cases: 45, beneficiaries: 120, interventions: 89 },
  { month: 'Feb', cases: 52, beneficiaries: 135, interventions: 95 },
  { month: 'Mar', cases: 61, beneficiaries: 148, interventions: 112 },
  { month: 'Apr', cases: 58, beneficiaries: 162, interventions: 108 },
  { month: 'May', cases: 67, beneficiaries: 178, interventions: 125 },
  { month: 'Jun', cases: 74, beneficiaries: 195, interventions: 142 },
];

const teamPerformance = [
  { name: 'Jean Uwase', cases: 23, interventions: 45, completion: 92 },
  { name: 'Marie Mukamana', cases: 19, interventions: 38, completion: 88 },
  { name: 'Patrick Niyonzima', cases: 21, interventions: 42, completion: 95 },
  { name: 'Grace Ishimwe', cases: 17, interventions: 35, completion: 85 },
];

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Administrator Dashboard</h1>
        <p className="text-gray-600 mt-1">System overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Beneficiaries</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">195</p>
                <p className="text-xs text-green-600 mt-2">↑ 12% from last month</p>
              </div>
              <Users className="h-12 w-12 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Cases</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">74</p>
                <p className="text-xs text-green-600 mt-2">↑ 8% from last month</p>
              </div>
              <FileText className="h-12 w-12 text-secondary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Interventions</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">142</p>
                <p className="text-xs text-green-600 mt-2">↑ 15% from last month</p>
              </div>
              <Activity className="h-12 w-12 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Team Members</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">12</p>
                <p className="text-xs text-gray-500 mt-2">4 Social Workers</p>
              </div>
              <UserPlus className="h-12 w-12 text-secondary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Cases, beneficiaries, and interventions over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="cases" stroke="#0369A1" strokeWidth={2} />
                <Line type="monotone" dataKey="beneficiaries" stroke="#16A34A" strokeWidth={2} />
                <Line type="monotone" dataKey="interventions" stroke="#0891B2" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Case Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Case Distribution</CardTitle>
            <CardDescription>Cases by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { category: 'Child Support', count: 28 },
                { category: 'Youth Services', count: 22 },
                { category: 'Family Care', count: 16 },
                { category: 'Emergency', count: 8 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0369A1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
          <CardDescription>Social workers case load and completion rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamPerformance.map((member, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{member.name}</p>
                    <Badge variant="secondary">{member.completion}% Complete</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                    <span>{member.cases} Active Cases</span>
                    <span>{member.interventions} Interventions</span>
                  </div>
                  <Progress value={member.completion} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts & Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            System Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">5 cases require supervisor approval</p>
                <p className="text-xs text-gray-600 mt-1">Review pending case updates</p>
              </div>
              <Button size="sm" variant="outline">Review</Button>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Monthly report ready for review</p>
                <p className="text-xs text-gray-600 mt-1">June 2025 program summary</p>
              </div>
              <Button size="sm" variant="outline">View Report</Button>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <UserPlus className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">2 new user registration requests</p>
                <p className="text-xs text-gray-600 mt-1">Approve new team member access</p>
              </div>
              <Button size="sm" variant="outline">Review</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}