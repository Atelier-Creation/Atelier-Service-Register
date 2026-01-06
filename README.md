# Atelier - Digital Service Register

A comprehensive, professional Digital Service Registry application designed for repair shops and service centers. It facilitates efficient management of service orders, customer interactions, and third-party outsourcing.

## 🚀 Features

### 📋 Order Management
- **End-to-End Tracking**: manage the entire lifecycle of a service order from "Received" to "Delivered".
- **Advanced Search**: Quickly filter and find orders by ID, customer name, or device type.
- **Printable Receipts**: (Coming Soon) Generate receipts for customers.

### 🤝 Outsourcing Workflow
- **Vendor Management**: Seamlessly assign challenging repairs to 3rd-party technicians.
- **Cost Tracking**: Record estimated and actual costs for outsourced jobs.
- **Return Logic**: Dedicated "Receive Back" workflow to verify status and cost when a device returns from a vendor.
- **Vendor Analytics**: Track performance and expenditure across different 3rd-party shops.

### 📊 Analytics & Dashboard
- **Role-Based Dashboards**: Tailored views for Admins (Financials, Global Stats) and Technicians (Daily Deliveries, Recent Activity).
- **Interactive Charts**: Visual breakdown of revenue, job volume by category, and monthly trends using Recharts.
- **Outsource Stats**: Detailed leaderboard and expense reports for external vendors.

### 👤 User & Role Management
- **Admin Control**: Manage user accounts and permissions.
- **Technician Role**: Focused interface for daily operations without access to sensitive financial configuration.

## 🛠️ Tech Stack

- **Frontend**: React (Vite)
- **Styling**: Tailwind CSS, PostCSS
- **UI Components**: Custom components inspired by Shadcn/UI (Select, Modal, etc.)
- **Icons**: React Icons (Feather Icons)
- **Charts**: Recharts
- **Routing**: React Router DOM v6
- **State Management**: React Context API (`JobContext`, `AuthContext`)

## 📱 Mobile Responsible
The application features a fully responsive design, ensuring a smooth experience on desktops, tablets, and mobile devices. Key adaptations include:
- **Mobile Sidebar**: Collapsible navigation drawer.
- **Accordion Settings**: Settings pages adapt to accordion layouts on small screens for better usability.

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Atelier-Creation/Atelier-Service-Register.git
   ```

2. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🔒 Security
- Role-based route protection.
- Secure authentication context.

---
© 2024 Atelier. All rights reserved.
