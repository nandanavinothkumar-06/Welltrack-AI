
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from '../services/mockFirebase';
import { MenuIcon, XIcon, ChartBarIcon, DocumentAddIcon, CogIcon, HomeIcon } from './icons';

const Navbar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };
    
    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive
                ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-700/50 dark:hover:text-gray-100'
        }`;

    const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
            isActive
                ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-700/50 dark:hover:text-gray-100'
        }`;


    return (
        <nav className="bg-white/60 backdrop-blur-sm shadow-sm sticky top-0 z-50 dark:bg-gray-900/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <h1 className="text-xl font-bold text-sky-600 dark:text-sky-400">WellTrack AI</h1>
                        </div>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                <NavLink to="/dashboard" className={navLinkClass}>
                                    <HomeIcon className="mr-2" /> Dashboard
                                </NavLink>
                                <NavLink to="/add-log" className={navLinkClass}>
                                    <DocumentAddIcon className="mr-2" /> Add Log
                                </NavLink>
                                <NavLink to="/charts" className={navLinkClass}>
                                    <ChartBarIcon className="mr-2" /> Charts
                                </NavLink>
                                <NavLink to="/settings" className={navLinkClass}>
                                    <CogIcon className="mr-2" /> Settings
                                </NavLink>
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <button
                            onClick={handleSignOut}
                            className="bg-red-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-600 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                    <div className="-mr-2 flex md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-500 dark:text-gray-400 dark:hover:bg-gray-800"
                        >
                            {isOpen ? <XIcon /> : <MenuIcon />}
                        </button>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <NavLink to="/dashboard" className={mobileNavLinkClass} onClick={() => setIsOpen(false)}><HomeIcon className="mr-2" />Dashboard</NavLink>
                        <NavLink to="/add-log" className={mobileNavLinkClass} onClick={() => setIsOpen(false)}><DocumentAddIcon className="mr-2" />Add Log</NavLink>
                        <NavLink to="/charts" className={mobileNavLinkClass} onClick={() => setIsOpen(false)}><ChartBarIcon className="mr-2" />Charts</NavLink>
                        <NavLink to="/settings" className={mobileNavLinkClass} onClick={() => setIsOpen(false)}><CogIcon className="mr-2" />Settings</NavLink>
                    </div>
                    <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="px-2">
                             <button
                                onClick={handleSignOut}
                                className="w-full text-left block bg-red-500 text-white px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;