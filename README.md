# AfyaLink Case Management Portal

## Overview

AfyaLink Case Management Portal is a secure, web-based platform designed to support social service organizations in managing beneficiaries, cases, interventions, reports, and communication workflows from a single centralized system.

The platform enables social workers, supervisors, and administrators to collaborate efficiently while maintaining accurate records, tracking service delivery, monitoring outcomes, and generating actionable reports. By digitizing case management processes, AfyaLink improves accountability, operational efficiency, and data-driven decision-making.

---

## Problem Statement

Many social service organizations continue to rely on paper records, spreadsheets, and disconnected communication channels to manage beneficiaries and cases. These approaches often result in:

* Difficulty tracking case progress.
* Delayed service delivery.
* Inconsistent record keeping.
* Limited visibility into intervention outcomes.
* Poor communication among staff members.
* Challenges in generating accurate reports.
* Risks associated with data loss and security.

Without a centralized system, organizations struggle to monitor activities effectively and make informed decisions based on reliable data.

---

## Purpose of the Project

The purpose of AfyaLink is to provide a modern digital solution that streamlines beneficiary and case management processes while improving collaboration, transparency, and service delivery.

The platform serves as a central hub where social workers can manage cases, supervisors can monitor performance, and administrators can oversee organizational operations through a secure and scalable environment.

---

## Project Objectives

| Objective | Description |
| --- | --- |
| Centralize Data Management | Store beneficiaries, cases, interventions, and reports in a single platform |
| Improve Service Delivery | Enable timely tracking and management of interventions |
| Enhance Collaboration | Support communication between social workers, supervisors, and administrators |
| Strengthen Accountability | Maintain audit logs and activity histories |
| Support Decision Making | Provide dashboards, analytics, and reporting tools |
| Ensure Data Security | Implement authentication, authorization, and secure access controls |
| Increase Operational Efficiency | Reduce manual processes and duplicate work |

---

## Target Users

### Social Workers
Field-Based Practitioners providing direct services to beneficiaries across assigned districts.
* **Needs**: Mobile access to client information, simple beneficiary registration, intervention planning, performance feedback, and photo evidence documentation.
* **Benefits**: Spend less time on administrative tasks, use mobile-responsive interface, receive push notifications, view personal performance dashboards, and attach field evidence directly to interventions.

### Supervisors
Team Leaders managing social workers in assigned districts.
* **Needs**: Real-time visibility of team activities, case assignment capability, tools to review reports, team performance metrics, and communication tools.
* **Benefits**: View workload at a glance, access case review queue, receive automatic workload recommendations, scope data to their district, generate weekly team reports, and objectively rank team members.

### Administrators
System Managers overseeing all users, configuration, and strategic reporting.
* **Needs**: Full system visibility, user account management, organization-wide performance monitoring, comprehensive reporting, and audit logging.
* **Benefits**: View system-wide KPI dashboard, create users with location-based scoping, access organization-level dashboards, configure report templates, export audit logs, and manage integration APIs.

---

## Key Features

### 1. Beneficiary Management
Register and track vulnerable populations with complete demographic and assessment information. System maintains comprehensive beneficiary profiles with contact information, location details, vulnerability assessment scores, and service history.

### 2. Case Management
Create and track cases for each beneficiary requiring long-term support. Cases progress from OPEN through IN_PROGRESS to CLOSED with real-time status updates and progress percentage tracking.

### 3. Intervention Tracking
Plan, execute, and track interventions with effectiveness scoring. Each intervention represents a specific action taken to help a beneficiary achieve case goals.

### 4. Location-Based Assignment System
Automatic validation that workers are assigned only to supervisors in their district. Includes district-level access control, automatic location filtering, and geographic coverage analytics.

### 5. Real-Time Performance Scoring
Automated weekly performance algorithm calculates scores based on case completion rate, report submission timeliness, intervention effectiveness, and compliance metrics.

### 6. Supervisor and Admin Dashboards
Role-based dashboards providing relevant KPIs and actionable insights. Includes team overviews, pending actions, system health indicators, and organization-wide metrics.

### 7. Report Generation
Automated report creation for multiple time periods and stakeholder audiences. Auto-populated data from system activities with customizable narrative sections and success story inclusion.

### 8. Messaging and Collaboration
Built-in communication system connecting workers, supervisors, and administrators. Includes direct messaging, broadcast messaging, case-level notes, and document sharing.

### 9. Notifications System
Multi-channel alerts keeping users informed of important events and deadlines. Supports instant, email, in-app, and scheduled notifications.

### 10. Audit Logging
Complete audit trail of all system actions for compliance and security. Logs who, what, when, and where with exportable formats and before/after comparisons.

### 11. Document Management
Upload, store, and organize field evidence and supporting documents. Features photo upload from field visits, file categorization, and automatic encryption.

### 12. Role-Based Access Control
Three-tier permission system ensuring users access only appropriate data and functions based on their assigned role (Social Worker, Supervisor, Administrator).

### 13. Authentication and Security
Security features include JWT token-based authentication, AES-256 encryption at rest, TLS encryption in transit, session timeouts, and optional two-factor authentication.

---

## User Workflow

### Social Worker Workflow
1. Login to the system.
2. Register or search for a beneficiary.
3. Create a new case.
4. Record case details.
5. Create interventions related to the case.
6. Upload supporting documents.
7. Update intervention progress.
8. Submit reports.
9. Receive notifications and feedback.

### Supervisor Workflow
1. Login to the system.
2. Review assigned cases.
3. Monitor intervention progress.
4. Evaluate social worker activities.
5. Review submitted reports.
6. Track organizational performance.
7. Provide feedback and guidance.

---

## Technology Stack

### Frontend
| Technology | Purpose |
| --- | --- |
| React | User Interface Development |
| TypeScript | Type Safety |
| Vite | Frontend Build Tool |
| Tailwind CSS | Styling Framework |
| React Router | Navigation and Routing |
| Recharts | Data Visualization |

### Backend
| Technology | Purpose |
| --- | --- |
| Spring Boot | Backend Framework |
| Spring Security | Authentication and Authorization |
| JWT | Secure Token Management |
| REST API | Client-Server Communication |

### Database and Infrastructure
| Technology | Purpose |
| --- | --- |
| PostgreSQL | Primary Data Storage |
| Redis | Caching and Session Management |
| Docker | Containerization |

