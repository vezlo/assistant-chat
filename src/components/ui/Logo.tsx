import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const heights = {
    sm: 44,
    md: 56,
    lg: 68
  };
  const offsets = {
    sm: -3,
    md: -5,
    lg: -6,
  };
  const scale = 1.5;

  return (
    <Link to="/" className={`inline-flex items-center h-full ${className}`} style={{ lineHeight: 0 }}>
      <div className="h-full flex items-center overflow-hidden" style={{ maxHeight: `${heights[size]}px` }}>
        <img 
          src="/assets/vezlo.png" 
          alt="Vezlo" 
          style={{ 
            height: `${scale * 100}%`,
            width: 'auto', 
            transform: `translateX(${offsets[size]}px) translateY(-2px)`
          }}
          className="block hover:opacity-90 transition-opacity"
        />
      </div>
    </Link>
  );
}
