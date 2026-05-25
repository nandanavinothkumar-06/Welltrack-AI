import React, { useState, useEffect, useMemo } from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import Card from '../components/Card';
import { onSnapshot, query, collection, orderBy, getCurrentUser, db } from '../services/mockFirebase';
import { LogEntry } from '../types';
import Spinner from '../components/Spinner';
import { analyzeHabitStreaks } from '../services/wellnessService';
import { getCorrelationInsight, getMoodPrediction, getWellnessTip } from '../services/geminiService';
import { SparklesIcon } from '../components/icons';
import { useTheme } from '../hooks/useTheme';
import { delay } from "../pages/delay";

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-2 border border-gray-200 rounded shadow-sm dark:bg-gray-700 dark:border-gray-600">
                <p className="font-bold dark:text-gray-100">{label}</p>
                {payload.map((p: any) => (
                    <p key={p.name} style={{ color: p.color }}>
                        {`${p.name}: ${p.value.toFixed(1)} ${p.unit || ''}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const ChartsPage: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [correlationInsight, setCorrelationInsight] = useState<string | null>(null);
    const [isInsightLoading, setIsInsightLoading] = useState(true);
    const [moodPredictions, setMoodPredictions] = useState<{name: string, predictedMood: number}[]>([]);
    const [isPredictionLoading, setIsPredictionLoading] = useState(true);
    const user = getCurrentUser();
    const { theme } = useTheme();

    const axisColor = theme === 'dark' ? '#9ca3af' : '#6b7280';
    const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        const q = query(collection(db, `users/${user.uid}/logs`), orderBy('date', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedLogs = snapshot.docs.map(doc => ({...doc.data(), id: doc.id } as LogEntry));
            setLogs(fetchedLogs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        const fetchInsights = async () => {
            if (logs.length > 0) {
                setIsInsightLoading(true);
                setIsPredictionLoading(true);
                try {
                    const [insight, predictions] = await Promise.all([
                        getCorrelationInsight(logs.slice(-14)), // Analyze last 14 days
                        getMoodPrediction(logs.slice(-14))
                    ]);
                    setCorrelationInsight(insight);
                    const formattedPredictions = predictions.map(p => ({
                        name: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
                        predictedMood: p.predictedMood
                    }));
                    setMoodPredictions(formattedPredictions);
                } catch (error) {
                    console.error("Failed to fetch AI insights:", error);
                    setCorrelationInsight("Could not generate an insight at this time.");
                } finally {
                    setIsInsightLoading(false);
                    setIsPredictionLoading(false);
                }
            } else {
                setIsInsightLoading(false);
                setIsPredictionLoading(false);
            }
        };
    
        fetchInsights();
    }, [logs]);

    const chartData = logs.map(log => ({
        ...log,
        name: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    }));
    
    const combinedMoodData = useMemo(() => {
        const historicalData = chartData.slice(-14).map(d => ({ name: d.name, mood: d.mood }));
        const predictionData = moodPredictions.map(p => ({ name: p.name, predictedMood: p.predictedMood }));
        
        const allNames = [...new Set([...historicalData.map(d => d.name), ...predictionData.map(p => p.name)])];
        
        return allNames.map(name => {
            const history = historicalData.find(d => d.name === name);
            const prediction = predictionData.find(p => p.name === name);
            return {
                name,
                mood: history ? history.mood : null,
                predictedMood: prediction ? prediction.predictedMood : null,
            };
        }).sort((a,b) => new Date(a.name) > new Date(b.name) ? 1 : -1);

    }, [chartData, moodPredictions]);

    const habitStreaks = useMemo(() => analyzeHabitStreaks(logs), [logs]);

    if (loading) {
        return <div className="flex justify-center mt-20"><Spinner /></div>;
    }
    
    if (logs.length < 2) {
        return (
            <Card className="text-center">
                <h2 className="text-xl font-semibold mb-2 dark:text-gray-200">Not enough data to display charts.</h2>
                <p className="text-gray-600 dark:text-gray-400">Keep logging your wellness to see your trends here!</p>
            </Card>
        );
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Your Wellness Trends</h1>

            {(isInsightLoading || correlationInsight) && logs.length >= 2 && (
                 <Card className="bg-indigo-100/80 border border-indigo-200 dark:bg-indigo-900/50 dark:border-indigo-800">
                    <div className="flex items-start space-x-4">
                        <div className="bg-indigo-400 dark:bg-indigo-500 p-2 rounded-full mt-1">
                            <SparklesIcon className="text-white h-5 w-5" />
                        </div>
                        <div className="w-full">
                            <h3 className="font-semibold text-indigo-900 dark:text-indigo-200">AI Correlation Analysis</h3>
                            {isInsightLoading ? (
                                <div className="flex items-center space-x-2 mt-2">
                                    <Spinner size="h-4 w-4" />
                                    <p className="text-sm text-indigo-800 dark:text-indigo-300">Finding patterns in your data...</p>
                                </div>
                            ) : (
                                <p className="text-indigo-800 dark:text-indigo-300 mt-1">{correlationInsight}</p>
                            )}
                        </div>
                    </div>
                </Card>
            )}

            <Card>
                <h2 className="text-xl font-semibold mb-6 dark:text-gray-200">AI Mood Forecast (Next 7 Days)</h2>
                {isPredictionLoading ? (
                    <div className="flex justify-center items-center h-[300px]">
                        <Spinner />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                         <ComposedChart data={combinedMoodData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis dataKey="name" stroke={axisColor} />
                            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke={axisColor} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ color: axisColor }} />
                            <Line type="monotone" dataKey="mood" stroke="#38bdf8" strokeWidth={2} name="Recent Mood" connectNulls />
                            <Line type="monotone" dataKey="predictedMood" stroke="#c084fc" strokeWidth={2} strokeDasharray="5 5" name="Predicted Mood" connectNulls />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </Card>
            
            <Card>
                <h2 className="text-xl font-semibold mb-6 dark:text-gray-200">Mood Over Time</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="name" stroke={axisColor} />
                        <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke={axisColor} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ color: axisColor }} />
                        <Line type="monotone" dataKey="mood" stroke="#38bdf8" strokeWidth={2} name="Mood (1-5)" />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            <Card>
                <h2 className="text-xl font-semibold mb-6 dark:text-gray-200">Sleep Hours</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="name" stroke={axisColor} />
                        <YAxis unit="h" stroke={axisColor} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ color: axisColor }} />
                        <Bar dataKey="sleepHours" fill="#818cf8" name="Sleep" unit="hrs"/>
                    </BarChart>
                </ResponsiveContainer>
            </Card>

            <Card>
                <h2 className="text-xl font-semibold mb-6 dark:text-gray-200">Water Intake</h2>
                 <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="name" stroke={axisColor} />
                        <YAxis unit="L" stroke={axisColor} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ color: axisColor }} />
                        <Line type="monotone" dataKey="waterLiters" stroke="#34d399" strokeWidth={2} name="Water" unit="L"/>
                    </LineChart>
                </ResponsiveContainer>
            </Card>
            
            <Card>
                <h2 className="text-xl font-semibold mb-6 dark:text-gray-200">Habit Consistency</h2>
                {habitStreaks.length > 0 ? (
                    <div className="space-y-4">
                        {habitStreaks.map(streak => (
                             <div key={streak.name}>
                                <div className="flex justify-between items-baseline mb-1">
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{streak.name}</p>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 space-x-2">
                                        <span>Current: <span className="font-bold text-orange-500 dark:text-orange-400">{streak.currentStreak} 🔥</span></span>
                                        <span className="text-gray-300 dark:text-gray-600">|</span>
                                        <span>Best: <span className="font-bold text-sky-600 dark:text-sky-400">{streak.bestStreak}</span></span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                    <div
                                        className="bg-sky-500 dark:bg-sky-400 h-2.5 rounded-full"
                                        style={{ width: `${streak.bestStreak > 0 ? (streak.currentStreak / streak.bestStreak) * 100 : 0}%` }}
                                        title={`Current Streak: ${streak.currentStreak}`}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-600 text-center dark:text-gray-400">No habit streaks yet. Keep tracking your habits to see your progress here!</p>
                )}
            </Card>
        </div>
    );
};

export default ChartsPage;