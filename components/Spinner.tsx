
import React from 'react';

const Spinner: React.FC<{ size?: string }> = ({ size = 'h-12 w-12' }) => {
    return (
        <div className={`animate-spin rounded-full ${size} border-t-4 border-b-4 border-sky-500 dark:border-sky-400`}></div>
    );
};

export default Spinner;