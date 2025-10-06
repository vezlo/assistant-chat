import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const heights = {
    sm: 32,
    md: 40,
    lg: 48
  };

  return (
    <Link to="/" className={`inline-block ${className}`}>
      <img 
        src="/assets/vezlo-logo.svg" 
        alt="Vezlo" 
        style={{ height: `${heights[size]}px` }}
        className="inline-block hover:opacity-80 transition-opacity"
      />
    </Link>
  );
}
