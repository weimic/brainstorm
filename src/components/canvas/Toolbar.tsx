'use client';
import React from 'react';
import { Button } from '../ui/button';


interface ToolbarProps {
    onAddBranch: () => void;
    onAddLeaf: () => void;
    onAddNote: () => void;
    onCenter: () => void;
    onRefresh?: () => void;
    canRefresh?: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({ onAddBranch, onAddLeaf, onAddNote, onCenter, onRefresh, canRefresh = false }) => {
    return (
        <div className="absolute top-4 left-4 bg-card p-4 rounded-lg shadow-md z-10">
            <div className="gap-4 flex flex-row items-center">
                <Button 
                    variant="outline"
                    onClick={onAddBranch}
                    className="px-4 py-2"
                >
                    Add Branch
                </Button>
                <Button 
                    variant="outline"
                    onClick={onAddLeaf}
                    className="px-4 py-2"
                >
                    Add Leaf
                </Button>
                <Button 
                    variant="outline"
                    onClick={onAddNote}
                    className="px-4 py-2 bg-yellow-50 hover:bg-yellow-100 border-yellow-300"
                    title="Add a sticky note"
                >
                    📝 Add Note
                </Button>
                <Button 
                    variant="outline"
                    onClick={onCenter}
                    className="px-4 py-2 ml-2"
                    title="Center view and reset zoom"
                >
                    Center View
                </Button>
                {canRefresh && onRefresh && (
                    <Button 
                        variant="outline"
                        onClick={onRefresh}
                        className="px-4 py-2 ml-2 bg-amber-50 hover:bg-amber-100 border-amber-300"
                        title="Refresh child ideas of active item"
                    >
                        🔄 Refresh Ideas
                    </Button>
                )}
            </div>
        </div>
    );
};

export default Toolbar;
