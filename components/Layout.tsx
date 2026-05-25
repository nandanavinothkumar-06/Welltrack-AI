import React from 'react';
import Navbar from './Navbar';
import ChatAssistant from './ChatAssistant';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-blue-100 via-green-100 to-yellow-100 font-sans text-gray-800 dark:from-gray-900 dark:via-sky-900 dark:to-blue-900 dark:text-gray-200">
            <Navbar />
            <main className="p-4 sm:p-6 md:p-8">
                <div className="max-w-4xl mx-auto">
                    {children}
                </div>
            </main>
            <ChatAssistant />
        </div>
    );
};

export default Layout;