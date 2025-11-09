'use client'
import React from 'react';
import Canvas from '../../components/canvas/Canvas';
import { useAuth } from '@/hooks/useAuth';

export default function Page() {
  const { user } = useAuth();
  if (!user) return <p className="p-4 text-sm">Sign in required to view canvas.</p>;
  // Provide a placeholder projectId for sandbox canvas if needed
  const demoProjectId = 'demo';
  const demoContext = 'Sandbox brainstorming canvas';
  return (
    <React.StrictMode>
      <div className="flex flex-col h-screen">
        <div className="flex-1 relative">
          <Canvas userId={user.uid} projectId={demoProjectId} projectContext={demoContext} />
        </div>
      </div>
    </React.StrictMode>
  );
}
