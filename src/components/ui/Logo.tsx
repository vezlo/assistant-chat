import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const heights = {
    sm: 56,
    md: 72,
    lg: 92,
  } as const;

  return (
    <Link to="/" className={`inline-flex items-center ${className}`} style={{ lineHeight: 0 }}>
      <img
        src="/assets/vezlo.png"
        alt="Vezlo"
        style={{
          height: `${heights[size]}px`,
          width: 'auto',
          display: 'block',
        }}
        className="hover:opacity-90 transition-opacity"
      />
    </Link>
  );
}
