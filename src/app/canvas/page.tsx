'use client'
import React from 'react';
import Canvas from '../../components/canvas/Canvas';

export default function Page() {
  return (
  <React.StrictMode>
    <div className="flex flex-col h-screen">
      <div className="h-[20%]"></div>
      <div className="">
        <Canvas/>
      </div>
      
    </div>
    
  </React.StrictMode>
  );
}
