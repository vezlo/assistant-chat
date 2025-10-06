import { THEME } from '@/config/theme';

interface VezloFooterProps {
  size?: 'sm' | 'md';
}

export function VezloFooter({ size = 'md' }: VezloFooterProps) {
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex items-center justify-center gap-2">
      <div 
        className={`${iconSize} rounded-sm flex items-center justify-center`}
        style={{ backgroundColor: THEME.primary.hex }}
      >
        <span className="text-white text-xs font-bold">V</span>
      </div>
      <p className={`${textSize} text-gray-600`}>
        Powered by <span className="font-semibold" style={{ color: THEME.primary.hex }}>Vezlo</span>
      </p>
    </div>
  );
}


