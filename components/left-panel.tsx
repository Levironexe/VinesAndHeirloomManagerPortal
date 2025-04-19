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

// Define base paths for each panel
const panelPaths = {
  1: "/employees",
  2: "/table-reservation",
  3: "/users",
  4: "/product-inventory",
  6: "/revenue",
  7: "/table-status",
  8: "/ordered-item",
};

// Define which panels each role can access
interface RolePanelConfig {
  [role: string]: number[]; // Array of panel IDs allowed for each role
}

const rolePanelConfig: RolePanelConfig = {
  "manager": [2, 4, 6, 7, 8], // Table Reservation, Product & Inventory, Revenue, Table Status
  "staff": [2, 4, 7], // Table Reservation, Product & Inventory, Table Status
  "kitchen": [4, 8], // Product & Inventory
  "owner": [1, 2, 3, 4, 6, 7, 8], // All panels
};

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

const LeftPanel = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [allowedPanelIds, setAllowedPanelIds] = useState<number[]>([]);
  const [panels, setPanels] = useState<NavItemProps[]>([]);
  
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

  // Generate panels with role-specific paths
  useEffect(() => {
    if (userRole) {
      // Base panel definitions with icons and text
      const allPanelsDefinition = [
        {id: 1, icon: Users, text: "Employees"},
        {id: 2, icon: Users, text: "Table Reservation"},
        {id: 3, icon: Users, text: "Users"},
        {id: 4, icon: Package, text: "Product & Inventory"},
        {id: 6, icon: CreditCard, text: "Revenue"},
        {id: 7, icon: CreditCard, text: "Table Status"},
        {id: 8, icon: CreditCard, text: "Ordered Item"},

      ];
      
      // Create panels with role-specific paths
      const rolePanels = allPanelsDefinition
        .filter(panel => allowedPanelIds.includes(panel.id))
        .map(panel => ({
          ...panel,
          path: `/${userRole}${panelPaths[panel.id as keyof typeof panelPaths]}`
        }));
      
      setPanels(rolePanels);
    }
  }, [userRole, allowedPanelIds]);

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
        {panels.map((panel) => (
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