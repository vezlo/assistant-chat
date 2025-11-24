import { Zap } from 'lucide-react';

interface VezloFooterProps {
  size?: 'sm' | 'md';
}

export function VezloFooter({ size = 'sm' }: VezloFooterProps) {
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const logoHeight = size === 'sm' ? 48 : 68;
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const gapClass = 'gap-1';

  return (
    <div className={`flex items-center justify-center ${gapClass}`}>
      <span className={`${textSize} text-gray-600 font-medium`}>Powered by</span>
      <Zap className={`${iconSize} flex-shrink-0 -mr-1`} style={{ color: '#f5c518' }} />
      <img 
        src="/assets/vezlo.png" 
        alt="Vezlo" 
        style={{ height: `${logoHeight}px`, width: 'auto' }}
        className="object-contain"
      />
    </div>
  );
}


