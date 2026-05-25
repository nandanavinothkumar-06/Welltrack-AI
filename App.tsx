
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from './services/mockFirebase';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AddLogPage from './pages/AddLogPage';
import ChartsPage from './pages/ChartsPage';
import SettingsPage from './pages/SettingsPage';
import Spinner from './components/Spinner';
import { ThemeProvider } from './context/ThemeContext';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged((user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-100 via-green-100 to-yellow-100 dark:from-gray-900 dark:via-sky-900 dark:to-blue-900">
                <Spinner />
            </div>
        );
    }

    return (
        <ThemeProvider>
            <HashRouter>
                {user ? (
                    <Layout>
                        <Routes>
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/add-log" element={<AddLogPage />} />
                            <Route path="/charts" element={<ChartsPage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route path="*" element={<Navigate to="/dashboard" />} />
                        </Routes>
                    </Layout>
                ) : (
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/" element={<LandingPage />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                )}
            </HashRouter>
        </ThemeProvider>
    );
};

export default App;