'use client'
import React, { useEffect, useState } from 'react';
import { Users, Package, Truck, CreditCard, UserCog, Clock } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface NavItemProps {
  id: number;
  icon: React.ElementType;
  text: string;
  path: string;
}

const allPanels: NavItemProps[] = [
  {id: 1, icon: Users, text: "Employees", path: "/admin/employees"},
  {id: 2, icon: Users, text: "Table Reservation", path: "/admin/table-reservation"},
  {id: 3, icon: Users, text: "Users", path: "/admin/users"},
  {id: 4, icon: Package, text: "Product & Inventory", path: "/admin/product-inventory"},
  {id: 5, icon: Truck, text: "Transport Management", path: "/admin/transport-management"},
  {id: 6, icon: CreditCard, text: "Revenue", path: "/admin/revenue"},
];

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, text, path }) => {
  const pathname = usePathname();
  const isActive = pathname === path;

  return (
    <Link href={path}>
      <div className={`flex items-center p-3 rounded-lg cursor-pointer ${isActive ? 'bg-blue-100' : 'hover:bg-gray-100'}`}>
        <Icon size={20} className="mr-2" />
        <span>{text}</span>
      </div>
    </Link>
  );
};

interface RolePanelConfig {
  [role: string]: number[]; // Array of panel IDs allowed for each role
}

// Define which panels each role can access
const rolePanelConfig: RolePanelConfig = {
  "manager": [2, 4, 5, 6], // Employees, Table Reservation, Product & Inventory, Revenue
  "staff": [2, 4], // Table Reservation, Product & Inventory
  "owner": [1, 2, 3, 4, 5, 6], // All panels
  "admin": [1, 2, 3, 4, 5, 6] // All panels (fallback)
};

const LeftPanel = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [allowedPanelIds, setAllowedPanelIds] = useState<number[]>([]);
  
  useEffect(() => {
    // Get user role from localStorage
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserRole(user.role);
        
        // Set allowed panels based on user role
        if (user.role && rolePanelConfig[user.role]) {
          setAllowedPanelIds(rolePanelConfig[user.role]);
        } else {
          // Default to admin if role not found
          setAllowedPanelIds(rolePanelConfig["admin"]);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  // Filter panels based on user role
  const getPanelsForCurrentRole = () => {
    return allPanels.filter(panel => allowedPanelIds.includes(panel.id));
  };

  return (
    <div className="w-64 bg-white shadow-lg p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        {userRole && (
          <p className="text-sm text-gray-500 mt-1">
            Role: {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
          </p>
        )}
      </div>
      <nav className="space-y-2">
        {getPanelsForCurrentRole().map((panel) => (
          <NavItem 
            key={panel.id}
            id={panel.id}
            icon={panel.icon} 
            text={panel.text} 
            path={panel.path} 
          />
        ))}
      </nav>
    </div>
  );
};

export default LeftPanel;