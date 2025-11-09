'use client';
import React from 'react';
import { Button } from '../ui/button';


interface ToolbarProps {
    addItem: (type: 'branch' | 'leaf') => void;
    onCenter: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ addItem, onCenter }) => {
    return (
        <div className="absolute top-4 left-4 bg-card p-4 rounded-lg shadow-md z-10">
            <div className="gap-4 flex flex-row items-center">
                <Button 
                    variant="outline"
                    onClick={() => addItem('branch')}
                    className="px-4 py-2"
                >
                    Add Branch
                </Button>
                <Button 
                    variant="outline"
                    onClick={() => addItem('leaf')}
                    className="px-4 py-2"
                >
                    Add Leaf
                </Button>
                <Button 
                    variant="outline"
                    onClick={onCenter}
                    className="px-4 py-2 ml-2"
                    title="Center view and reset zoom"
                >
                    Center View
                </Button>
            </div>
        </div>
    );
};

export default Toolbar;
