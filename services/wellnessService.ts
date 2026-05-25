import { LogEntry, DigitalTwinData } from '../types';
import { HABITS } from '../constants';

interface HabitStreak {
    name: string;
    currentStreak: number;
    bestStreak: number;
}

export const analyzeHabitStreaks = (logs: LogEntry[]): HabitStreak[] => {
    if (logs.length === 0) {
        return [];
    }

    // Ensure logs are sorted by date ascending
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return HABITS.map(habit => {
        let currentStreak = 0;
        let bestStreak = 0;
        let tempStreak = 0;

        // Calculate best streak across all logs
        for (const log of sortedLogs) {
            if (log.habits.includes(habit)) {
                tempStreak++;
            } else {
                if (tempStreak > bestStreak) {
                    bestStreak = tempStreak;
                }
                tempStreak = 0;
            }
        }
        if (tempStreak > bestStreak) {
            bestStreak = tempStreak;
        }

        // Calculate current streak from the end of the logs
        // We need to check if today's or yesterday's log contains the habit
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        
        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        const lastLogDate = new Date(sortedLogs[sortedLogs.length - 1].date);
        const lastLogDateStr = lastLogDate.toISOString().split('T')[0];

        if (lastLogDateStr === todayStr || lastLogDateStr === yesterdayStr) {
            // Only calculate current streak if the log is recent
             for (let i = sortedLogs.length - 1; i >= 0; i--) {
                const log = sortedLogs[i];
                const logDate = new Date(log.date);

                // Check if the log is consecutive with the previous one in the streak
                if (i < sortedLogs.length - 1) {
                    const prevLogDate = new Date(sortedLogs[i+1].date);
                    const diffDays = (prevLogDate.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
                    if (diffDays > 1) {
                        break; // Break if there's a gap
                    }
                }
                
                if (log.habits.includes(habit)) {
                    currentStreak++;
                } else {
                    break; // Streak is broken
                }
            }
        }
        
        return {
            name: habit,
            currentStreak,
            bestStreak,
        };
    });
};

export const getDigitalTwinData = (logs: LogEntry[]): DigitalTwinData | null => {
    const recentLogs = logs.slice(-7);
    if (recentLogs.length < 3) {
        return null; // Not enough data for a meaningful state
    }

    const totalMood = recentLogs.reduce((sum, log) => sum + log.mood, 0);
    const avgMood = totalMood / recentLogs.length;

    const totalSleep = recentLogs.reduce((sum, log) => sum + log.sleepHours, 0);
    const avgSleep = totalSleep / recentLogs.length;

    const totalHabits = recentLogs.reduce((sum, log) => sum + log.habits.length, 0);

    let state: DigitalTwinData['state'];

    if (avgMood >= 4.2 && avgSleep >= 7 && totalHabits / recentLogs.length >= 3) {
        state = 'Thriving';
    } else if (avgMood < 3.0 || avgSleep < 6) {
        state = 'Needs Attention';
    } else {
        state = 'Balanced';
    }
    
    return {
        state,
        summary: {
            avgMood,
            avgSleep,
            totalHabits,
        },
    };
};