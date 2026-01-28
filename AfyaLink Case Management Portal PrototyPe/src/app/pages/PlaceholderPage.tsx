import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-1">{description}</p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <Icon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            This feature is under development and will be available soon. 
            The complete system will include full functionality for {title.toLowerCase()}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
