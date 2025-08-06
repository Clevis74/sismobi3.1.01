import React, { HTMLAttributes } from 'react';
import { components, utils } from '../../styles/designSystem';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'md',
  dot = false,
  removable = false,
  onRemove,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  };

  const badgeClasses = utils.cn(
    components.badge.base,
    components.badge.variants[variant],
    sizeClasses[size],
    className
  );

  return (
    <span className={badgeClasses} {...props}>
      {dot && (
        <span 
          className={utils.cn(
            'w-1.5 h-1.5 rounded-full mr-1.5',
            variant === 'primary' && 'bg-primary-600',
            variant === 'success' && 'bg-success-600',
            variant === 'warning' && 'bg-warning-600',
            variant === 'error' && 'bg-error-600',
            variant === 'gray' && 'bg-gray-600'
          )}
          aria-hidden="true"
        />
      )}
      
      <span>{children}</span>
      
      {removable && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 inline-flex items-center justify-center w-3 h-3 text-current hover:bg-black hover:bg-opacity-10 rounded-full focus:outline-none focus:ring-1 focus:ring-current"
          aria-label="Remover badge"
        >
          <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
            <path d="M1.41 1.41L6.59 6.59L5.18 8L0 2.82L1.41 1.41ZM6.59 1.41L1.41 6.59L0 5.18L5.18 0L6.59 1.41Z"/>
          </svg>
        </button>
      )}
    </span>
  );
};

// Status Badge específico para propriedades
interface StatusBadgeProps {
  status: 'vacant' | 'rented' | 'maintenance';
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const statusConfig = {
    vacant: { label: 'Vago', variant: 'warning' as const, dot: true },
    rented: { label: 'Ocupado', variant: 'success' as const, dot: true },
    maintenance: { label: 'Manutenção', variant: 'error' as const, dot: true }
  };

  const config = statusConfig[status];

  return (
    <Badge 
      variant={config.variant}
      size={size}
      dot={config.dot}
    >
      {config.label}
    </Badge>
  );
};

// Priority Badge para alertas
interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'critical';
  size?: 'sm' | 'md' | 'lg';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const priorityConfig = {
    low: { label: 'Baixa', variant: 'gray' as const },
    medium: { label: 'Média', variant: 'warning' as const },
    high: { label: 'Alta', variant: 'error' as const },
    critical: { label: 'Crítica', variant: 'error' as const }
  };

  const config = priorityConfig[priority];

  return (
    <Badge 
      variant={config.variant}
      size={size}
    >
      {config.label}
    </Badge>
  );
};