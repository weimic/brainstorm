import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import IdeaCard from './IdeaCard';

interface LeafProps {
    label: string;
    onChange?: (label: string) => void;
    className?: string;
    extraContext?: string;
    onExtraContextChange?: (value: string) => void;
    onGenerateMore?: () => void;
    isGenerating?: boolean;
    isActive?: boolean;
}

const Leaf: React.FC<LeafProps> = ({ 
	label, 
	onChange, 
	className,
	extraContext,
	onExtraContextChange,
	onGenerateMore,
	isGenerating,
	isActive,
}) => {
	return (
		<IdeaCard
			label={label}
			onLabelChange={(newLabel) => onChange?.(newLabel)}
			className={cn("border-emerald-200/70", className)}
			titleClassName="text-emerald-900 placeholder:text-emerald-700/60"
			extraContext={extraContext}
			onExtraContextChange={onExtraContextChange}
			onGenerateMore={onGenerateMore}
			isGenerating={isGenerating}
			isActive={isActive}
			editable={false} // Titles are not editable directly on the card
		/>
	);
};

export default Leaf;