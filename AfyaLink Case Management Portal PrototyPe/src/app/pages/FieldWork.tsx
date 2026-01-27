import { MapPin, Calendar, CheckSquare, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';

export function FieldWork() {
  const todayVisits = [
    {
      time: '09:00 AM',
      beneficiary: 'Amani Mugisha',
      address: 'Kicukiro District, Gatenga Sector',
      purpose: 'Home assessment and family counseling',
      status: 'Completed',
      notes: 'Family situation improving, child attending school regularly'
    },
    {
      time: '11:30 AM',
      beneficiary: 'Divine Uwera',
      address: 'Gasabo District, Remera Sector',
      purpose: 'Health check-up follow-up',
      status: 'In Progress',
      notes: ''
    },
    {
      time: '02:00 PM',
      beneficiary: 'Eric Nshimiyimana',
      address: 'Nyarugenge District, Muhima Sector',
      purpose: 'Educational support assessment',
      status: 'Scheduled',
      notes: ''
    },
  ];

  const upcomingTasks = [
    { task: 'Complete case file for Amani Mugisha', deadline: 'Today, 5:00 PM', priority: 'High' },
    { task: 'Submit monthly report to supervisor', deadline: 'Tomorrow', priority: 'High' },
    { task: 'Follow-up call with Divine\'s family', deadline: 'Jan 8, 2024', priority: 'Medium' },
    { task: 'Attend team meeting', deadline: 'Jan 9, 2024', priority: 'Medium' },
  ];

  const recentActivities = [
    { action: 'Completed home visit', beneficiary: 'Marie Uwimana', time: '2 hours ago' },
    { action: 'Updated case notes', beneficiary: 'David Hakizimana', time: '4 hours ago' },
    { action: 'Created intervention plan', beneficiary: 'Sarah Iradukunda', time: '5 hours ago' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Field Work</h1>
        <p className="text-gray-600 mt-1">Manage your daily field activities and home visits</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-primary">3</div>
                <div className="text-sm text-gray-600 mt-1">Visits Today</div>
              </div>
              <Calendar className="h-10 w-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-600">1</div>
                <div className="text-sm text-gray-600 mt-1">Completed</div>
              </div>
              <CheckSquare className="h-10 w-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-orange-600">4</div>
                <div className="text-sm text-gray-600 mt-1">Pending Tasks</div>
              </div>
              <Clock className="h-10 w-10 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900">28</div>
                <div className="text-sm text-gray-600 mt-1">Active Cases</div>
              </div>
              <MapPin className="h-10 w-10 text-gray-900 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>Your scheduled home visits and field activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayVisits.map((visit, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:border-primary transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-lg font-bold text-primary">{visit.time.split(':')[0]}</div>
                            <div className="text-xs text-primary/70">{visit.time.split(' ')[1]}</div>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{visit.beneficiary}</h3>
                          <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                            <MapPin className="h-3 w-3" />
                            {visit.address}
                          </div>
                        </div>
                      </div>
                      <Badge className={
                        visit.status === 'Completed' ? 'bg-green-100 text-green-800 border-green-200' :
                        visit.status === 'In Progress' ? 'bg-primary/10 text-primary border-primary/20' :
                        'bg-gray-100 text-gray-800 border-gray-200'
                      } variant="outline">
                        {visit.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{visit.purpose}</p>
                    {visit.notes && (
                      <div className="bg-green-50 border border-green-200 rounded p-2 text-sm text-green-800">
                        <strong>Notes:</strong> {visit.notes}
                      </div>
                    )}
                    {visit.status === 'Scheduled' && (
                      <div className="mt-3 flex gap-2">
                        <Button size="sm">
                          Start Visit
                        </Button>
                        <Button size="sm" variant="outline">
                          Get Directions
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest field work updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium text-gray-900">{activity.action}</div>
                      <div className="text-sm text-gray-600">{activity.beneficiary}</div>
                      <div className="text-xs text-gray-500 mt-1">{activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Tasks</CardTitle>
              <CardDescription>Tasks requiring your attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingTasks.map((task, index) => (
                  <div key={index} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-2 mb-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-2 ${
                        task.priority === 'High' ? 'bg-red-500' : 'bg-orange-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{task.task}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-600">{task.deadline}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={
                      task.priority === 'High' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                    }>
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Progress</CardTitle>
              <CardDescription>January 2024</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Home Visits</span>
                    <span className="font-medium">42 / 50</span>
                  </div>
                  <Progress value={84} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Cases Completed</span>
                    <span className="font-medium">12 / 15</span>
                  </div>
                  <Progress value={80} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Reports Submitted</span>
                    <span className="font-medium">8 / 10</span>
                  </div>
                  <Progress value={80} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}