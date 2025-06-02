// components/common/Button.tsx
/**
 * Button Component
 * 
 * A reusable button component that supports various styles defined
 * in the design system from globals.css. This component can be used
 * throughout the application for consistency.
 * 
 * The button supports different variants, sizes, and can include
 * Material Icons or other content.
 */

import React from 'react';
import Link from 'next/link';
import { ButtonVariant, SpacingSize } from '@/types';

// Props interface
interface ButtonProps {
  /**
   * Button content
   */
  children: React.ReactNode;
  
  /**
   * Button variant styling
   */
  variant?: ButtonVariant;
  
  /**
   * Optional className for additional styling
   */
  className?: string;
  
  /**
   * URL if the button should act as a link
   */
  href?: string;
  
  /**
   * Material icon name to display before text
   */
  iconBefore?: string;
  
  /**
   * Material icon name to display after text
   */
  iconAfter?: string;
  
  /**
   * Button size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Full width button
   */
  fullWidth?: boolean;
  
  /**
   * Disabled state
   */
  disabled?: boolean;
  
  /**
   * Click handler (if not a link)
   */
  onClick?: () => void;
  
  /**
   * Type attribute (for form submissions)
   */
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = ButtonVariant.PRIMARY,
  className = '',
  href,
  iconBefore,
  iconAfter = '',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
}) => {
  // Base classes that apply to all button variants
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-300 focus:outline-none';
  
  // Size classes
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  
  // Variant classes
  const variantClasses = {
    [ButtonVariant.PRIMARY]: 'bg-blue-100 text-white hover:bg-blue-100/90 active:bg-blue-100/80',
    [ButtonVariant.SECONDARY]: 'bg-neutral-10 text-neutral-80 hover:bg-neutral-20 active:bg-neutral-30',
    [ButtonVariant.GRADIENT_BLUE_PURPLE]: 'bg-gradient-to-r from-purple-100 to-blue-100 text-white hover:shadow-md',
    [ButtonVariant.GRADIENT_PURPLE_RED]: 'bg-gradient-to-r from-purple-100 to-red-100 text-white hover:shadow-md',
    [ButtonVariant.OUTLINE]: 'border-2 border-blue-100 text-blue-100 hover:bg-blue-100/10',
    [ButtonVariant.TEXT]: 'text-blue-100 hover:text-purple-100 bg-transparent',
  };
  
  // Assemble full class list
  const classes = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${fullWidth ? 'w-full' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `;
  
  // Icon elements
  const beforeIconElement = iconBefore ? (
    <span className="material-icon mr-2 text-current">{iconBefore}</span>
  ) : null;
  
  const afterIconElement = iconAfter ? (
    <span className="material-icon ml-2 text-current">{iconAfter}</span>
  ) : null;
  
  // If href is provided, render as a link
  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {beforeIconElement}
        {children}
        {afterIconElement}
      </Link>
    );
  }
  
  // Otherwise render as a button
  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {beforeIconElement}
      {children}
      {afterIconElement}
    </button>
  );
};

export default Button;