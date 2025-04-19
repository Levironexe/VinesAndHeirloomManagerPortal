'use client'
import React, { useState, useEffect } from 'react'
import { ChefHat, UserRound, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'

const availableRoles = [
    {
        id: 1,
        role: "manager",
        displayName: "Manager",
        icon: <Settings className='h-20 w-20 text-xl'/>
    },
    {
        id: 2,
        role: "staff",
        displayName: "Staff",
        icon: <UserRound className='h-20 w-20 text-xl'/>
    },
    {
        id: 3,
        role: "kitchen",
        displayName: "Kitchen Staff",
        icon: <ChefHat className='h-20 w-20 text-xl'/>
    },
]

const ChooseRolePage = () => {
    const [selectedRole, setSelectedRole] = useState<string>("")
    const router = useRouter()

    // Load any previously selected role from localStorage when component mounts
    useEffect(() => {
        const savedRole = localStorage.getItem('selectedRole')
        if (savedRole) {
            setSelectedRole(savedRole)
        }
    }, [])

    const handleRoleSelection = (role: string) => {
        // Save the selected role to localStorage
        localStorage.setItem('selectedRole', role)
        
        // Update state
        setSelectedRole(role)
        
        // Navigate to the login page
        router.push(`/${role}/login`)
    }

    return (
        <div className='w-full min-h-screen h-screen bg-white text-black flex items-center justify-center'>
            <div className='max-w-6xl mx-auto'>
                <h1 className='text-3xl text-center mb-8'>Choose your position</h1>
                <div className='flex gap-12 justify-center'>
                    {availableRoles.map((roleOption) => (
                        <div 
                            key={roleOption.id}
                            onClick={() => handleRoleSelection(roleOption.role)}
                            className={`flex-1 gap-4 flex flex-col items-center rounded-xl border-2 border-black shadow-lg p-4 
                                       ${selectedRole === roleOption.role ? 'bg-orange-500/20' : ''} 
                                       hover:shadow-sm hover:shadow-orange-500 hover:scale-105 transition-all duration-200 
                                       hover:bg-orange-500/10 cursor-pointer`}
                        >
                            {roleOption.icon}
                            <p className='text-xl'>{roleOption.displayName}</p>
                        </div>
                    ))}      
                </div>
            </div>
        </div>
    )
}

export default ChooseRolePage