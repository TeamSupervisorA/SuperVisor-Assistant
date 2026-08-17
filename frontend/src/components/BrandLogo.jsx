import React from 'react';

const BrandLogo = ({ compact = false, className = '', decorative = false }) => {
  const src = compact ? '/supervisor-mark.svg' : '/supervisor-logo-horizontal-dark.svg';
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
