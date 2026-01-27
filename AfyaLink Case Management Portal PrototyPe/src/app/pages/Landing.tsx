import { Link } from "react-router-dom";
import {
  Heart,
  Users,
  FileText,
  TrendingUp,
  Shield,
  Clock,
  ArrowRight,
  CheckCircle2,
  Star,
  Sparkles,
  Calendar,
  Bell,
  Upload,
  BarChart3,
  Home,
  Stethoscope,
  BookOpen,
  AlertTriangle,
  Building2,
  Zap,
  Target,
  Globe,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/70 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link
            to="/"
            className="flex items-center gap-2 group"
          >
            <div className="relative">
              <Heart className="h-8 w-8 text-primary fill-primary transition-transform group-hover:scale-110" />
              <Sparkles className="h-3 w-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AfyaLink
            </h1>
          </Link>
          <div className="flex gap-3">
            <Button
              asChild
              variant="ghost"
              className="hidden sm:flex"
            >
              <Link to="/login">Login</Link>
            </Button>
            <Button
              asChild
              className="shadow-md hover:shadow-lg transition-shadow"
            >
              <Link
                to="/register"
                className="flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10" />

        <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Left: Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              <Star className="h-4 w-4 fill-primary" />
              Transforming NGO Case Management in Rwanda
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              Manage & Track Vulnerable
              <span className="block bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                Children & Families
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Digital platform designed to help NGOs efficiently
              manage and follow up vulnerable children, youth,
              and families. Replace paper files, WhatsApp
              groups, and notebooks with a secure, centralized
              case management system.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
              <Button
                asChild
                size="lg"
                className="text-lg px-8 h-12 shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <Link
                  to="/register"
                  className="flex items-center gap-2"
                >
                  Start Managing Cases
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-lg px-8 h-12 border-2 hover:bg-accent transition-all"
              >
                <Link to="/login">Sign In to Dashboard</Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-secondary" />
                <span>Secure & Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-secondary" />
                <span>Cloud-Based</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-secondary" />
                <span>Real-time Updates</span>
              </div>
            </div>
          </div>
          {/* Right: Hero Image */}
          <div className="relative hidden lg:block">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-500">
              <img
                src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop"
                alt="Vulnerable children and families in Rwanda being supported"
                className="w-full h-full object-cover rounded-3xl aspect-[4/5]"
                style={{ minHeight: "500px" }}
                onError={(e) => {
                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1497486751825-1233686d5d80?q=80&w=2069&auto=format&fit=crop";
                }}
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-3xl"></div>
              {/* Floating cards overlay */}
              <div className="absolute bottom-6 left-6 right-6 grid grid-cols-2 gap-3">
                <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0 transform hover:scale-105 transition-transform">
                  <CardContent className="p-3 text-center">
                    <Users className="h-6 w-6 text-primary mx-auto mb-1" />
                    <p className="text-xs font-semibold text-gray-700">
                      Beneficiaries
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0 transform hover:scale-105 transition-transform">
                  <CardContent className="p-3 text-center">
                    <FileText className="h-6 w-6 text-secondary mx-auto mb-1" />
                    <p className="text-xs font-semibold text-gray-700">
                      Cases
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0 transform hover:scale-105 transition-transform">
                  <CardContent className="p-3 text-center">
                    <Calendar className="h-6 w-6 text-primary mx-auto mb-1" />
                    <p className="text-xs font-semibold text-gray-700">
                      Visits
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0 transform hover:scale-105 transition-transform">
                  <CardContent className="p-3 text-center">
                    <BarChart3 className="h-6 w-6 text-secondary mx-auto mb-1" />
                    <p className="text-xs font-semibold text-gray-700">
                      Reports
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white/50">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-sm font-medium mb-4">
            <AlertTriangle className="h-4 w-4" />
            The Problem We Solve
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Outdated Systems Lead to Lost Information
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Most organizations supporting vulnerable children
            still depend on paper files, WhatsApp groups, verbal
            updates, and notebooks.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-2 border-red-100 bg-red-50/30">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Lost Information
              </h3>
              <p className="text-sm text-gray-600">
                Critical case notes get misplaced or mixed in
                papers
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100 bg-orange-50/30">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Unorganized Follow-up
              </h3>
              <p className="text-sm text-gray-600">
                Difficult to track which beneficiaries need
                attention
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-yellow-100 bg-yellow-50/30">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Delayed Support
              </h3>
              <p className="text-sm text-gray-600">
                No alerts when a child needs urgent support
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-100 bg-amber-50/30">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Poor Team Coordination
              </h3>
              <p className="text-sm text-gray-600">
                Information only accessible to one person with a
                notebook
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Services Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-b from-white to-sky-50/30">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            <Target className="h-4 w-4" />
            What AfyaLink Does
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Comprehensive Case Management
            <span className="block text-primary mt-2">
              Services
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Everything NGOs need to efficiently manage
            vulnerable children, youth, and families
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Service 1: Register Beneficiaries */}
          <Card className="group border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white">
            <CardContent className="p-6">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">
                Register Beneficiaries
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Register children with HIV, teen mothers, youth
                at risk, children with disabilities, and
                vulnerable families
              </p>
            </CardContent>
          </Card>

          {/* Service 2: Record & Track Cases */}
          <Card className="group border-2 hover:border-secondary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white">
            <CardContent className="p-6">
              <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                <FileText className="h-7 w-7 text-secondary" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">
                Record & Track Cases
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Track health updates, counselling records,
                school monitoring, psychosocial support, and
                economic support
              </p>
            </CardContent>
          </Card>

          {/* Service 3: Manage Home Visits */}
          <Card className="group border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white">
            <CardContent className="p-6">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Home className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">
                Manage Home Visits
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Record dates, notes, recommendations, and
                follow-up actions for each visit
              </p>
            </CardContent>
          </Card>

          {/* Service 4: Schedule Appointments */}
          <Card className="group border-2 hover:border-secondary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white">
            <CardContent className="p-6">
              <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                <Calendar className="h-7 w-7 text-secondary" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">
                Schedule Appointments
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Schedule clinical visits, counselling sessions,
                parent meetings, and support group activities
              </p>
            </CardContent>
          </Card>

          {/* Service 5: Set Reminders */}
          <Card className="group border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white">
            <CardContent className="p-6">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Bell className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">
                Set Reminders
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Medication reminders (ARVs), follow-up visits,
                and upcoming deadlines
              </p>
            </CardContent>
          </Card>

          {/* Service 6: Upload Documents */}
          <Card className="group border-2 hover:border-secondary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white">
            <CardContent className="p-6">
              <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                <Upload className="h-7 w-7 text-secondary" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">
                Upload Documents
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Store medical forms, vulnerability assessments,
                consent forms, and case assessments securely
              </p>
            </CardContent>
          </Card>

          {/* Service 7: Generate Reports */}
          <Card className="group border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white">
            <CardContent className="p-6">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <BarChart3 className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">
                Generate Reports
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Create reports on beneficiary progress, case
                categories, follow-up frequency, and vulnerable
                groups coverage
              </p>
            </CardContent>
          </Card>

          {/* Service 8: Secure Storage */}
          <Card className="group border-2 hover:border-secondary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white">
            <CardContent className="p-6">
              <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                <Shield className="h-7 w-7 text-secondary" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">
                Secure Storage
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Nothing gets lost, misplaced, or mixed in papers
                and WhatsApp messages
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-medium mb-4">
            <Zap className="h-4 w-4" />
            Benefits for NGOs
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            How AfyaLink Helps Your Organization
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Transform your case management workflow and improve
            support delivery
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-primary/30 transition-all bg-gradient-to-br from-white to-blue-50/20">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                Better Organization
              </h3>
              <p className="text-gray-600 leading-relaxed">
                All cases in one place, no lost files.
                Centralized system for all beneficiary
                information.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-secondary/30 transition-all bg-gradient-to-br from-white to-green-50/20">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                Faster Response
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Social workers can quickly see which
                beneficiaries need urgent follow-up with
                automated alerts.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/30 transition-all bg-gradient-to-br from-white to-blue-50/20">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                Improved Teamwork
              </h3>
              <p className="text-gray-600 leading-relaxed">
                All staff can access updated information, not
                only one person who has a notebook.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-secondary/30 transition-all bg-gradient-to-br from-white to-green-50/20">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                Stronger Evidence for Donors
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Generate clear reports for funding and
                accountability with comprehensive analytics.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/30 transition-all bg-gradient-to-br from-white to-blue-50/20">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                Safer Storage
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Sensitive information is protected, unlike
                WhatsApp chats and paper files.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-secondary/30 transition-all bg-gradient-to-br from-white to-green-50/20">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6">
                <Target className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                Accurate Progress Tracking
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Easily see improvements, challenges, or risk
                factors for each beneficiary.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Use Case: Mwana Ukundwa - About Section with Image */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Image */}
          <div className="relative order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-500">
              <img
                src="https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=2070&auto=format&fit=crop"
                alt="Mwana Ukundwa supporting vulnerable children and families in Rwanda"
                className="w-full h-full object-cover rounded-2xl aspect-[4/3]"
                style={{ minHeight: "400px" }}
                onError={(e) => {
                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop";
                }}
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent rounded-2xl"></div>
              {/* Decorative badge */}
              <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg z-20 transform hover:scale-110 transition-transform">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary fill-primary" />
                  <span className="font-semibold text-gray-900">
                    Since 2024
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="order-1 lg:order-2">
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-primary via-primary to-secondary text-white overflow-hidden relative">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)",
                }}
              ></div>
              <CardContent className="p-12 sm:p-16 relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <Heart className="h-8 w-8 fill-white" />
                  <h2 className="text-4xl sm:text-5xl font-bold">
                    Mwana Ukundwa Use Case
                  </h2>
                </div>
                <div className="grid md:grid-cols-1 gap-6 mb-8">
                  <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Who They Support
                    </h3>
                    <ul className="space-y-2 text-base opacity-95">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        HIV-positive children
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Teen mothers
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Children with disabilities
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Youth at risk
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Stethoscope className="h-5 w-5" />
                      With AfyaLink, They Can
                    </h3>
                    <ul className="space-y-2 text-base opacity-95">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Track ARV medication adherence
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Record counselling sessions
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Monitor school attendance
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Document home visits
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <p className="text-base opacity-95">
                    <strong>Current Challenge:</strong> Mwana
                    Ukundwa relies on WhatsApp groups, files in
                    cabinets, verbal updates, books and papers.
                    With AfyaLink, they can avoid losing
                    critical case notes during staff changes and
                    make their work easier, faster, and more
                    professional.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Ready to Transform Your Case Management?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join NGOs across Rwanda in revolutionizing how we
              care for vulnerable communities. Get started today
              and replace paper files with a digital solution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="text-lg px-8 h-12 shadow-lg"
              >
                <Link
                  to="/register"
                  className="flex items-center gap-2"
                >
                  Create Your Account
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-lg px-8 h-12 border-2"
              >
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Modern Footer */}
      <footer className="border-t bg-gradient-to-b from-gray-900 to-gray-800 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Brand Column */}
            <div className="lg:col-span-1">
              <Link
                to="/"
                className="flex items-center gap-2 mb-4"
              >
                <Heart className="h-8 w-8 text-primary fill-primary" />
                <span className="text-2xl font-bold">
                  AfyaLink
                </span>
              </Link>
              <p className="text-gray-400 mb-4 leading-relaxed">
                Digital case management platform for NGOs
                supporting vulnerable children, youth, and
                families in Rwanda.
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-700 hover:bg-primary flex items-center justify-center transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-700 hover:bg-primary flex items-center justify-center transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-700 hover:bg-primary flex items-center justify-center transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-700 hover:bg-primary flex items-center justify-center transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Services Column */}
            <div>
              <h3 className="text-lg font-bold mb-4">
                Services
              </h3>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors"
                  >
                    Beneficiary Management
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors"
                  >
                    Case Tracking
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors"
                  >
                    Home Visit Management
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors"
                  >
                    Appointment Scheduling
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors"
                  >
                    Document Storage
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors"
                  >
                    Report Generation
                  </a>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h3 className="text-lg font-bold mb-4">
                Company
              </h3>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <Link
                    to="/"
                    className="hover:text-white transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="hover:text-white transition-colors"
                  >
                    Register
                  </Link>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors"
                  >
                    Benefits
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Column */}
            <div>
              <h3 className="text-lg font-bold mb-4">
                Contact
              </h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span>Mwana Ukundwa (AMU)</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Kicukiro, Rwanda</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <a
                    href="mailto:info@afyalink.org"
                    className="hover:text-white transition-colors"
                  >
                    info@afyalink.org
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <a
                    href="tel:+250"
                    className="hover:text-white transition-colors"
                  >
                    +250 XXX XXX XXX
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} AfyaLink Case
                Management Portal. All rights reserved.
              </p>
              <div className="flex gap-6 text-sm text-gray-400">
                <a
                  href="#"
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="hover:text-white transition-colors"
                >
                  Terms of Service
                </a>
                <a
                  href="#"
                  className="hover:text-white transition-colors"
                >
                  Cookie Policy
                </a>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700 text-center">
              <p className="text-gray-500 text-sm">
                Supporting vulnerable children, youth, and
                families through digital transformation
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}