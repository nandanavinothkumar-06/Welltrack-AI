
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LightBulbIcon } from '../components/icons';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-green-100 to-yellow-100 p-4 dark:from-gray-900 dark:via-sky-900 dark:to-blue-900">
            <div className="text-center max-w-2xl">
                <div className="inline-block bg-white/80 p-4 rounded-full shadow-lg mb-6 dark:bg-gray-800/80">
                    <LightBulbIcon className="h-12 w-12 text-sky-500 dark:text-sky-400" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-gray-800 tracking-tight dark:text-gray-100">
                    Welcome to <span className="text-sky-600 dark:text-sky-400">WellTrack AI</span>
                </h1>
                <p className="mt-4 text-lg md:text-xl text-gray-600 dark:text-gray-300">
                    Track your wellness with personalized AI insights.
                    Understand your patterns, build better habits, and thrive.
                </p>
                <div className="mt-10">
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-sky-500 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-sky-600 transition-all duration-300 transform hover:scale-105 shadow-lg dark:bg-sky-600 dark:hover:bg-sky-500"
                    >
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;