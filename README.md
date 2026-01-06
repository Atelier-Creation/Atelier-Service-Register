# 🎨 Digital Service Register

A modern, premium web application for managing service jobs, customer records, and business operations. Built with **Vite**, **React**, **JavaScript**, and **Tailwind CSS**.

![Digital Service Register](https://img.shields.io/badge/Status-Production%20Ready-success)
![React](https://img.shields.io/badge/React-18.3-blue)
![Vite](https://img.shields.io/badge/Vite-7.3-purple)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-cyan)

## ✨ Features

### 🧾 1. Job / Service Entry
- **Quick 1-minute entry** instead of manual book-keeping
- Comprehensive form with all essential fields:
  - Customer Name
  - Phone Number
  - Device / Product
  - Issue Description
  - Received Date
  - Estimated Delivery Date
  - Technician Assigned
  - Advance Amount
  - Total Amount
- Real-time balance calculation
- Edit and delete functionality

### 🔍 2. Smart Search
- **Multi-criteria search** capabilities:
  - Search by phone number
  - Search by customer name
  - Search by job ID
  - Search all fields
- Instant results with detailed job information
- No more flipping through pages!

### 🔄 3. Status Tracking
- **One-click status updates** with visual indicators:
  - 🔵 Received
  - 🟡 In Progress
  - 🟠 Waiting for Parts
  - 🟢 Ready
  - 🟣 Delivered
- Status filtering for easy job management
- Visual progress indicators

### 📲 4. Customer Notification (Ready for Integration)
- **Notification settings** for:
  - WhatsApp notifications
  - SMS alerts
  - Email updates
- Trigger points:
  - Job is ready
  - Delay occurs
  - Delivered
- Reduces incoming customer calls 📞

### 💰 5. Billing & Payments
- **Complete payment tracking**:
  - Total amount
  - Advance paid
  - Balance pending
  - Payment history per customer
- No confusion, no disputes!

### 📊 6. Dashboard (Owner View)
- **Business clarity at a glance**:
  - Today's jobs count
  - Pending jobs overview
  - Ready for delivery count
  - Total earnings (day/month)
  - Pending payments alert
  - Status distribution chart
  - Recent jobs list

### 👥 7. User Roles
- **Admin** – Full access:
  - Create, edit, delete jobs
  - Manage customers
  - Access all settings
  - View complete dashboard
- **Technician** – Limited access:
  - View jobs
  - Update job status only
  - No delete permissions

### 🎨 8. Premium UI/UX
- **Modern glassmorphism design**
- **Gradient backgrounds** with smooth animations
- **Responsive layout** for all devices
- **Micro-interactions** for enhanced UX
- **Custom scrollbars** and hover effects
- **Status badges** with color coding

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm installed
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   cd "d:/Atelaier/Digital Service Register/frontend"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

### Demo Credentials
- **Username:** `admin`
- **Password:** `admin`
- **Role:** Admin or Technician

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── Layout.jsx          # Main layout with sidebar & navbar
│   ├── context/
│   │   ├── AuthContext.jsx     # Authentication state management
│   │   └── JobContext.jsx      # Job & customer data management
│   ├── pages/
│   │   ├── Login.jsx           # Login page with role selection
│   │   ├── Dashboard.jsx       # Main dashboard with stats
│   │   ├── Jobs.jsx            # Job management & entry form
│   │   ├── Search.jsx          # Smart search functionality
│   │   ├── Customers.jsx       # Customer management
│   │   └── Settings.jsx        # Application settings
│   ├── App.jsx                 # Main app with routing
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles & design system
├── package.json
├── vite.config.js
└── README.md
```

## 🎯 Key Technologies

- **Vite** - Lightning-fast build tool
- **React 18** - UI library with hooks
- **React Router DOM** - Client-side routing
- **Tailwind CSS 4.0** - Utility-first CSS framework
- **React Icons** - Beautiful icon library
- **LocalStorage** - Client-side data persistence

## 💾 Data Storage

Currently uses **browser localStorage** for data persistence:
- Jobs data
- Customer records
- User authentication state

### Future Enhancements
- Backend API integration (Node.js/Express)
- Database (MongoDB/PostgreSQL)
- Real-time notifications (WebSocket)
- WhatsApp/SMS integration
- PDF invoice generation
- Data export (Excel/CSV)

## 🎨 Design System

### Color Palette
- **Primary Gradient:** Purple (#667eea) to Indigo (#764ba2)
- **Success:** Green (#11998e) to Emerald (#38ef7d)
- **Warning:** Pink (#f093fb) to Red (#f5576c)
- **Info:** Blue (#4facfe) to Cyan (#00f2fe)

### Typography
- **Font Family:** Inter (Google Fonts)
- **Weights:** 300, 400, 500, 600, 700, 800

### Effects
- **Glassmorphism:** `backdrop-filter: blur(10px)`
- **Shadows:** Multi-layered for depth
- **Animations:** Fade-in, slide-in, hover transforms

## 📱 Responsive Design

- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

Sidebar collapses to hamburger menu on mobile devices.

## 🔐 Security Features

- Role-based access control (RBAC)
- Protected routes
- Session management
- Password visibility toggle
- Logout functionality

## 🛠️ Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📈 Future Roadmap

- [ ] Backend API development
- [ ] Database integration
- [ ] WhatsApp Business API integration
- [ ] SMS gateway integration
- [ ] Email notifications
- [ ] PDF invoice generation
- [ ] Multi-language support
- [ ] Dark/Light theme toggle
- [ ] Advanced analytics
- [ ] Mobile app (React Native)

## 🤝 Contributing

This is a proprietary project. For feature requests or bug reports, please contact the development team.

## 📄 License

Copyright © 2026 Digital Service Register. All rights reserved.

## 👨‍💻 Developer

Built with ❤️ using modern web technologies.

---

**Version:** 1.0.0  
**Last Updated:** January 2026
