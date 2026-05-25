// This file provides a mock implementation of Firebase services for local development.
// It pre-populates the app with sample data to showcase features without a live backend.
// NOTE: To connect to a real Firebase project, replace the contents of this file with your actual Firebase SDK initialization.
import { User, LogEntry } from '../types';
import { HABITS } from '../constants';

// --- MOCK DATA ---

const mockUser: User = {
    uid: 'mock-user-123',
    displayName: 'Alex',
    email: 'alex@example.com',
    photoURL: 'https://i.pravatar.cc/150?u=alex'
};

const generateMockLogs = (days: number): LogEntry[] => {
    const logs: LogEntry[] = [];
    const allHabits = HABITS;

    for (let i = 1; i <= days; i++) {
        const date = new Date();
        date.setUTCDate(date.getUTCDate() - (days - i));
        const dateString = date.toISOString().split('T')[0];

        const mood = Math.floor(Math.random() * 3) + 3; // Random mood from 3 (Okay) to 5 (Great)
        const sleep = parseFloat((6.5 + Math.random() * 2).toFixed(1));
        const water = parseFloat((1.8 + Math.random() * 1.5).toFixed(1));

        logs.push({
            id: `log${i}`,
            date: dateString,
            mood: mood,
            sleepHours: sleep,
            waterLiters: water,
            habits: allHabits.filter(() => Math.random() > 0.6),
            note: `Feeling pretty good on day ${i}. Focused on my goals.`,
            aiTip: i === days ? "Try to get at least 15 minutes of sunlight today. It's a great natural mood booster!" : "Consistency is key! You're building great momentum.",
            createdAt: date.getTime(),
        });
    }
    return logs;
};

let mockLogs: LogEntry[] = generateMockLogs(10);


// --- MOCK STATE AND LISTENERS ---

let currentUser: User | null = mockUser; // Start logged in
let authListeners: ((user: User | null) => void)[] = [];
let firestoreListeners: Map<string, (snapshot: any) => void> = new Map();

const notifyAuthListeners = () => {
    authListeners.forEach(cb => cb(currentUser));
};

const notifyFirestoreListeners = () => {
    const snapshot = {
        docs: mockLogs.map(log => ({
            id: log.id,
            data: () => log,
        })),
    };
    firestoreListeners.forEach(cb => cb(snapshot));
};


// --- MOCK AUTH FUNCTIONS ---

export const onAuthStateChanged = (callback: (user: User | null) => void): (() => void) => {
    authListeners.push(callback);
    // Immediately call back with the current user state
    setTimeout(() => callback(currentUser), 100); 
    
    // Return an unsubscribe function
    return () => {
        authListeners = authListeners.filter(cb => cb !== callback);
    };
};

export const signInWithGoogle = () => {
    return new Promise<void>(resolve => {
        setTimeout(() => {
            currentUser = mockUser;
            notifyAuthListeners();
            resolve();
        }, 500);
    });
};

export const signInWithEmail = (email: string, password: string) => {
     return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            if (password === "password") {
                 currentUser = { ...mockUser, email };
                 notifyAuthListeners();
                 resolve();
            } else {
                reject(new Error("Invalid credentials"));
            }
        }, 500);
    });
};

export const signUpWithEmail = (displayName: string, email: string, password: string) => {
     return new Promise<void>((resolve) => {
        setTimeout(() => {
            currentUser = { ...mockUser, displayName, email };
            notifyAuthListeners();
            resolve();
        }, 500);
    });
}

export const signOut = () => {
    return new Promise<void>(resolve => {
        setTimeout(() => {
            currentUser = null;
            notifyAuthListeners();
            resolve();
        }, 300);
    });
};

export const getCurrentUser = (): User | null => currentUser;


// --- MOCK FIRESTORE FUNCTIONS ---

export const onSnapshot = (query: any, callback: (snapshot: any) => void) => {
    const listenerId = `listener_${Date.now()}_${Math.random()}`;
    firestoreListeners.set(listenerId, callback);
    
    // Simulate initial data fetch
    setTimeout(() => {
         if (firestoreListeners.has(listenerId)) {
            const snapshot = {
                docs: mockLogs.sort((a,b) => a.createdAt - b.createdAt).map(log => ({
                    id: log.id,
                    data: () => log,
                })),
            };
            callback(snapshot);
         }
    }, 200);

    // Return unsubscribe function
    return () => {
        firestoreListeners.delete(listenerId);
    };
};

export const addDoc = (collectionRef: any, data: any) => {
    return new Promise<any>(resolve => {
        setTimeout(() => {
            const newLog: LogEntry = {
                id: `log${mockLogs.length + 1}`,
                ...data,
            };
            mockLogs.push(newLog);
            notifyFirestoreListeners();
            resolve({ id: newLog.id });
        }, 500);
    });
};

export const updateDoc = (docRef: any, data: any) => {
     return new Promise<void>(resolve => {
        setTimeout(() => {
            const logId = docRef.id;
            const logIndex = mockLogs.findIndex(log => log.id === logId);
            if (logIndex !== -1) {
                mockLogs[logIndex] = { ...mockLogs[logIndex], ...data };
                notifyFirestoreListeners();
            }
            resolve();
        }, 300);
    });
};

export const getDocs = (query: any) => {
    return new Promise<any>(resolve => {
        setTimeout(() => {
            const snapshot = {
                docs: mockLogs.map(log => ({
                    id: log.id,
                    data: () => log,
                })),
                empty: mockLogs.length === 0,
            };
            resolve(snapshot);
        }, 200);
    });
};

// These are helpers that are used to build queries. In a mock, they can be simple identity functions
// as the actual "querying" is just filtering the `mockLogs` array.
export const query = (...args: any[]) => args;
export const collection = (db: any, path: string) => ({ db, path });
export const doc = (db: any, path: string, id: string) => ({ id, path: `${path}/${id}` });
export const orderBy = (...args: any[]) => ({ type: 'orderBy', args });
export const limit = (l: number) => ({ type: 'limit', limit: l });
export const where = (...args: any[]) => ({ type: 'where', args });

// Export empty db object as it's expected by other files
export const db = {};
export type { User };
