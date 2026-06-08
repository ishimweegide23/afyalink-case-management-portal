// Optimization: Check for unnecessary re-renders
import { useState } from "react";
import {
  Download,
  Filter,
  Calendar,
  TrendingUp,
  Users,
  FileText,
  BarChart3,
  Shield,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { Alert, AlertDescription } from "../components/ui/alert";

const monthlyData = [
  {
    month: "Jan",
    cases: 45,
    beneficiaries: 120,
    interventions: 89,
  },
  {
    month: "Feb",
    cases: 52,
    beneficiaries: 135,
    interventions: 95,
  },
  {
    month: "Mar",
    cases: 61,
    beneficiaries: 148,
    interventions: 112,
  },
  {
    month: "Apr",
    cases: 58,
    beneficiaries: 162,
    interventions: 108,
  },
  {
    month: "May",
    cases: 67,
    beneficiaries: 178,
    interventions: 125,
  },
  {
    month: "Jun",
    cases: 74,
    beneficiaries: 195,
    interventions: 142,
  },
];

const categoryData = [
  { category: "Child Support", count: 28, percentage: 38 },
  { category: "Youth Services", count: 22, percentage: 30 },
  { category: "Family Care", count: 16, percentage: 22 },
  { category: "Emergency", count: 8, percentage: 10 },
];

const pieData = [
  { name: "Active", value: 65, color: "#16A34A" },
  { name: "Pending", value: 20, color: "#F59E0B" },
  { name: "Closed", value: 15, color: "#64748B" },
];

const reports = [
  {
    id: "RPT-001",
    title: "Monthly Program Report - December 2024",
    type: "Monthly Summary",
    generatedDate: "2025-01-01",
    period: "December 2024",
    status: "completed",
    size: "2.4 MB",
  },
  {
    id: "RPT-002",
    title: "Quarterly Performance Analysis - Q4 2024",
    type: "Quarterly Analysis",
    generatedDate: "2025-01-01",
    period: "Q4 2024",
    status: "completed",
    size: "4.8 MB",
  },
  {
    id: "RPT-003",
    title: "Beneficiary Demographics Report",
    type: "Demographics",
    generatedDate: "2024-12-28",
    period: "All Time",
    status: "completed",
    size: "1.2 MB",
  },
  {
    id: "RPT-004",
    title: "Team Performance Report - December 2024",
    type: "Performance",
    generatedDate: "2024-12-30",
    period: "December 2024",
    status: "completed",
    size: "3.1 MB",
  },
];

export function Reports() {
  const { user } = useAuth();
  const [periodFilter, setPeriodFilter] = useState("last-6-months");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            {user?.role === "social_worker" &&
              "View your performance summary and case statistics"}
            {user?.role === "supervisor" &&
              "Monitor team performance and generate reports"}
            {user?.role === "admin" &&
              "System-wide analytics and comprehensive reporting"}
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={periodFilter}
            onValueChange={setPeriodFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-month">
                Last Month
              </SelectItem>
              <SelectItem value="last-3-months">
                Last 3 Months
              </SelectItem>
              <SelectItem value="last-6-months">
                Last 6 Months
              </SelectItem>
              <SelectItem value="last-year">
                Last Year
              </SelectItem>
              <SelectItem value="all-time">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export {user?.role === "social_worker" ? "My Report" : "Report"}
          </Button>
        </div>
      </div>

      {/* Role-based permission notice */}
      {user?.role === "social_worker" && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You can view your own performance metrics and statistics for your assigned cases only.
          </AlertDescription>
        </Alert>
      )}

      {user?.role === "supervisor" && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You can view team performance metrics and generate reports for your supervised team members.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Total Beneficiaries
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  195
                </p>
                <p className="text-xs text-green-600 mt-2">
                  ↑ 12% from last month
                </p>
              </div>
              <Users className="h-12 w-12 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Active Cases
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  74
                </p>
                <p className="text-xs text-green-600 mt-2">
                  ↑ 8% from last month
                </p>
              </div>
              <FileText className="h-12 w-12 text-secondary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Interventions
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  142
                </p>
                <p className="text-xs text-green-600 mt-2">
                  ↑ 15% from last month
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Completion Rate
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  87%
                </p>
                <p className="text-xs text-green-600 mt-2">
                  ↑ 3% from last month
                </p>
              </div>
              <BarChart3 className="h-12 w-12 text-secondary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>
              Cases, beneficiaries, and interventions over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cases"
                  stroke="#0369A1"
                  strokeWidth={2}
                  name="Cases"
                />
                <Line
                  type="monotone"
                  dataKey="beneficiaries"
                  stroke="#16A34A"
                  strokeWidth={2}
                  name="Beneficiaries"
                />
                <Line
                  type="monotone"
                  dataKey="interventions"
                  stroke="#0891B2"
                  strokeWidth={2}
                  name="Interventions"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Case Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Case Distribution by Category</CardTitle>
            <CardDescription>
              Breakdown of cases by service category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0369A1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Case Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Case Status Overview</CardTitle>
            <CardDescription>
              Distribution of cases by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>
              Detailed category statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryData.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {item.category}
                    </span>
                    <span className="text-gray-600">
                      {item.count} cases ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generated Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
          <CardDescription>
            Download previously generated reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">
                      {report.title}
                    </h3>
                    <Badge variant="secondary">
                      {report.type}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                    <span>Period: {report.period}</span>
                    <span>
                      Generated: {report.generatedDate}
                    </span>
                    <span>Size: {report.size}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}