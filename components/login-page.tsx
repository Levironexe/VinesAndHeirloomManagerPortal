'use client'
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// Create Supabase client (same as your original code)
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

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    window.dispatchEvent(new Event('userLoggedIn'));

    try {
      // Make sure your users table includes username, password, and role columns
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("password_hash", password)
        .single();

      if (error) throw error;
      
      if (data) {
        // Store user data including role in localStorage
        localStorage.setItem("user", JSON.stringify(data));
        // All authenticated users go to the admin dashboard
        // The left panel will show different options based on role
        window.location.href = "/admin";
      } else {
        setErrorMessage("Invalid username or password");
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage("An error occurred while logging in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 via-blue-50 to-white">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md relative overflow-hidden">
          {/* Red Key Design */}
          <div className="absolute -left-40 -top-32 w-96 h-96 bg-red-600 rounded-full opacity-90 z-0" />
          
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Login</h2>
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input 
                  type="text"
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password"
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 
                         transition duration-200 font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>

            {errorMessage && (
              <p className="mt-4 text-sm text-red-600">
                {errorMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center text-sm text-gray-600">
        © 2024 Human Resource Management System. All rights reserved.
      </div>
    </div>
  );
};

export default LoginPage;