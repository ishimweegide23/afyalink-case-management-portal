import { Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

export function Schedule() {
  const schedule = [
    { time: '09:00 AM', title: 'Home Visit', beneficiary: 'Marie Uwase', location: 'Kicukiro, Niboye', type: 'visit' },
    { time: '11:00 AM', title: 'Team Meeting', beneficiary: 'N/A', location: 'AMU Office', type: 'meeting' },
    { time: '02:00 PM', title: 'Counseling Session', beneficiary: 'Emmanuel Mugabo', location: 'AMU Office', type: 'counseling' },
    { time: '04:30 PM', title: 'Progress Check', beneficiary: 'Alice Ingabire', location: 'Phone Call', type: 'follow-up' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Schedule & Calendar</h1>
        <p className="text-gray-600 mt-1">Your appointments and follow-ups</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule - January 5, 2026</CardTitle>
          <CardDescription>Your appointments for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {schedule.map((item, index) => (
              <div key={index} className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex flex-col items-center justify-center min-w-[80px] p-3 bg-primary/10 rounded-lg">
                  <Clock className="h-5 w-5 text-primary mb-1" />
                  <span className="text-sm font-semibold text-gray-900">{item.time}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{item.beneficiary}</p>
                  <p className="text-sm text-gray-500 mt-1">📍 {item.location}</p>
                </div>
                <Badge variant="outline" className="h-fit">
                  {item.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

