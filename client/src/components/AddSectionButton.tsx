import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Plus, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddSectionButtonProps extends ButtonProps {
  label: string;
  mode?: 'add' | 'edit';
  onClick?: () => void;
}

/**
 * A reusable button component for adding or editing sections in the Account Settings
 * Provides consistent styling and icon placement across the application with fixed width
 * and the brand blue color for visual consistency across sections.
 */
export function AddSectionButton({
  label,
  mode = 'add',
  onClick,
  className,
  variant = 'default',
  ...props
}: AddSectionButtonProps) {
  // Use fixed width (150px) with brand blue color (#0c29ab) for consistency
  const buttonStyles = cn(
    "w-[150px] bg-[#0c29ab] text-white font-medium text-sm px-4 py-2 rounded-md",
    "flex items-center justify-center gap-2 hover:bg-[#09207e] transition min-h-[40px]",
    className
  );

  return (
    <Button 
      onClick={onClick} 
      variant={variant === 'secondary' ? 'default' : variant} // Override secondary to always use default styling
      className={buttonStyles}
      {...props}
    >
      {mode === 'add' ? (
        <Plus className="h-4 w-4" />
      ) : (
        <Pencil className="h-4 w-4" />
      )}
      <span>{label}</span>
    </Button>
  );
}