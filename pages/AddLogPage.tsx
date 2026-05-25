import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { HABITS } from '../constants';
import { db, addDoc, collection, getCurrentUser, query, orderBy, limit, doc, updateDoc, where, getDocs } from '../services/mockFirebase';
import { getWellnessTip } from '../services/geminiService';
import { LogEntry } from '../types';
import Spinner from '../components/Spinner';

const AddLogPage: React.FC = () => {
    const today = new Date().toISOString().split('T')[0];
    const [date] = useState(today);
    const [mood, setMood] = useState(3);
    const [sleepHours, setSleepHours] = useState(7.5);
    const [waterLiters, setWaterLiters] = useState(2.0);
    const [habits, setHabits] = useState<string[]>([]);
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingLogId, setExistingLogId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const navigate = useNavigate();
    const user = getCurrentUser();

    useEffect(() => {
        const checkForExistingLog = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }
            const q = query(
                collection(db, `users/${user.uid}/logs`),
                where("date", "==", today),
                limit(1)
            );

            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const todayLogDoc = querySnapshot.docs[0];
                const todayLog = todayLogDoc.data() as LogEntry;
                setExistingLogId(todayLogDoc.id);
                setMood(todayLog.mood);
                setSleepHours(todayLog.sleepHours);
                setWaterLiters(todayLog.waterLiters);
                setHabits(todayLog.habits);
                setNote(todayLog.note);
            }
            setIsLoading(false);
        };

        checkForExistingLog();
    }, [user, today]);


    const handleHabitToggle = (habit: string) => {
        setHabits(prev =>
            prev.includes(habit) ? prev.filter(h => h !== habit) : [...prev, habit]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSubmitting(true);

        const logData = {
            date,
            mood,
            sleepHours: Number(sleepHours),
            waterLiters: Number(waterLiters),
            habits,
            note,
            createdAt: Date.now(),
        };

        try {
            const userLogsCollection = collection(db, `users/${user.uid}/logs`);
            
            if (existingLogId) {
                // Update existing log
                const logRef = doc(db, `users/${user.uid}/logs`, existingLogId);
                await updateDoc(logRef, logData);
                navigate('/dashboard');
            } else {
                // Add new log and generate tip
                const docRef = await addDoc(userLogsCollection, logData);

                // Fetch recent logs for AI context
                const logsQuery = query(userLogsCollection, orderBy('date', 'desc'), limit(7));
                const querySnapshot = await getDocs(logsQuery);
                const recentLogs = querySnapshot.docs.map(doc => doc.data() as LogEntry);

                const tip = await getWellnessTip(recentLogs);
                await updateDoc(doc(db, `users/${user.uid}/logs`, docRef.id), { aiTip: tip });

                navigate('/dashboard');
            }
        } catch (error) {
            console.error("Error saving log:", error);
            setIsSubmitting(false);
        }
    };

    const moodEmojis = ['😔', '😕', '😐', '🙂', '😄'];

    if (isLoading) {
        return <div className="flex justify-center mt-20"><Spinner /></div>;
    }

    return (
        <Card>
            <h1 className="text-2xl font-bold mb-6 dark:text-gray-200">{existingLogId ? "Edit Today's Log" : "Add New Log"}</h1>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">How was your mood today?</label>
                    <div className="flex justify-between items-center">
                        {moodEmojis.map((emoji, index) => (
                            <label key={index} className="flex flex-col items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="mood"
                                    value={index + 1}
                                    checked={mood === index + 1}
                                    onChange={() => setMood(index + 1)}
                                    className="sr-only"
                                />
                                <span className={`text-4xl transition-transform transform ${mood === index + 1 ? 'scale-125' : 'grayscale opacity-60 hover:opacity-100'}`}>
                                    {emoji}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="sleep" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sleep (hours)</label>
                        <input id="sleep" type="number" step="0.5" value={sleepHours} onChange={e => setSleepHours(parseFloat(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div>
                        <label htmlFor="water" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Water (liters)</label>
                        <input id="water" type="number" step="0.1" value={waterLiters} onChange={e => setWaterLiters(parseFloat(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Which habits did you complete?</label>
                    <div className="flex flex-wrap gap-2">
                        {HABITS.map(habit => (
                            <button
                                type="button"
                                key={habit}
                                onClick={() => handleHabitToggle(habit)}
                                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                                    habits.includes(habit)
                                        ? 'bg-sky-500 text-white dark:bg-sky-600'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {habit}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes (optional)</label>
                    <textarea id="notes" value={note} onChange={e => setNote(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
                </div>

                <div className="flex justify-end">
                    <button type="submit" disabled={isSubmitting} className="bg-sky-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-sky-600 transition-colors disabled:bg-sky-300 flex items-center dark:bg-sky-600 dark:hover:bg-sky-500 dark:disabled:bg-sky-800">
                        {isSubmitting && <Spinner size="h-5 w-5 mr-3" />}
                        {isSubmitting ? 'Saving...' : 'Save Log'}
                    </button>
                </div>
            </form>
        </Card>
    );
};

export default AddLogPage;