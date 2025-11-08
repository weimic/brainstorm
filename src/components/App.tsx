"use client";

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Login from './Login';
import { useRouter } from 'next/navigation';

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center min-h-full">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
);

const App: React.FC = () => {
    // All hooks are called at the top level, in a consistent order
    const { user, loading } = useAuth();
    const router = useRouter();

    // Navigation effect runs after auth state is determined
    React.useEffect(() => {
        if (!loading && user) {
            router.replace('/dashboard');
        }
    }, [user, loading, router]);

    // Loading state check after hooks
    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <main className="h-full font-sans text-gray-100">
            {!user && <Login />}
        </main>
    );
};

export default App;
