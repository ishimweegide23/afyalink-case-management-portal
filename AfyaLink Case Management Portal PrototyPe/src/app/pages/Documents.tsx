// Ensure responsive layout on mobile devices
import { useState } from 'react';
import { Upload, File, Folder, Search, Download, Trash2, Eye, Archive, Shield, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../context/AuthContext';
import { Alert, AlertDescription } from '../components/ui/alert';

const documents = [
  {
    id: 'DOC-001',
    name: 'Case Report - John Mukiza Q4 2024.pdf',
    type: 'Report',
    size: '2.3 MB',
    uploadedBy: 'Jean Uwase',
    uploadDate: '2024-12-28',
    beneficiary: 'John Mukiza',
    category: 'Case Reports'
  },
  {
    id: 'DOC-002',
    name: 'Medical Certificate - Sarah Uwase.pdf',
    type: 'Medical',
    size: '1.1 MB',
    uploadedBy: 'Marie Mukamana',
    uploadDate: '2025-01-04',
    beneficiary: 'Sarah Uwase',
    category: 'Medical Records'
  },
  {
    id: 'DOC-003',
    name: 'Birth Certificate - Emmanuel Niyonzima.pdf',
    type: 'Legal',
    size: '0.8 MB',
    uploadedBy: 'Patrick Niyonzima',
    uploadDate: '2024-12-20',
    beneficiary: 'Emmanuel Niyonzima',
    category: 'Legal Documents'
  },
  {
    id: 'DOC-004',
    name: 'School Report Card - Grace Ishimwe 2024.pdf',
    type: 'Education',
    size: '0.5 MB',
    uploadedBy: 'Jean Uwase',
    uploadDate: '2024-12-15',
    beneficiary: 'Grace Ishimwe',
    category: 'Education Records'
  },
  {
    id: 'DOC-005',
    name: 'Family Assessment Form.docx',
    type: 'Assessment',
    size: '1.7 MB',
    uploadedBy: 'Grace Ishimwe',
    uploadDate: '2025-01-02',
    beneficiary: 'David Habimana',
    category: 'Assessments'
  },
  {
    id: 'DOC-006',
    name: 'Training Certificate - Alice Mutoni.pdf',
    type: 'Certificate',
    size: '0.9 MB',
    uploadedBy: 'Marie Mukamana',
    uploadDate: '2025-01-05',
    beneficiary: 'Alice Mutoni',
    category: 'Certificates'
  },
  {
    id: 'DOC-007',
    name: 'Home Visit Photos - January 2025.zip',
    type: 'Photos',
    size: '15.2 MB',
    uploadedBy: 'Jean Uwase',
    uploadDate: '2025-01-06',
    beneficiary: 'Multiple',
    category: 'Supporting Documents'
  },
  {
    id: 'DOC-008',
    name: 'Monthly Progress Report - December 2024.xlsx',
    type: 'Report',
    size: '3.4 MB',
    uploadedBy: 'Marie Mukamana',
    uploadDate: '2025-01-03',
    beneficiary: 'All',
    category: 'Program Reports'
  },
];

const categories = [
  { name: 'Case Reports', count: 12, icon: File },
  { name: 'Medical Records', count: 8, icon: File },
  { name: 'Legal Documents', count: 15, icon: File },
  { name: 'Education Records', count: 10, icon: File },
  { name: 'Assessments', count: 7, icon: File },
  { name: 'Certificates', count: 5, icon: File },
];

export function Documents() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter documents based on role
  const getFilteredDocuments = () => {
    let filtered = documents;

    // Role-based filtering
    if (user?.role === 'social_worker') {
      // Social workers see only documents they uploaded or related to their cases
      filtered = filtered.filter(
        (doc) => doc.uploadedBy === 'Jean Uwase' || doc.uploadedBy === user.name
      );
    } else if (user?.role === 'supervisor') {
      // Supervisors see all documents (in real app, filter by team)
      filtered = documents;
    } else if (user?.role === 'admin') {
      // Admins see all documents system-wide
      filtered = documents;
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (doc) =>
          doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.beneficiary.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredDocuments = getFilteredDocuments();

  const getFileIcon = (type: string) => {
    return <File className="h-5 w-5 text-primary" />;
  };

  const formatFileSize = (size: string) => {
    return size;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Storage</h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'social_worker' && 'Manage your case documents'}
            {user?.role === 'supervisor' && 'Access team documents'}
            {user?.role === 'admin' && 'System-wide secure document management'}
          </p>
        </div>
        <div className="flex gap-2">
          {user?.role !== 'supervisor' && (
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>
          )}
          {user?.role === 'admin' && (
            <>
              <Button variant="outline" className="gap-2">
                <Archive className="h-4 w-4" />
                Archive
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export All
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Role-based permission notice */}
      {user?.role !== 'admin' && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            {user?.role === 'social_worker' &&
              'You can view and manage documents for your assigned cases only.'}
            {user?.role === 'supervisor' &&
              'You can view team documents. Upload and delete actions are restricted.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Storage Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {user?.role === 'admin' ? 'Total Documents' : 'Your Documents'}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{filteredDocuments.length}</p>
              </div>
              <File className="h-10 w-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Storage Used</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">28.9 MB</p>
              </div>
              <Folder className="h-10 w-10 text-secondary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Uploaded This Month</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">5</p>
              </div>
              <Upload className="h-10 w-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.name}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <Badge variant="secondary">{category.count}</Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Documents Grid */}
          <div className="grid grid-cols-1 gap-3">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">{getFileIcon(doc.type)}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{doc.name}</h4>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-600">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>•</span>
                        <span>{doc.beneficiary}</span>
                        <span>•</span>
                        <span>Uploaded by {doc.uploadedBy}</span>
                        <span>•</span>
                        <span>{doc.uploadDate}</span>
                      </div>
                      <div className="mt-2">
                        <Badge variant="outline">{doc.category}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                      {/* Only social workers and admins can delete */}
                      {user?.role !== 'supervisor' && (
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                      {/* Only admins can archive */}
                      {user?.role === 'admin' && (
                        <Button variant="ghost" size="icon">
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDocuments.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No documents found matching your search.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}