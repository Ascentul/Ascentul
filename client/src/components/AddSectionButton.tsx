import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Plus, Pencil, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddSectionButtonProps extends ButtonProps {
  label: string;
  mode?: 'add' | 'edit';
  onClick?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

/**
 * A standardized primary action button component used across the Account Settings
 * Provides consistent styling and icon placement for all primary actions 
 * with fixed width and brand blue color for visual hierarchy.
 * 
 * Accessibility features:
 * - Proper focus states
 * - Aria labels
 * - Loading states
 * - Disabled states
 */
export function AddSectionButton({
  label,
  mode = 'add',
  onClick,
  className,
  variant = 'default',
  isLoading = false,
  disabled = false,
  ...props
}: AddSectionButtonProps) {
  // Standard styling with fixed width (150px) and brand blue color (#0c29ab) 
  const buttonStyles = cn(
    "w-[150px] bg-[#0c29ab] text-white font-medium text-sm px-4 py-2 rounded-md",
    "flex items-center justify-center gap-2 hover:bg-[#09207e] transition-colors",
    "min-h-[40px] focus:ring-2 focus:ring-offset-2 focus:ring-[#0c29ab] focus:outline-none",
    disabled && "opacity-50 cursor-not-allowed hover:bg-[#0c29ab]",
    className
  );

  return (
    <Button 
      onClick={onClick} 
      variant={variant === 'secondary' ? 'default' : variant} // Override secondary to always use default styling
      className={buttonStyles}
      disabled={disabled || isLoading}
      aria-label={label}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        mode === 'add' ? (
          <Plus className="h-4 w-4" />
        ) : (
          <Pencil className="h-4 w-4" />
        )
      )}
      <span>{label}</span>
    </Button>
  );
}