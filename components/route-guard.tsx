'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { LoadingPage } from '@/components/index'

type AllowedRole = "manager" | "staff" | "kitchen" | "owner" | "admin";

// Define which paths each role can access
const roleAccessMap: Record<AllowedRole, string[]> = {
  "manager": ["/manager/table-reservation", "/manager/product-inventory", "/manager/revenue", "/manager/table-status", "/manager/ordered-item"],
  "staff": ["/staff/table-reservation", "/staff/product-inventory", "/staff/table-status"],
  "kitchen": ["/kitchen/product-inventory", "/kitchen/ordered-item"],
  "owner": ["/owner/employees", "/owner/table-reservation", "/owner/users", "/owner/product-inventory", "/owner/revenue", "/owner/table-status"],
  "admin": ["/admin/employees", "/admin/table-reservation", "/admin/users", "/admin/product-inventory", "/admin/revenue"]
};

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  function isAllowedRole(role: string): role is AllowedRole {
    return ["manager", "staff", "kitchen", "owner", "admin"].includes(role);
  }

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Get user data from localStorage
        const userData = localStorage.getItem('user');
        
        // If no user data exists, don't apply any guards - act normally
        if (!userData) {
          console.log('No user data found, allowing normal navigation');
          setIsAuthorized(true);
          setIsLoading(false);
          return;
        }

        // If we have user data, apply role-based access control
        const user = JSON.parse(userData);
        const role = user.role;

        // If role is invalid or not specified, allow normal navigation
        if (!role || !isAllowedRole(role)) {
          console.log(`No valid role found: ${role}, allowing normal navigation`);
          setIsAuthorized(true);
          setIsLoading(false);
          return;
        }

        // Get allowed paths for the user's role
        const allowedPaths = roleAccessMap[role];
        
        // Check if current path is allowed for this role
        const isPathAllowed = allowedPaths.some(path => pathname.startsWith(path));
        
        if (!isPathAllowed) {
          // If path doesn't match role, redirect to their first allowed path
          console.log(`Access denied: ${role} cannot access ${pathname}`);
          router.push(allowedPaths[0] || '/');
          return;
        }
        
        // User is authorized to view this page
        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth error:', error);
        // In case of error, allow normal navigation
        setIsAuthorized(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  if (isLoading) {
    return <LoadingPage />;
  }

  return isAuthorized ? <>{children}</> : null;
}