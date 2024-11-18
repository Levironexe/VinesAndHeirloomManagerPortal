import React from 'react';

const LoginPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 via-blue-50 to-white">


      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md relative overflow-hidden">
          {/* Red Key Design */}
          <div className="absolute -left-40 -top-32 w-96 h-96 bg-red-600 rounded-full opacity-90 z-0" />
          
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Login</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input 
                  type="text"
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password"
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 
                         transition duration-200 font-medium"
              >
                Login
              </button>
            </form>

            <p className="mt-4 text-sm text-red-600">
              Please check your username and password carefully!
            </p>
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