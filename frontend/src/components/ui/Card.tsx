import React, { HTMLAttributes, forwardRef } from 'react';
import { components, utils } from '../../styles/designSystem';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  ...props
}, ref) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  const cardClasses = utils.cn(
    components.card.base,
    variant === 'interactive' && components.card.interactive,
    variant === 'elevated' && components.card.elevated,
    hover && 'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200',
    paddingClasses[padding],
    className
  );

  return (
    <div
      ref={ref}
      className={cardClasses}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

// Subcomponentes para estruturação
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  ...props
}) => (
  <div className={utils.cn('flex items-center justify-between mb-4', className)} {...props}>
    <div className="flex-1 min-w-0">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 truncate">
          {title}
        </h3>
      )}
      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">
          {subtitle}
        </p>
      )}
      {children}
    </div>
    {action && (
      <div className="ml-4 flex-shrink-0">
        {action}
      </div>
    )}
  </div>
);

type CardBodyProps = HTMLAttributes<HTMLDivElement>;

export const CardBody: React.FC<CardBodyProps> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={className} {...props}>
    {children}
  </div>
);

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  border?: boolean;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  border = true,
  className = '',
  ...props
}) => (
  <div 
    className={utils.cn(
      'mt-4',
      border && 'pt-4 border-t border-gray-200',
      className
    )} 
    {...props}
  >
    {children}
  </div>
);