# AfyaLink - Case Management Portal

A comprehensive digital case management system for Association Mwana Ukundwa (AMU) in Rwanda, supporting vulnerable children, youth, and families.

## 🏗️ Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── ui/                    # Reusable UI components
│   │   ├── DashboardLayout.tsx    # Main layout with sidebar navigation
│   │   └── figma/                 # Protected Figma components
│   ├── context/
│   │   └── AuthContext.tsx        # Authentication context provider
│   ├── pages/
│   │   ├── dashboards/
│   │   │   ├── AdminDashboard.tsx       # Admin role dashboard
│   │   │   ├── SocialWorkerDashboard.tsx # Social Worker dashboard
│   │   │   └── SupervisorDashboard.tsx   # Supervisor dashboard
│   │   ├── Landing.tsx            # Public landing page
│   │   ├── Login.tsx              # Login page
│   │   ├── Register.tsx           # Registration page
│   │   ├── Beneficiaries.tsx      # Beneficiary registry
│   │   ├── Cases.tsx              # Case management
│   │   ├── Interventions.tsx      # Intervention planning
│   │   ├── Documents.tsx          # Document storage
│   │   ├── Reports.tsx            # Reports & analytics
│   │   ├── Notifications.tsx      # Notifications & alerts
│   │   ├── Settings.tsx           # User settings
│   │   └── UserManagement.tsx     # User management (Admin only)
│   └── App.tsx                    # Main app with routing
├── styles/
│   ├── theme.css                  # Blue/green color theme
│   └── ...
```

## 🎨 Design Features

- **Color Theme**: Professional blue (#0369A1) and green (#16A34A) palette
- **Responsive Design**: Desktop-first (1440px) with mobile/tablet adaptations
- **Accessibility**: High contrast, clear typography, WCAG compliant
- **Rwanda Context**: NGO-appropriate, culturally sensitive design

## 🔐 User Roles

### 1. Administrator
- System overview and statistics
- User management
- Team performance monitoring
- System-wide reports and analytics
- Approval workflows

### 2. Social Worker
- Assigned case management
- Beneficiary tracking
- Intervention scheduling
- Follow-up reminders
- Activity reporting

### 3. Supervisor
- Team oversight
- Approval requests
- Performance monitoring
- Case review
- Summary reports

## 📊 Core Modules

1. **Beneficiary Management**: Complete registry with demographics and case histories
2. **Case Tracking**: Real-time monitoring with progress tracking
3. **Intervention Planning**: Activity scheduling and outcome documentation
4. **Document Storage**: Secure file management with categorization
5. **Reports & Analytics**: Comprehensive insights and metrics
6. **Notifications**: Automated reminders and system alerts
7. **User Management**: Role-based access control

## 🚀 Key Features

- ✅ Role-based dashboards (unique for each role)
- ✅ Responsive sidebar navigation
- ✅ Global search functionality
- ✅ Real-time case tracking
- ✅ Automated follow-up reminders
- ✅ Secure document storage
- ✅ Comprehensive analytics
- ✅ Team collaboration tools
- ✅ Mobile-friendly interface

## 🛠️ Technology Stack

- **Frontend**: React 18.3.1 with TypeScript
- **Routing**: React Router DOM 7.11.0
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS 4.1.12
- **Charts**: Recharts 2.15.2
- **Icons**: Lucide React
- **Forms**: React Hook Form

## 📱 Responsive Breakpoints

- **Desktop**: 1440px+ (primary)
- **Tablet**: 768px - 1439px
- **Mobile**: < 768px

## 🎯 Navigation Flow

```
Landing Page
    ↓
Login/Register (with role selection)
    ↓
Role-Based Dashboard
    ↓
Feature Pages (Beneficiaries, Cases, Interventions, etc.)
```

## 🔗 Route Structure

- `/` - Landing page
- `/login` - Login page
- `/register` - Registration page
- `/admin/*` - Admin routes
- `/social-worker/*` - Social Worker routes
- `/supervisor/*` - Supervisor routes

Each role has access to:
- `/dashboard` - Role-specific dashboard
- `/beneficiaries` - Beneficiary registry
- `/cases` - Case management
- `/interventions` - Intervention planning
- `/documents` - Document storage
- `/reports` - Reports & analytics
- `/notifications` - Notifications
- `/settings` - User settings
- `/users` - User management (Admin only)

## 🎨 Theme Colors

- **Primary**: #0369A1 (Blue - Trust, Healthcare)
- **Secondary**: #16A34A (Green - Growth, Community)
- **Accent**: #E0F2FE (Light Blue)
- **Success**: #22C55E
- **Warning**: #F59E0B
- **Danger**: #DC2626

## 📝 Data Security

- Role-based access control
- Protected routes
- Secure authentication flow
- Sensitive data handling
- Document encryption (ready for implementation)

## 🌍 Rwanda Context

- Phone format: +250 XXX XXX XXX
- Location-based organization (Kicukiro, Gasabo, Nyarugenge)
- Local language support ready
- Cultural sensitivity in UI/UX

## 🎓 Academic & NGO Standards

- Professional, presentation-ready interface
- Comprehensive documentation
- Real-world case scenarios
- Scalable architecture
- Production-ready code quality

## 📈 Future Enhancements

- Real backend integration
- Multi-language support (Kinyarwanda, French, English)
- Mobile app companion
- SMS notifications
- Advanced reporting
- Data export capabilities
- Offline functionality
- Integration with health systems

## 👥 Association Mwana Ukundwa (AMU)

**Location**: Kicukiro, Rwanda
**Mission**: Supporting vulnerable children, youth, and families
**Focus Areas**: Education, Health, Family Care, Youth Development

---

**Built with ❤️ for AMU by Ingabire Queen Kellen - AUCA Software Engineering**
