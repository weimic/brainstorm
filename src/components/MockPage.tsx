
import React from 'react';
import { signOut, User } from 'firebase/auth';
import { auth } from '../services/firebase';

interface MockPageProps {
  user: User;
}

const MockPage: React.FC<MockPageProps> = ({ user }) => {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-4 text-center">
        <div className="bg-gray-800 p-10 rounded-xl shadow-2xl border border-gray-700 max-w-lg w-full">
            <h1 className="text-4xl font-bold text-white mb-2">Welcome</h1>
            <p className="text-lg text-gray-300 mb-6 break-all">
                You are authenticated as: <span className="font-medium text-blue-400">{user.email}</span>
            </p>
            <p className="text-md text-gray-400 mb-8">
                This is a protected page. Only authenticated users can see this content.
            </p>
            <button
                onClick={handleSignOut}
                className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 transition-colors"
            >
                Sign Out
            </button>
        </div>
    </div>
  );
};

export default MockPage;
