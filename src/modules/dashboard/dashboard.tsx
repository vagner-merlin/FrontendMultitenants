// modules/dashboard/dashboard.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../shared/layout/Sidebar";
import "../../styles/dashboard.css";
import "../../styles/config.css";

const DashboardLayout: React.FC = () => {
  return (
    <div className="app-shell">
      <Sidebar brand="WF Finanzas" collapseOnNavigate={false} />

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
