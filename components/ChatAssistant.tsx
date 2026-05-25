import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, LogEntry } from '../types';
import { getMessageFromAssistant } from '../services/geminiService';
import { ChatBubbleIcon, XIcon, MicrophoneIcon, SendIcon } from './icons';
import Spinner from './Spinner';
import { collection, db, getCurrentUser, limit, onSnapshot, orderBy, query } from '../services/mockFirebase';

// Fix: Add type definitions for SpeechRecognition to the window object to resolve TypeScript errors.
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

const ChatAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const recognitionRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const user = getCurrentUser();

    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, `users/${user.uid}/logs`),
            orderBy('date', 'desc'),
            limit(7)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedLogs = snapshot.docs.map(doc => doc.data() as LogEntry).reverse();
            setLogs(fetchedLogs);
        });
        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const speak = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
    };

    const handleSendMessage = async () => {
        const trimmedInput = inputValue.trim();
        if (!trimmedInput || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', parts: [{ text: trimmedInput }] };
        const newMessages = [...messages, newUserMessage];
        setMessages(newMessages);
        setInputValue('');
        setIsLoading(true);

        try {
            const aiResponse = await getMessageFromAssistant(newMessages, logs);
            setMessages(prev => [...prev, aiResponse]);
            speak(aiResponse.parts[0].text);
        } catch (error) {
            console.error("Error getting response from assistant:", error);
            const errorMessage: ChatMessage = { role: 'model', parts: [{ text: "Sorry, I'm having trouble connecting right now." }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const setupSpeechRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onstart = () => setIsListening(true);
            recognitionRef.current.onend = () => setIsListening(false);
            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onresult = (event: any) => {
                const transcript = Array.from(event.results)
                    .map((result: any) => result[0])
                    .map((result) => result.transcript)
                    .join('');
                setInputValue(transcript);

                if (event.results[0].isFinal) {
                    handleSendMessage();
                }
            };
        }
    };

    const handleMicClick = () => {
        if (!recognitionRef.current) {
            setupSpeechRecognition();
        }

        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-sky-500 text-white p-4 rounded-full shadow-lg hover:bg-sky-600 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 z-50 dark:bg-sky-600 dark:hover:bg-sky-500"
                aria-label="Open wellness assistant"
            >
                <ChatBubbleIcon className="h-6 w-6" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-lg h-[90vh] max-h-[700px] flex flex-col overflow-hidden m-4 dark:bg-gray-800">
                        <header className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-900 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Your Wellness Assistant</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100">
                                <XIcon className="h-6 w-6" />
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center text-gray-500 dark:text-gray-400 p-8">
                                    <ChatBubbleIcon className="h-12 w-12 mx-auto mb-4" />
                                    <p>Ask me anything about your wellness journey!</p>
                                    <p className="text-sm mt-2">e.g., "How can I improve my sleep?"</p>
                                </div>
                            )}
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.role === 'user' ? 'bg-sky-500 text-white rounded-br-none' : 'bg-white text-gray-800 border rounded-bl-none dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'}`}>
                                        <p className="text-sm">{msg.parts[0].text}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="max-w-xs md:max-w-md p-3 rounded-2xl bg-white text-gray-800 border rounded-bl-none dark:bg-gray-700 dark:border-gray-600 flex items-center">
                                       <Spinner size="h-5 w-5" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <footer className="p-4 border-t bg-white dark:bg-gray-900 dark:border-gray-700">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a message or use the mic..."
                                    className="flex-1 w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                    disabled={isLoading}
                                />
                                <button onClick={handleMicClick} className={`p-3 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}>
                                    <MicrophoneIcon className="h-5 w-5" />
                                </button>
                                <button onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading} className="p-3 rounded-full bg-sky-500 text-white hover:bg-sky-600 disabled:bg-sky-300 dark:bg-sky-600 dark:hover:bg-sky-500 dark:disabled:bg-sky-800">
                                    <SendIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </footer>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatAssistant;