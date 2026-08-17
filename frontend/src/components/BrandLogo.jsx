import React from 'react';
import { useTheme } from '../hooks/useTheme';

const BrandLogo = ({ compact = false, className = '', decorative = false }) => {
  const { isDark } = useTheme();
  const src = compact
    ? '/supervisor-mark.svg'
    : isDark
      ? '/supervisor-logo-horizontal-dark.svg'
      : '/supervisor-logo-horizontal-light.svg';
  const alt = 'Supervisor Assistant';

  return (
    <img
      src={src}
      alt={decorative ? '' : alt}
      aria-hidden={decorative || undefined}
      className={className}
      draggable="false"
    />
  );
};

export default BrandLogo;
