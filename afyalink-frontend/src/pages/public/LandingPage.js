import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes/routeConstants';
import {
  HiOutlineUsers,
  HiOutlineDocumentText,
  HiOutlineChartBar,
  HiOutlineShieldCheck,
  HiOutlineCalendar,
  HiOutlineBell,
  HiOutlineUpload,
  HiOutlineHome,
  HiOutlineHeart,
  HiOutlineCheckCircle,
  HiOutlineStar,
  HiOutlineLightningBolt,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiArrowRight,
  HiOutlineExclamation,
  HiOutlineClock,
  HiOutlineOfficeBuilding,
  HiOutlineEye,
  HiChevronLeft,
  HiChevronRight,
  HiMenu,
  HiX,
} from 'react-icons/hi';
import { 
  FaFacebook, 
  FaTwitter, 
  FaInstagram, 
  FaLinkedin, 
  FaWhatsapp,
  FaUserMd,
  FaHandHoldingHeart,
  FaGraduationCap,
} from 'react-icons/fa';

import planInternationalLogo from '../../assets/images/plan-international-logo.png';
import worldVisionLogo from '../../assets/images/world-vision-logo.png';
import testimonialImg1 from '../../assets/images/testimonial-1.png';
import testimonialImg2 from '../../assets/images/testimonial-2.png';
import testimonialImg3 from '../../assets/images/testimonial-3.png';
import testimonialImg4 from '../../assets/images/testimonial-4.png';
import testimonialImg5 from '../../assets/images/testimonial-5.png';
import testimonialImg6 from '../../assets/images/testimonial-6.png';

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');

  const heroSlides = [
    {
      image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop',
      title: 'Empowering Vulnerable Children',
      subtitle: 'Digital case management for NGOs supporting children, youth, and families across Rwanda',
    },
    {
      image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop',
      title: 'Supporting Families in Need',
      subtitle: 'Track, manage, and coordinate care for vulnerable communities with confidence',
    },
    {
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2032&auto=format&fit=crop',
      title: 'Building Stronger Communities',
      subtitle: 'Comprehensive tools for HIV/AIDS support, education, and child protection',
    },
    {
      image: 'https://images.unsplash.com/photo-1497486751825-1233686d5d80?q=80&w=2069&auto=format&fit=crop',
      title: 'Professional Case Management',
      subtitle: 'Replace paper files and WhatsApp with secure, centralized digital platform',
    },
  ];

  const testimonials = [
    { image: testimonialImg1, quote: "AfyaLink transformed how we manage our 200+ beneficiaries. We no longer lose track of follow-ups and can generate donor reports in minutes.", name: "Marie Uwase", role: "Program Manager", org: "Hope for Children Rwanda" },
    { image: testimonialImg2, quote: "Before AfyaLink, our case files were scattered. Now everything is organized, secure, and accessible to our entire team.", name: "Jean Bosco Niyonzima", role: "Social Worker", org: "Youth Empowerment Initiative" },
    { image: testimonialImg3, quote: "The reminder system ensures we never miss critical medication dates for our HIV+ children. It's literally saving lives.", name: "Dr. Claudine Mukamana", role: "Medical Coordinator", org: "Pediatric AIDS Support" },
    { image: testimonialImg4, quote: "Home visit scheduling used to be chaos. AfyaLink gives us one clear calendar and automatic reminders for our field staff.", name: "Grace Murekatete", role: "Field Coordinator", org: "Child Protection Rwanda" },
    { image: testimonialImg5, quote: "Donor reporting used to take days. Now we pull accurate numbers and stories in minutes. AfyaLink is a game-changer.", name: "Eric Habimana", role: "M&E Officer", org: "Family Health Initiative" },
    { image: testimonialImg6, quote: "We finally have a single source of truth for every child we support. Confidentiality and ease of use are top-notch.", name: "Clarisse Uwera", role: "Case Manager", org: "Rwanda Children's Hope" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  const nextTestimonial = () => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  const prevTestimonial = () => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    alert(`Thank you for subscribing with ${email}!`);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/80 via-white to-sky-50/50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <HiOutlineHeart className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900">AfyaLink</span>
                <p className="text-xs text-gray-500">Case Management Portal</p>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-8">
              <a href="#services" className="text-gray-700 hover:text-primary font-medium transition-colors">Services</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-primary font-medium transition-colors">How It Works</a>
              <a href="#impact" className="text-gray-700 hover:text-primary font-medium transition-colors">Our Impact</a>
              <a href="#partners" className="text-gray-700 hover:text-primary font-medium transition-colors">Partners</a>
              <a href="#contact" className="text-gray-700 hover:text-primary font-medium transition-colors">Contact</a>
              <Link to="/login" className="text-primary hover:text-primary-700 font-medium transition-colors">Sign In</Link>
            </div>

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col gap-3">
                <a href="#services" className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">Services</a>
                <a href="#how-it-works" className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">How It Works</a>
                <a href="#impact" className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">Our Impact</a>
                <a href="#partners" className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">Partners</a>
                <a href="#contact" className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">Contact</a>
                <Link to="/login" className="px-4 py-2 text-primary font-medium hover:bg-primary-50 rounded-lg transition-colors">Sign In</Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero with Slider */}
      <section className="relative h-screen mt-20 overflow-hidden">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          </div>
        ))}

        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <div className="max-w-3xl text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
              <HiOutlineStar className="w-4 h-4" />
              Trusted by NGOs Across Rwanda
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
              {heroSlides[currentSlide].title}
            </h1>
            <p className="text-xl sm:text-2xl mb-8 leading-relaxed text-white/90">
              {heroSlides[currentSlide].subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-12 justify-center sm:justify-start">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white text-lg font-semibold rounded-xl hover:bg-white/10 backdrop-blur-sm transition-all"
              >
                Sign In to Dashboard
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {[
                { number: '5,000+', label: 'Beneficiaries' },
                { number: '150+', label: 'NGO Partners' },
                { number: '10,000+', label: 'Cases Managed' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold mb-1">{stat.number}</div>
                  <div className="text-sm text-white/80">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
        >
          <HiChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
        >
          <HiChevronRight className="w-6 h-6" />
        </button>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide ? 'bg-white w-8' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Trusted By */}
      <section className="relative py-14 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-white to-slate-50" />
        <div className="absolute inset-0 border-y border-gray-100/80" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 font-semibold mb-8 text-sm uppercase tracking-wider">Trusted by leading organizations</p>
          <div className="flex flex-wrap justify-center items-center gap-10 sm:gap-12 opacity-80">
            {['Ministry of Health', 'UNICEF', 'WHO', 'Save the Children', 'Plan International'].map((org) => (
              <div key={org} className="px-4 py-2 rounded-xl bg-white/80 border border-gray-100 shadow-sm text-gray-700 font-semibold text-base">
                {org}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section - The Challenge */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/40 via-white to-orange-50/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(220,38,38,0.06),transparent)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-full text-sm font-semibold mb-5 shadow-sm border border-red-200/60">
              <HiOutlineExclamation className="w-4 h-4" />
              The Challenge
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Why Traditional Systems Are Failing
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Most organizations supporting vulnerable children still depend on outdated paper files, WhatsApp groups, and manual notebooks.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: HiOutlineDocumentText, title: 'Lost Information', desc: 'Critical case notes get misplaced or lost in piles of paper files', stat: '40%' },
              { icon: HiOutlineClock, title: 'Delayed Follow-ups', desc: 'No system to track which beneficiaries need urgent attention', stat: '60%' },
              { icon: HiOutlineExclamation, title: 'Missed Emergencies', desc: 'No alerts when a child needs immediate intervention or support', stat: '35%' },
              { icon: HiOutlineUsers, title: 'Poor Coordination', desc: 'Information locked in one person\'s notebook, inaccessible to team', stat: '70%' },
            ].map((item) => (
              <div key={item.title} className="group relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-gray-100/80 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-red-100/40 hover:-translate-y-1 hover:border-red-200/60 transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-200/50 mb-4 group-hover:scale-105 transition-transform">
                    <item.icon className="w-8 h-8" />
                  </div>
                  <div className="text-3xl font-bold text-red-600 mb-2">{item.stat}</div>
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50/50 via-white to-emerald-50/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_100%,rgba(3,105,161,0.06),transparent)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-5 shadow-sm border border-primary/10">
              <HiOutlineLightningBolt className="w-4 h-4" />
              Simple Process
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
              How AfyaLink Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Get started in minutes with our intuitive platform designed for social workers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              { step: '01', icon: HiOutlineUsers, title: 'Register Your Organization', desc: 'Create your account and set up your team in under 5 minutes' },
              { step: '02', icon: HiOutlineDocumentText, title: 'Add Beneficiaries', desc: 'Register children, youth, and families with their case information' },
              { step: '03', icon: HiOutlineCalendar, title: 'Track & Manage', desc: 'Record visits, schedule appointments, set reminders, upload documents' },
              { step: '04', icon: HiOutlineChartBar, title: 'Generate Reports', desc: 'Create detailed reports for donors, government, and stakeholders' },
            ].map((item, index) => (
              <div key={item.step} className="relative">
                {index < 3 && (
                  <div className="hidden lg:block absolute top-20 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r from-primary/30 to-transparent -z-10" />
                )}
                <div className="group relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-100/80 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/20 transition-all duration-300 overflow-hidden h-full">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/25 mb-4 group-hover:scale-105 transition-transform">
                      <item.icon className="w-8 h-8 sm:w-10 sm:h-10" />
                    </div>
                    <div className="text-4xl font-bold text-primary/20 mb-2">{item.step}</div>
                    <h3 className="text-lg sm:text-xl font-bold mb-3 text-gray-900 group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services - Modern UI */}
      <section id="services" className="relative py-24 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-sky-50/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(3,105,161,0.08),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-emerald-50/30 to-transparent pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-5 shadow-sm border border-primary/10">
              <HiOutlineEye className="w-4 h-4" />
              Our Services
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
              Comprehensive Case Management
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Everything you need to manage vulnerable children and families in one platform
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              { icon: HiOutlineUsers, title: 'Beneficiary Registration', desc: 'Register children with HIV/AIDS, teen mothers, youth at risk, children with disabilities' },
              { icon: HiOutlineDocumentText, title: 'Case Documentation', desc: 'Track health updates, counseling records, school monitoring, psychosocial support' },
              { icon: HiOutlineHome, title: 'Home Visit Management', desc: 'Record visit dates, observation notes, family assessments, recommendations' },
              { icon: HiOutlineCalendar, title: 'Appointment Scheduling', desc: 'Schedule clinical visits, counseling sessions, parent meetings, case reviews' },
              { icon: HiOutlineBell, title: 'Smart Reminders', desc: 'Medication reminders (ARVs), follow-up visits, appointment alerts, task management' },
              { icon: HiOutlineUpload, title: 'Document Storage', desc: 'Store medical forms, assessments, consent forms, photos, reports securely' },
              { icon: HiOutlineChartBar, title: 'Report Generation', desc: 'Generate detailed reports on beneficiary progress, outcomes, and donor impact' },
              { icon: HiOutlineShieldCheck, title: 'Secure & Compliant', desc: 'Bank-level encryption, role-based access, audit trails, and data backup' },
            ].map((item) => (
              <div
                key={item.title}
                className="group relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-gray-100/80 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/20 transition-all duration-300 overflow-hidden"
              >
                {/* Card accent line on hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:from-primary/10 group-hover:to-secondary/10 transition-colors duration-300" />
                <div className="relative">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-5 shadow-lg shadow-primary/25 group-hover:shadow-primary/30 group-hover:scale-105 transition-all duration-300">
                    <item.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section id="impact" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-secondary" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(255,255,255,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-60" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight drop-shadow-sm">
              Our Impact in Numbers
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Transforming lives across Rwanda through better case management
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              { icon: HiOutlineUsers, number: '5,280+', label: 'Children Supported', desc: 'Active beneficiaries' },
              { icon: FaUserMd, number: '850+', label: 'Health Interventions', desc: 'Medical checkups' },
              { icon: FaGraduationCap, number: '1,200+', label: 'Education Support', desc: 'Enrolled in school' },
              { icon: FaHandHoldingHeart, number: '3,400+', label: 'Home Visits', desc: 'Family assessments' },
            ].map((item) => (
              <div key={item.label} className="group text-center bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl p-8 border border-white/20 hover:bg-white/20 hover:border-white/30 shadow-xl shadow-black/10 transition-all duration-300 hover:-translate-y-1">
                <item.icon className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-4 text-white/90" />
                <div className="text-4xl sm:text-5xl font-bold text-white mb-2 drop-shadow-sm">{item.number}</div>
                <div className="text-lg sm:text-xl font-semibold text-white mb-1">{item.label}</div>
                <p className="text-sm text-white/80">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits - Why Choose AfyaLink */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-sky-50/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_0%,rgba(3,105,161,0.06),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-emerald-50/20 to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-semibold mb-5 shadow-sm border border-secondary/20">
              <HiOutlineCheckCircle className="w-4 h-4" />
              Why AfyaLink
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
              Why Choose AfyaLink?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Powerful features designed for NGOs working with vulnerable populations
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              { icon: HiOutlineOfficeBuilding, title: 'Better Organization', desc: 'All beneficiary information, case notes, and documents in one centralized platform' },
              { icon: HiOutlineLightningBolt, title: 'Faster Response', desc: 'Real-time alerts show which beneficiaries need urgent follow-up or interventions' },
              { icon: HiOutlineUsers, title: 'Improved Teamwork', desc: 'All team members can access updated case information instantly for seamless coordination' },
              { icon: HiOutlineChartBar, title: 'Stronger Evidence', desc: 'Generate detailed reports for donors, government agencies, and stakeholders' },
              { icon: HiOutlineShieldCheck, title: 'Safer Storage', desc: 'Bank-level encryption protects sensitive beneficiary information with role-based access' },
              { icon: HiOutlineEye, title: 'Progress Tracking', desc: 'Visual dashboards show improvements or risk factors to measure interventions easily' },
            ].map((item) => (
              <div
                key={item.title}
                className="group relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-100/80 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/20 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:from-primary/10 group-hover:to-secondary/10 transition-colors duration-300" />
                <div className="relative">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-5 shadow-lg shadow-primary/25 group-hover:shadow-primary/30 group-hover:scale-105 transition-all duration-300">
                    <item.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - sliding carousel */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50/30 via-white to-slate-50/50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(3,105,161,0.05),transparent)]" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-5 shadow-sm border border-primary/10">
              <HiOutlineStar className="w-4 h-4" />
              Testimonials
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">What Our Partners Say</h2>
            <p className="text-lg text-gray-600">Hear from NGOs using AfyaLink every day</p>
          </div>

          <div className="relative">
            <div className="relative bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100/80 overflow-hidden min-h-[320px] sm:min-h-[280px]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />
              {testimonials.map((t, index) => (
                <div
                  key={t.name}
                  className={`absolute inset-0 transition-all duration-500 ease-out ${
                    index === currentTestimonial
                      ? 'opacity-100 translate-x-0 pointer-events-auto'
                      : index < currentTestimonial
                        ? 'opacity-0 -translate-x-full pointer-events-none'
                        : 'opacity-0 translate-x-full pointer-events-none'
                  }`}
                >
                  <div className="flex flex-col md:flex-row gap-8 p-8 lg:p-10 items-center">
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden ring-4 ring-primary/10 shadow-lg">
                        <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex gap-1 justify-center md:justify-start mb-4">
                        {[...Array(5)].map((_, i) => (
                          <HiOutlineStar key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                      <p className="text-gray-700 text-lg sm:text-xl leading-relaxed mb-6">"{t.quote}"</p>
                      <div>
                        <div className="font-bold text-gray-900 text-lg">{t.name}</div>
                        <div className="text-primary font-medium">{t.role}</div>
                        <div className="text-sm text-gray-500">{t.org}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Prev / Next buttons */}
            <button
              type="button"
              onClick={prevTestimonial}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 z-10 w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:text-primary hover:border-primary/50 transition-all hover:scale-110"
              aria-label="Previous testimonial"
            >
              <HiChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={nextTestimonial}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 z-10 w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:text-primary hover:border-primary/50 transition-all hover:scale-110"
              aria-label="Next testimonial"
            >
              <HiChevronRight className="w-6 h-6" />
            </button>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentTestimonial(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    index === currentTestimonial ? 'w-8 bg-primary' : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partners - Sliding carousel + Government cards */}
      <section id="partners" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-sky-50/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(3,105,161,0.06),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-emerald-50/20 to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-5 shadow-sm border border-primary/10">
              <HiOutlineCheckCircle className="w-4 h-4" />
              Our Partners
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
              Working Together for Impact
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Collaborating with leading organizations to support vulnerable children and families
            </p>
          </div>

          {/* Sliding partner logos carousel */}
          <div className="relative mb-16">
            <div className="overflow-hidden py-4">
              {/* Fade edges - left */}
              <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-32 bg-gradient-to-r from-slate-50/95 via-slate-50/50 to-transparent z-10 pointer-events-none" />
              {/* Fade edges - right */}
              <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-32 bg-gradient-to-l from-sky-50/95 via-sky-50/50 to-transparent z-10 pointer-events-none" />
              <div className="partner-track">
                {[...Array(2)].map((_, setIndex) =>
                  [
                    { name: 'UNICEF', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/57/UNICEF_Logo.png', url: 'https://www.unicef.org' },
                    { name: 'WHO', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/WHO_logo.svg', url: 'https://www.who.int' },
                    { name: 'Save the Children', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Logo_SavetheChildren.png', url: 'https://www.savethechildren.net' },
                    { name: 'Plan International', logo: planInternationalLogo, url: 'https://plan-international.org' },
                    { name: 'World Vision', logo: worldVisionLogo, url: 'https://www.wvi.org' },
                  ].map((partner) => (
                    <a
                      key={`${partner.name}-${setIndex}`}
                      href={partner.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex-shrink-0 w-[200px] sm:w-[240px] mx-3 sm:mx-4 bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex items-center justify-center min-h-[120px] sm:min-h-[140px] border border-gray-100/80 shadow-lg shadow-gray-200/40 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <div className="relative w-full h-14 sm:h-16 flex items-center justify-center">
                        <img
                          src={partner.logo}
                          alt={`${partner.name} logo`}
                          className="max-h-12 sm:max-h-14 w-full object-contain object-center opacity-75 group-hover:opacity-100 transition-opacity"
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling?.classList.remove('hidden');
                          }}
                        />
                        <span className="hidden text-base font-bold text-gray-500 group-hover:text-gray-700 text-center">{partner.name}</span>
                      </div>
                    </a>
                  ))
                )}
              </div>
            </div>
            <p className="text-center text-sm text-gray-500 mt-4">Scrolls automatically • Hover to pause</p>
          </div>

          {/* Government Collaboration - modern cards */}
          <div className="relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-8 lg:p-10 border border-gray-200/80 shadow-xl shadow-gray-200/50">
              <div className="text-center mb-8">
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">Government Collaboration</h3>
                <p className="text-gray-600 mt-2 text-sm sm:text-base">Strategic partnerships for health and family development</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { name: 'Ministry of Health', desc: 'HIV/AIDS & Maternal Child Health Programs', image: '/images/ministry-of-health-rwanda.png', isLogo: true },
                  { name: 'Ministry of Gender & Family', desc: 'Child Protection & Family Development', image: '/images/ministry-gender-family-rwanda.png', isLogo: true },
                  { name: 'Rwanda Biomedical Center', desc: 'Health Data Systems Integration', image: '/images/rbc-rwanda-biomedical-centre.png', isLogo: true },
                ].map((gov) => (
                  <div key={gov.name} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-lg shadow-gray-200/40 hover:shadow-xl hover:border-primary/15 transition-all duration-300 hover:-translate-y-0.5">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className={`relative overflow-hidden ${gov.isLogo ? 'h-40 bg-gray-50/80 flex items-center justify-center p-4' : 'h-32'}`}>
                      <img
                        src={gov.image}
                        alt={`${gov.name} logo`}
                        className={gov.isLogo ? 'w-full h-full object-contain object-center' : 'w-full h-full object-cover'}
                        loading="lazy"
                      />
                    </div>
                    <div className="border-t border-gray-100 p-5">
                      <h4 className="font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">{gov.name}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{gov.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-primary to-secondary p-12 lg:p-16 text-center text-white shadow-2xl shadow-primary/30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(255,255,255,0.15),transparent)]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 20V40H20\'/%3E%3C/g%3E%3C/svg%3E')]" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 drop-shadow-sm">
              Ready to Transform Your Case Management?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-white/90">
              Join over 150 NGOs across Rwanda. Start your free trial today - no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link 
                to="/login" 
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white text-lg font-bold rounded-xl hover:bg-white/10 backdrop-blur-sm transition-all"
              >
                Sign In to Dashboard
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/90">
              {[
                'Free 30-day trial',
                'No credit card',
                'Cancel anytime',
                'Training included'
              ].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <HiOutlineCheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="relative mt-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-slate-900 to-gray-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(3,105,161,0.12),transparent)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 text-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 lg:gap-12 mb-12 lg:mb-14">
            {/* Brand & Social */}
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center gap-3 mb-4 sm:mb-6 group">
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg flex-shrink-0">
                  <HiOutlineHeart className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-bold block">AfyaLink</span>
                  <p className="text-xs text-gray-400">Case Management Portal</p>
                </div>
              </Link>
              <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed max-w-sm">
                Digital platform empowering NGOs to support vulnerable children, youth, and families across Rwanda.
              </p>
              <div>
                <p className="text-sm font-semibold text-white/90 mb-2 sm:mb-3">Follow us on:</p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 hover:bg-primary rounded-lg flex items-center justify-center transition-all hover:scale-110 flex-shrink-0" aria-label="Facebook">
                    <FaFacebook className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 hover:bg-primary rounded-lg flex items-center justify-center transition-all hover:scale-110 flex-shrink-0" aria-label="Twitter">
                    <FaTwitter className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 hover:bg-primary rounded-lg flex items-center justify-center transition-all hover:scale-110 flex-shrink-0" aria-label="Instagram">
                    <FaInstagram className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 hover:bg-primary rounded-lg flex items-center justify-center transition-all hover:scale-110 flex-shrink-0" aria-label="LinkedIn">
                    <FaLinkedin className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                  <a href="https://wa.me/250788123456" target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 hover:bg-primary rounded-lg flex items-center justify-center transition-all hover:scale-110 flex-shrink-0" aria-label="WhatsApp">
                    <FaWhatsapp className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-white">Services</h3>
              <ul className="space-y-2 sm:space-y-3 text-gray-400 text-sm sm:text-base">
                {['Beneficiary Management', 'Case Tracking', 'Home Visits', 'Appointments', 'Document Storage', 'Report Generation'].map((s) => (
                  <li key={s}>
                    <a href="#services" className="hover:text-white transition-colors hover:pl-1 inline-block">
                      {s}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-white">Company</h3>
              <ul className="space-y-2 sm:space-y-3 text-gray-400 text-sm sm:text-base">
                <li><a href="#about" className="hover:text-white transition-colors hover:pl-1 inline-block">About Us</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors hover:pl-1 inline-block">How It Works</a></li>
                <li><a href="#impact" className="hover:text-white transition-colors hover:pl-1 inline-block">Our Impact</a></li>
                <li><a href="#partners" className="hover:text-white transition-colors hover:pl-1 inline-block">Partners</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors hover:pl-1 inline-block">Login</Link></li>
              </ul>
            </div>

            {/* Contact & Newsletter */}
            <div>
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-white">Contact Us</h3>
              <ul className="space-y-2 sm:space-y-3 text-gray-400 text-sm sm:text-base mb-4 sm:mb-6">
                <li className="flex items-start gap-2">
                  <HiOutlineOfficeBuilding className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Mwana Ukundwa (AMU)<br />Kicukiro, Kigali, Rwanda</span>
                </li>
                <li className="flex items-center gap-2">
                  <HiOutlineMail className="w-5 h-5 text-primary flex-shrink-0" />
                  <a href="mailto:info@afyalink.org" className="hover:text-white transition-colors break-all">
                    info@afyalink.org
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <HiOutlinePhone className="w-5 h-5 text-primary flex-shrink-0" />
                  <a href="tel:+250788123456" className="hover:text-white transition-colors">
                    +250 788 123 456
                  </a>
                </li>
              </ul>

              {/* Newsletter - card design */}
              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-white/10 to-white/5 shadow-xl shadow-black/20">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/30 flex items-center justify-center flex-shrink-0 ring-2 ring-primary/20">
                      <HiOutlineMail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base sm:text-lg text-white">Newsletter</h4>
                      <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                        Get latest news & updates
                      </p>
                    </div>
                  </div>
                  <form onSubmit={handleNewsletterSubmit} className="space-y-3 sm:space-y-0 sm:flex sm:gap-3 sm:flex-row mt-4">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      className="w-full flex-1 min-w-[200px] sm:min-w-[260px] px-4 py-3.5 sm:py-3 bg-white/10 border-2 border-primary/40 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-base sm:text-sm transition-all"
                    />
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-5 py-3.5 sm:py-3 bg-primary hover:bg-primary-700 rounded-xl transition-colors flex-shrink-0 inline-flex items-center justify-center gap-2 text-base sm:text-sm font-semibold text-white shadow-lg shadow-primary/30 hover:shadow-primary/40"
                    >
                      <HiOutlineMail className="w-5 h-5 flex-shrink-0" />
                      Subscribe
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-6 sm:pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400 text-center sm:text-left">
              <p>&copy; {new Date().getFullYear()} AfyaLink Case Management Portal. All rights reserved.</p>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                <Link to={ROUTES.PRIVACY_POLICY} className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link to={ROUTES.TERMS_OF_SERVICE} className="hover:text-white transition-colors">Terms of Service</Link>
                <Link to={ROUTES.COOKIE_POLICY} className="hover:text-white transition-colors">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}