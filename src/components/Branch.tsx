import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import IdeaCard from './IdeaCard';

interface BranchProps {
  label: string;
  onChange?: (label: string) => void;
  className?: string;
  extraContext?: string;
  onExtraContextChange?: (value: string) => void;
  onGenerateMore?: () => void;
  isGenerating?: boolean;
  isActive?: boolean;
}

const Branch: React.FC<BranchProps> = ({ 
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
      style={{ minWidth: 260, maxWidth: 380 }}
      className={cn('border-amber-200/70', className)}
      titleClassName="text-amber-900 placeholder:text-amber-800/60"
      extraContext={extraContext}
      onExtraContextChange={onExtraContextChange}
      onGenerateMore={onGenerateMore}
      isGenerating={isGenerating}
      isActive={isActive}
      editable={false} // Titles are not editable directly on the card
    />
  );
};

export default Branch;
