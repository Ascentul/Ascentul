import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Plus, Pencil } from 'lucide-react';

interface AddSectionButtonProps extends ButtonProps {
  label: string;
  mode?: 'add' | 'edit';
  onClick?: () => void;
}

/**
 * A reusable button component for adding or editing sections in the Account Settings
 * Provides consistent styling and icon placement across the application
 */
export function AddSectionButton({
  label,
  mode = 'add',
  onClick,
  className,
  variant = 'secondary',
  ...props
}: AddSectionButtonProps) {
  return (
    <Button 
      onClick={onClick} 
      variant={variant} 
      className={className}
      {...props}
    >
      {mode === 'add' ? (
        <Plus className="mr-1 h-4 w-4" />
      ) : (
        <Pencil className="mr-1 h-4 w-4" />
      )}
      {label}
    </Button>
  );
}