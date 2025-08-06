/**
 * 🎨 SISMOBI UI Components - Sistema de Componentes Padronizados
 * Export central de todos os componentes do design system
 */

// Componentes base
export { Button } from './Button';
export { Card, CardHeader, CardBody, CardFooter } from './Card';
export { Badge, StatusBadge, PriorityBadge } from './Badge';
export { Input, Textarea } from './Input';

// Design System
export { default as designSystem, colors, typography, spacing, components, utils } from '../styles/designSystem';

// Tipos e interfaces
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'gray';
export type PropertyStatus = 'vacant' | 'rented' | 'maintenance';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';