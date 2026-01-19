# Gym Management System

Modernize your fitness center with a scalable, secure, and user-friendly digital platform. This system eliminates paper-based receipts, automates member notifications, and provides centralized management for gym owners.

## 🚀 Technologies
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend/Database**: Firebase (Authentication, Firestore)
- **Framework**: Bootstrap 5

## ✨ Core Modules

### 🛠 Admin Module
- **Secure Login**: Role-based access control.
- **Member Management**: Add, update, and delete members.
- **Digital Billing**: Create and store digital receipts with optional image attachments.
- **Automated Notifications**: Broadcast messages and fee reminders to all members.
- **Supplement Store**: Manage inventory and pricing for gym supplements.
- **Diet Planning**: Assign personalized diet plans to specific members or general plans.
- **Reports**: Export member data to CSV for offline analysis.
- **Audit Logging**: Every administrative action is logged for transparency.

### 👤 Member Module
- **Personal Dashboard**: View membership status and profile.
- **Digital Receipts**: Access and view all past payment receipts.
- **Real-time Notifications**: Receive updates on gym timings, holidays, or fee reminders.
- **Diet Access**: View assigned diet plans and nutritional advice.
- **Store Browsing**: View available supplements and pricing.

## 🛠 Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/gym-management-system.git
   ```

2. **Configure Firebase**:
   - Create a project in [Firebase Console](https://console.firebase.google.com/).
   - Enable **Authentication** (Email/Password).
   - Create a **Firestore Database**.
   - Copy your Web App configuration and paste it into `js/firebase-config.js`.

3. **Deploy**:
   - Open `index.html` in any modern web browser or host on services like Firebase Hosting, GitHub Pages, or Netlify.

## 🔐 Default Admin Credentials
- **Email**: `admin@gmail.com`
- **Password**: `admin@gmail.com`

## 🔒 Security & Optimization
- **Role-Based Access**: Strict separation between Admin and Member views.
- **Firestore Security Rules**: Ensures data can only be accessed by authorized users.
- **Local Caching**: Navbars and user roles are cached for instant, flicker-free transitions.
- **Resilient Connections**: Forced long-polling for stable Firestore connections in varying network conditions.

## 🔮 Future Scope
- **Payment Gateway Integration**: Automate fee collection.
- **Personal Trainer Module**: Scheduling and progress tracking.
- **Nutrition Advisory**: AI-powered diet suggestions.
- **Inventory Analytics**: Track supplement sales trends.

---
*Modernizing fitness, one rep at a time.*
