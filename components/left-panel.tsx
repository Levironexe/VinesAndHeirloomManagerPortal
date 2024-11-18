'use client'
import React from 'react';
import { Users, Package, Truck, CreditCard, UserCog, Clock } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface NavItemProps {
 icon: React.ElementType;
 text: string;
 path: string;
}

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
 return (
   <div className="w-64 bg-white shadow-lg p-4">
     <div className="mb-8">
       <h1 className="text-xl font-bold">Admin Panel</h1>
     </div>
     <nav className="space-y-2">
       <NavItem icon={Users} text="Customer Management" path="/customer-management" />
       <NavItem icon={Package} text="Product & Inventory" path="/product-inventory" />
       <NavItem icon={Truck} text="Transport Management" path="/transport-management" />
       <NavItem icon={CreditCard} text="Payment Records" path="/payment-records" />
       <NavItem icon={UserCog} text="Employee Management" path="/employees-management" /> 
       <NavItem icon={Clock} text="Order History" path="/orders-history" />
     </nav>
   </div>
 );
};

export default LeftPanel;