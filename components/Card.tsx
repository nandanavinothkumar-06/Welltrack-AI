
import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-md dark:bg-gray-800/70 dark:backdrop-blur-sm ${className}`}>
            {children}
        </div>
    );
};

export default Card;