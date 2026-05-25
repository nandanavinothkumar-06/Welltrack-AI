export interface User {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
}

export interface LogEntry {
    id: string;
    date: string; // YYYY-MM-DD
    mood: number; // 1-5
    sleepHours: number;
    waterLiters: number;
    habits: string[];
    note: string;
    aiTip?: string;
    createdAt: number; // timestamp
}

export interface ChatMessagePart {
    text: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    parts: ChatMessagePart[];
}

export type DigitalTwinState = 'Thriving' | 'Balanced' | 'Needs Attention';

export interface DigitalTwinData {
    state: DigitalTwinState;
    summary: {
        avgMood: number;
        avgSleep: number;
        totalHabits: number;
    };
}