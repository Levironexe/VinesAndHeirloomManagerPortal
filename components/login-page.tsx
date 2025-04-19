'use client'
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { ChefHat, UserRound, Settings } from 'lucide-react';

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
      }
    }
  }
);

// Define allowed roles
type AllowedRole = "manager" | "staff" | "kitchen" | "owner" | "admin";

// Role-specific configurations
const roleConfig: Record<AllowedRole, {
  primaryColor: string;
  hoverColor: string;
  title: string;
  icon: React.ReactNode;
}> = {
  manager: {
    primaryColor: 'bg-blue-600',
    hoverColor: 'bg-blue-700',
    title: 'Manager Login',
    icon: <Settings className="h-16 w-16 mb-4 text-blue-600" />
  },
  staff: {
    primaryColor: 'bg-green-600',
    hoverColor: 'bg-green-700',
    title: 'Staff Login',
    icon: <UserRound className="h-16 w-16 mb-4 text-green-600" />
  },
  kitchen: {
    primaryColor: 'bg-orange-600',
    hoverColor: 'bg-orange-700',
    title: 'Kitchen Staff Login',
    icon: <ChefHat className="h-16 w-16 mb-4 text-orange-600" />
  },
  admin: {
    primaryColor: 'bg-purple-600',
    hoverColor: 'bg-purple-700',
    title: 'Admin Login',
    icon: <Settings className="h-16 w-16 mb-4 text-purple-600" />
  },
  owner: {
    primaryColor: 'bg-indigo-600',
    hoverColor: 'bg-indigo-700',
    title: 'Owner Login',
    icon: <Settings className="h-16 w-16 mb-4 text-indigo-600" />
  }
};

// Define which panels each role can access
const rolePanelConfig: Record<AllowedRole, number[]> = {
  "manager": [2, 4, 6, 7, 8], // Table Reservation, Product & Inventory, Revenue, Table Status
  "staff": [2, 4, 7], // Table Reservation, Product & Inventory, Table Status
  "kitchen": [4, 8], // Product & Inventory and Ordered Item
  "owner": [1, 2, 3, 4, 6, 7], // All panels
  "admin": [1, 2, 3, 4, 6] // Employees, Table Reservation, Users, Product & Inventory, Revenue
};

// Define base paths for each panel
const panelPaths: Record<number, string> = {
  1: "/employees",
  2: "/table-reservation",
  3: "/users",
  4: "/product-inventory",
  6: "/revenue",
  7: "/table-status",
  8: "/ordered-item",
};

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<AllowedRole | null>(null);
  const router = useRouter();

  // Load selected role from localStorage on component mount
  useEffect(() => {
    // Get role from localStorage
    const savedRole = localStorage.getItem('selectedRole');
    if (savedRole && isAllowedRole(savedRole)) {
      setRole(savedRole);
    } else {
      // Redirect to role selection if no role is saved
      router.push('/');
    }
  }, [router]);

  // Type guard function to check if a string is a valid AllowedRole
  function isAllowedRole(role: string): role is AllowedRole {
    return Object.keys(roleConfig).includes(role);
  }

  // Handle case where role is not yet loaded
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const currentConfig = roleConfig[role];

  // Get first available panel path for the role
  const getFirstAvailablePanelPath = (userRole: AllowedRole) => {
    const availablePanels = rolePanelConfig[userRole] || [];
    if (availablePanels.length > 0) {
      // Get the first panel ID
      const firstPanelId = availablePanels[0];
      // Get the base path for this panel
      const basePath = panelPaths[firstPanelId];
      // Return role-specific path
      return `/${userRole}${basePath}`;
    }
    return `/${userRole}`; // Fallback
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    window.dispatchEvent(new Event('userLoggedIn'));

    try {
      // First, check if the username exists and has the correct role
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("role", role)
        .single();

      if (userError) {
        // If error is not 'no rows returned', it's a different error
        if (userError.code !== 'PGRST116') {
          throw userError;
        }
        setErrorMessage(`Invalid username or you don't have ${role} permissions`);
        setIsLoading(false);
        return;
      }

      // Now verify password
      const { data: authData, error: authError } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("password_hash", password)
        .eq("role", role)
        .single();

      if (authError) throw authError;
      
      if (authData) {
        // Store user data in localStorage
        localStorage.setItem("user", JSON.stringify(authData));
        
        // Make sure the role from the DB is a valid AllowedRole
        if (isAllowedRole(authData.role)) {
          // Get the first available panel path for the user's role
          const redirectPath = getFirstAvailablePanelPath(authData.role);
          
          // Redirect to the first available panel with role-specific path
          window.location.href = redirectPath;
        } else {
          console.error(`Unknown role: ${authData.role}`);
          setErrorMessage("Login successful but role configuration error occurred");
        }
      } else {
        setErrorMessage("Wrong password");
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md relative overflow-hidden">
          {/* Role-specific accent color */}
          <div className={`absolute -left-40 -top-32 w-96 h-96 ${currentConfig.primaryColor} rounded-full opacity-90 z-0`} />
          
          <div className="relative z-10">
            <div className="flex flex-col items-center mb-6">
              {currentConfig.icon}
              <h2 className="text-2xl font-bold text-gray-800">{currentConfig.title}</h2>
            </div>
            
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Username</label>
                <input 
                  type="text"
                  className="w-full p-2 border rounded-md focus:ring-2 text-black"
                  placeholder={`Enter ${role} username`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">Password</label>
                <input 
                  type="password"
                  className="w-full p-2 border rounded-md focus:ring-2 text-black"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit"
                className={`w-full ${currentConfig.primaryColor} text-white py-2 px-4 rounded-md 
                         hover:${currentConfig.hoverColor} transition duration-200 font-medium`}
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : `Login`}
              </button>
            </form>

            {errorMessage && (
              <p className="mt-4 text-sm text-red-600">
                {errorMessage}
              </p>
            )}
            
            {/* Link back to role selection page */}
            <div className="mt-6 text-center">
              <a href="/" className="text-sm text-gray-600 hover:underline">
                Change role
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center text-sm text-gray-600">
        © 2024 Restaurant Management System. All rights reserved.
      </div>
    </div>
  );
};

export default LoginPage;