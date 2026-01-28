import { Bell, Clock, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const notifications = [
  {
    id: 1,
    type: 'urgent',
    title: 'Overdue Follow-up',
    message: 'Follow-up visit for John Mukiza was scheduled for yesterday',
    time: '2 hours ago',
    read: false,
    action: 'Reschedule'
  },
  {
    id: 2,
    type: 'reminder',
    title: 'Upcoming Intervention',
    message: 'Home visit for Sarah Uwase scheduled tomorrow at 10:00 AM',
    time: '5 hours ago',
    read: false,
    action: 'View Details'
  },
  {
    id: 3,
    type: 'success',
    title: 'Report Submitted',
    message: 'Your monthly report has been successfully submitted and approved',
    time: '1 day ago',
    read: true,
    action: null
  },
  {
    id: 4,
    type: 'info',
    title: 'New Document Uploaded',
    message: 'Medical certificate added to Grace Ishimwe case file',
    time: '1 day ago',
    read: false,
    action: 'View Document'
  },
  {
    id: 5,
    type: 'reminder',
    title: 'Case Review Due',
    message: 'Quarterly review for Emmanuel Niyonzima due in 3 days',
    time: '2 days ago',
    read: false,
    action: 'Start Review'
  },
  {
    id: 6,
    type: 'urgent',
    title: 'Emergency Case',
    message: 'New emergency case assigned: David Habimana requires immediate attention',
    time: '3 days ago',
    read: true,
    action: 'View Case'
  },
  {
    id: 7,
    type: 'info',
    title: 'Training Session',
    message: 'Mandatory training session on new protocols scheduled for next week',
    time: '4 days ago',
    read: true,
    action: 'Register'
  },
  {
    id: 8,
    type: 'success',
    title: 'Case Closed',
    message: 'Case CASE-045 successfully closed and archived',
    time: '5 days ago',
    read: true,
    action: null
  },
];

const systemAlerts = [
  {
    id: 1,
    type: 'warning',
    title: 'System Maintenance',
    message: 'Scheduled maintenance on January 15, 2025 from 2:00 AM - 4:00 AM',
    date: '2025-01-10'
  },
  {
    id: 2,
    type: 'info',
    title: 'New Feature Available',
    message: 'Document scanner feature now available in mobile app',
    date: '2025-01-08'
  },
];

export function Notifications() {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'reminder':
        return <Clock className="h-5 w-5 text-orange-600" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationBg = (type: string, read: boolean) => {
    if (read) return 'bg-gray-50 opacity-75';
    
    switch (type) {
      case 'urgent':
        return 'bg-red-50 border-red-200';
      case 'reminder':
        return 'bg-orange-50 border-orange-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-white';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications & Alerts</h1>
          <p className="text-gray-600 mt-1">Stay updated with system alerts and reminders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Mark All as Read</Button>
          <Button variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{unreadCount}</p>
              </div>
              <Bell className="h-10 w-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Urgent</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {notifications.filter(n => n.type === 'urgent' && !n.read).length}
                </p>
              </div>
              <AlertTriangle className="h-10 w-10 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reminders</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">
                  {notifications.filter(n => n.type === 'reminder' && !n.read).length}
                </p>
              </div>
              <Clock className="h-10 w-10 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5 text-blue-600" />
              System Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemAlerts.map((alert) => (
                <div key={alert.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-blue-900">{alert.title}</p>
                      <p className="text-sm text-blue-700 mt-1">{alert.message}</p>
                      <p className="text-xs text-blue-600 mt-2">{alert.date}</p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="urgent">Urgent ({notifications.filter(n => n.type === 'urgent').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {notifications.map((notification) => (
            <Card key={notification.id} className={`border ${getNotificationBg(notification.type, notification.read)}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{notification.title}</h4>
                          {!notification.read && (
                            <Badge variant="secondary" className="text-xs">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                      </div>
                    </div>
                    {notification.action && (
                      <div className="mt-3">
                        <Button size="sm" variant="outline">
                          {notification.action}
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="unread" className="space-y-3">
          {notifications.filter(n => !n.read).map((notification) => (
            <Card key={notification.id} className={`border ${getNotificationBg(notification.type, notification.read)}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{notification.title}</h4>
                          <Badge variant="secondary" className="text-xs">New</Badge>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                      </div>
                    </div>
                    {notification.action && (
                      <div className="mt-3">
                        <Button size="sm" variant="outline">
                          {notification.action}
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="urgent" className="space-y-3">
          {notifications.filter(n => n.type === 'urgent').map((notification) => (
            <Card key={notification.id} className={`border ${getNotificationBg(notification.type, notification.read)}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{notification.title}</h4>
                          {!notification.read && (
                            <Badge variant="secondary" className="text-xs">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                      </div>
                    </div>
                    {notification.action && (
                      <div className="mt-3">
                        <Button size="sm" variant="outline">
                          {notification.action}
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
