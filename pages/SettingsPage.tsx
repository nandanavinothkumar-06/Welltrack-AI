import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { getCurrentUser, signOut, getDocs, query, collection, db } from '../services/mockFirebase';
import { LogEntry } from '../types';
import Spinner from '../components/Spinner';
import { useTheme } from '../hooks/useTheme';

const SettingsPage: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const user = getCurrentUser();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleExport = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const logsQuery = query(collection(db, `users/${user.uid}/logs`));
      const querySnapshot = await getDocs(logsQuery);
      const logs: LogEntry[] = querySnapshot.docs.map(doc => doc.data() as LogEntry);

      if (logs.length === 0) {
        alert("You don't have any data to export yet.");
        return;
      }

      const header = 'date,mood,sleepHours,waterLiters,habits,note,aiTip\n';
      const rows = logs.map(log => {
        const habits = `"${log.habits.join('; ')}"`;
        const note = `"${log.note ? log.note.replace(/"/g, '""') : ''}"`;
        const aiTip = `"${log.aiTip ? log.aiTip.replace(/"/g, '""') : ''}"`;
        return [log.date, log.mood, log.sleepHours, log.waterLiters, habits, note, aiTip].join(',');
      }).join('\n');

      const csvContent = header + rows;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'welltrack_ai_export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

    } catch (error) {
      console.error("Error exporting data:", error);
      alert("An error occurred while exporting your data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">Settings</h1>
      <div className="space-y-8">
        <Card>
          <h2 className="text-xl font-semibold mb-6 border-b pb-4 dark:text-gray-200 dark:border-gray-700">Profile</h2>
          {/* Removed profile image/avatar */}
          <div className="space-y-1">
            <p className="text-lg font-medium dark:text-gray-200">{user?.displayName}</p>
            <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4 dark:text-gray-200">Data Export</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Download a CSV file of all your wellness logs for your own records or analysis.
          </p>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full sm:w-auto bg-sky-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-600 transition-colors disabled:bg-sky-300 flex items-center justify-center dark:bg-sky-600 dark:hover:bg-sky-500 dark:disabled:bg-sky-800"
          >
            {isExporting && <Spinner size="h-5 w-5 mr-3" />}
            {isExporting ? 'Exporting...' : 'Download My Data (CSV)'}
          </button>
        </Card>

        <div>
          <button
            onClick={handleSignOut}
            className="w-full bg-red-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
