// components/Icon.tsx
import React from 'react';

type IconVariant = 'filled' | 'outlined' | 'round' | 'sharp' | 'two-tone';
type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IconProps {
  name: string;
  variant?: IconVariant;
  size?: IconSize;
  color?: string;
  className?: string;
  onClick?: () => void;
}

const Icon: React.FC<IconProps> = ({
  name,
  variant = 'filled',
  size = 'md',
  color = '',
  className = '',
  onClick,
}) => {
  // Map variant to font family class
  const variantMap: Record<IconVariant, string> = {
    filled: 'material-icon',
    outlined: 'material-icon-outlined',
    round: 'material-icon-round',
    sharp: 'material-icon-sharp',
    'two-tone': 'material-icon-two-tone',
  };

  // Map size to size class
  const sizeMap: Record<IconSize, string> = {
    xs: 'icon-xs',
    sm: 'icon-sm',
    md: 'icon-md',
    lg: 'icon-lg',
    xl: 'icon-xl',
  };

  const variantClass = variantMap[variant];
  const sizeClass = sizeMap[size];

  return (
    <span
      className={`${variantClass} ${sizeClass} ${color} icon-align ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {name}
    </span>
  );
};

export default Icon;