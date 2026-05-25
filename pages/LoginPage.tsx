import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../services/mockFirebase';
import { GoogleIcon } from '../components/icons';
import Spinner from '../components/Spinner';

const LoginPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        if (!displayName) {
          setError('Please enter your name.');
          setIsLoading(false);
          return;
        }
        await signUpWithEmail(displayName, email, password);
      } else {
        await signInWithEmail(email, password);
      }
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.message.replace('Firebase: ', ''));
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-blue-100 via-green-100 to-yellow-100 dark:from-gray-900 dark:via-sky-900 dark:to-blue-900 p-4 transition-colors duration-500">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg dark:bg-gray-800/80">
          <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center dark:text-gray-100">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="text-gray-600 mb-6 text-center dark:text-gray-300">
            to continue to WellTrack AI
          </p>

          {error && (
            <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm dark:bg-red-900/50 dark:text-red-200">
              {error}
            </p>
          )}

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {isSignUp && (
              <input
                type="text"
                placeholder="Your Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-sky-500 text-white font-medium py-3 px-4 rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 flex justify-center items-center dark:bg-sky-600 dark:hover:bg-sky-500 dark:disabled:bg-sky-800"
            >
              {isLoading ? <Spinner size="h-5 w-5" /> : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="my-6 flex items-center">
            <hr className="grow border-gray-300 dark:border-gray-600" />
            <span className="mx-4 text-gray-500 text-sm dark:text-gray-400">OR</span>
            <hr className="grow border-gray-300 dark:border-gray-600" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 dark:bg-gray-200 dark:text-gray-800 dark:border-gray-300 dark:hover:bg-gray-300"
          >
            <GoogleIcon className="mr-3" /> Sign in with Google
          </button>

          <p className="text-center text-sm text-gray-600 mt-6 dark:text-gray-400">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="font-medium text-sky-600 hover:underline ml-1 dark:text-sky-400"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
