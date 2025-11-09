'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

interface CreateIdeaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: 'branch' | 'leaf';
  onSubmit: (data: { label: string; context: string }) => void;
}

export const CreateIdeaForm: React.FC<CreateIdeaFormProps> = ({
  open,
  onOpenChange,
  itemType,
  onSubmit,
}) => {
  const [label, setLabel] = useState('');
  const [context, setContext] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    onSubmit({ label, context });
    setLabel('');
    setContext('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New {itemType === 'branch' ? 'Branch' : 'Leaf'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="idea-label" className="text-right">
                Idea
              </label>
              <Input
                id="idea-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="col-span-3"
                placeholder={itemType === 'branch' ? 'E.g., A new marketing strategy' : 'E.g., What if we targeted a new audience?'}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="idea-context" className="text-right">
                Context
              </label>
              <textarea
                id="idea-context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="col-span-3 w-full text-sm rounded-md border border-gray-200 bg-gray-50/50 px-2 py-1.5 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none"
                rows={3}
                placeholder="Optional: Add tone, constraints, or direction..."
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
