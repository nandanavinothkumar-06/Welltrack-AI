import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import { onSnapshot, query, collection, orderBy, limit, getCurrentUser, db } from '../services/mockFirebase';
import { LogEntry, User } from '../types';
import { LightBulbIcon, SparklesIcon } from '../components/icons';
import DigitalTwin from '../components/DigitalTwin';

const DashboardPage: React.FC = () => {
    const [latestLog, setLatestLog] = useState<LogEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const user = getCurrentUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, `users/${user.uid}/logs`),
            orderBy('date', 'desc'),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const logData = snapshot.docs[0].data() as Omit<LogEntry, 'id'>;
                setLatestLog({ ...logData, id: snapshot.docs[0].id });
            } else {
                setLatestLog(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const getGreeting = (name: string | null | undefined): string => {
        const hour = new Date().getHours();
        const displayName = name || 'there';
        if (hour < 12) return `Good morning, ${displayName}!`;
        if (hour < 18) return `Good afternoon, ${displayName}!`;
        return `Good evening, ${displayName}!`;
    };

    const moodMap: { [key: number]: { emoji: string, label: string, color: string } } = {
        1: { emoji: '😔', label: 'Very Sad', color: 'text-red-500' },
        2: { emoji: '😕', label: 'Sad', color: 'text-orange-500' },
        3: { emoji: '😐', label: 'Okay', color: 'text-yellow-500' },
        4: { emoji: '🙂', label: 'Good', color: 'text-green-500' },
        5: { emoji: '😄', label: 'Great', color: 'text-sky-500' },
    };

    const isToday = (logDate: string) => {
        const today = new Date().toISOString().split('T')[0];
        return logDate === today;
    };

    if (loading) {
        return <div className="flex justify-center mt-20"><Spinner /></div>;
    }

    return (
        <div className="space-y-8">
            <DigitalTwin />

            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{getGreeting(user?.displayName)}</h1>

            {latestLog && latestLog.aiTip && (
                <Card className="bg-sky-100/80 border border-sky-200 dark:bg-sky-900/50 dark:border-sky-800">
                    <div className="flex items-start space-x-4">
                        <div className="bg-sky-400 dark:bg-sky-500 p-2 rounded-full mt-1">
                            <SparklesIcon className="text-white h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sky-900 dark:text-sky-200">Your Daily AI Insight</h3>
                            <p className="text-sky-800 dark:text-sky-300 mt-1">{latestLog.aiTip}</p>
                        </div>
                    </div>
                </Card>
            )}

            {latestLog ? (
                <Card>
                    <div className="flex justify-between items-start">
                        <div>
                           <h2 className="text-xl font-semibold mb-1 dark:text-gray-200">
                                {isToday(latestLog.date) ? "Today's Log" : `Latest Log (${new Date(latestLog.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })})`}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">Here's your most recent entry.</p>
                        </div>
                         {isToday(latestLog.date) && (
                            <button onClick={() => navigate('/add-log')} className="text-sm font-medium text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300">
                                Edit Log
                            </button>
                        )}
                    </div>
                    
                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-6 text-center">
                        <div className="flex flex-col items-center">
                            <span className={`text-5xl ${moodMap[latestLog.mood].color}`}>{moodMap[latestLog.mood].emoji}</span>
                            <p className="mt-2 font-semibold text-gray-700 dark:text-gray-300">{moodMap[latestLog.mood].label}</p>
                        </div>
                         <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg dark:bg-gray-700/50">
                            <p className="text-3xl font-bold text-sky-600 dark:text-sky-400">{latestLog.sleepHours}<span className="text-lg">hrs</span></p>
                            <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">Sleep</p>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg dark:bg-gray-700/50">
                            <p className="text-3xl font-bold text-sky-600 dark:text-sky-400">{latestLog.waterLiters.toFixed(1)}<span className="text-lg">L</span></p>
                            <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">Water</p>
                        </div>
                    </div>
                     {latestLog.habits.length > 0 && (
                        <div className="mt-6">
                            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Completed Habits:</h3>
                             <div className="flex flex-wrap gap-2">
                                {latestLog.habits.map(habit => (
                                    <span key={habit} className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full dark:bg-green-900 dark:text-green-300">{habit}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    {latestLog.note && (
                         <div className="mt-6">
                            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Note:</h3>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm dark:bg-gray-700/50 dark:text-gray-400">{latestLog.note}</p>
                        </div>
                    )}
                </Card>
            ) : (
                <Card className="text-center">
                    <LightBulbIcon className="h-12 w-12 text-sky-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2 dark:text-gray-200">Welcome to WellTrack AI!</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">It looks like you haven't logged anything yet. Start by adding your first entry.</p>
                    <button
                        onClick={() => navigate('/add-log')}
                        className="bg-sky-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-sky-600 transition-colors dark:bg-sky-600 dark:hover:bg-sky-500"
                    >
                        Add Your First Log
                    </button>
                </Card>
            )}
        </div>
    );
};

export default DashboardPage;