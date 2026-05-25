import React, { useState, useEffect } from 'react';
import { onSnapshot, query, collection, orderBy, getCurrentUser, db, limit } from '../services/mockFirebase';
import { getDigitalTwinData } from '../services/wellnessService';
import { getDigitalTwinMessage } from '../services/geminiService';
import { LogEntry, DigitalTwinData, DigitalTwinState } from '../types';
import { PlantThrivingIcon, PlantBalancedIcon, PlantWiltedIcon } from './icons';
import Spinner from './Spinner';

const DigitalTwin: React.FC = () => {
    const [twinData, setTwinData] = useState<DigitalTwinData | null>(null);
    const [message, setMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const user = getCurrentUser();

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const q = query(
            collection(db, `users/${user.uid}/logs`),
            orderBy('date', 'desc'),
            limit(7)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logs = snapshot.docs.map(doc => doc.data() as LogEntry).reverse(); // Oldest to newest
            const data = getDigitalTwinData(logs);
            setTwinData(data);
        });

        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        const fetchMessage = async () => {
            if (twinData) {
                setIsLoading(true);
                try {
                    const aiMessage = await getDigitalTwinMessage(twinData);
                    setMessage(aiMessage);
                } catch (error) {
                    console.error("Error fetching twin message:", error);
                    setMessage("Let's keep tracking to see how I grow!");
                } finally {
                    setIsLoading(false);
                }
            } else {
                 setIsLoading(false);
            }
        };

        fetchMessage();
    }, [twinData]);

    const renderAvatar = (state: DigitalTwinState) => {
        switch (state) {
            case 'Thriving':
                return <PlantThrivingIcon className="h-12 w-12 text-green-500 dark:text-green-400" />;
            case 'Balanced':
                return <PlantBalancedIcon className="h-12 w-12 text-sky-500 dark:text-sky-400" />;
            case 'Needs Attention':
                return <PlantWiltedIcon className="h-12 w-12 text-yellow-500 dark:text-yellow-400" />;
            default:
                return null;
        }
    };

    if (!twinData && !isLoading) {
        return null; // Don't render if there isn't enough data
    }
    
    return (
        <div className="bg-white/70 backdrop-blur-sm p-5 rounded-2xl shadow-md dark:bg-gray-800/70 flex items-center space-x-4">
            {isLoading && !twinData ? (
                <div className="flex justify-center items-center w-full h-16">
                    <Spinner />
                </div>
            ) : twinData ? (
                <>
                    <div className="flex-shrink-0">
                        {renderAvatar(twinData.state)}
                    </div>
                    <div className="flex-grow">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">Your Virtual Self</p>
                        {isLoading ? (
                             <div className="flex items-center space-x-2 mt-1">
                                <Spinner size="h-4 w-4" />
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">Thinking...</p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{message}"</p>
                        )}
                    </div>
                </>
            ) : null }
        </div>
    );
};

export default DigitalTwin;