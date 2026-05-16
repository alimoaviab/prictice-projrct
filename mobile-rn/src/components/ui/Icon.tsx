/**
 * Tiny icon set — we render outline-style icons via react-native-svg so no
 * font/asset bundling is needed. Each icon is a Stroke-based path so it
 * scales crisply at any size and recolours via the `color` prop.
 *
 * Add new icons by appending to the `paths` map.
 */

import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

export type IconName =
  | 'home'
  | 'users'
  | 'graduation'
  | 'family'
  | 'calendar'
  | 'check-circle'
  | 'clipboard'
  | 'book'
  | 'megaphone'
  | 'video'
  | 'wallet'
  | 'settings'
  | 'logout'
  | 'mail'
  | 'lock'
  | 'eye'
  | 'eye-off'
  | 'arrow-right'
  | 'chevron-right'
  | 'plus'
  | 'bell'
  | 'sparkles'
  | 'shield'
  | 'chart'
  | 'clock'
  | 'star';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({
  name,
  size = 20,
  color = colors.gray700,
  strokeWidth = 1.8,
}: IconProps) {
  const common = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {renderPath(name, common)}
    </Svg>
  );
}

function renderPath(name: IconName, p: object): React.ReactNode {
  switch (name) {
    case 'home':
      return <Path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" {...p} />;
    case 'users':
      return (
        <>
          <Circle cx={9} cy={8} r={4} {...p} />
          <Path d="M2 21c.7-4 3.6-6 7-6s6.3 2 7 6" {...p} />
          <Circle cx={17} cy={6} r={3} {...p} />
          <Path d="M22 18c-.4-2.3-1.9-3.7-4-4.2" {...p} />
        </>
      );
    case 'graduation':
      return (
        <>
          <Path d="M22 10 12 4 2 10l10 6z" {...p} />
          <Path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" {...p} />
        </>
      );
    case 'family':
      return (
        <>
          <Circle cx={8} cy={7} r={3} {...p} />
          <Circle cx={16} cy={7} r={3} {...p} />
          <Path d="M3 21c.7-4 2.7-6 5-6s4.3 2 5 6" {...p} />
          <Path d="M11 21c.7-4 2.7-6 5-6s4.3 2 5 6" {...p} />
        </>
      );
    case 'calendar':
      return (
        <>
          <Rect x={3} y={5} width={18} height={16} rx={2} {...p} />
          <Path d="M3 10h18M8 3v4M16 3v4" {...p} />
        </>
      );
    case 'check-circle':
      return (
        <>
          <Circle cx={12} cy={12} r={9} {...p} />
          <Path d="m8.5 12 2.5 2.5L15.5 10" {...p} />
        </>
      );
    case 'clipboard':
      return (
        <>
          <Rect x={5} y={4} width={14} height={17} rx={2} {...p} />
          <Path d="M9 4h6v3H9zM9 12h6M9 16h4" {...p} />
        </>
      );
    case 'book':
      return <Path d="M4 4v16a2 2 0 0 0 2 2h12V4H6a2 2 0 0 0-2 2zM6 4v16" {...p} />;
    case 'megaphone':
      return (
        <>
          <Path d="M3 11v2a3 3 0 0 0 3 3h1l4 4V4l-4 4H6a3 3 0 0 0-3 3z" {...p} />
          <Path d="M14 8a4 4 0 0 1 0 8" {...p} />
        </>
      );
    case 'video':
      return (
        <>
          <Rect x={2} y={6} width={14} height={12} rx={2} {...p} />
          <Path d="M22 8 16 12l6 4z" {...p} />
        </>
      );
    case 'wallet':
      return (
        <>
          <Rect x={3} y={6} width={18} height={14} rx={2} {...p} />
          <Path d="M3 10h18M17 14h.01" {...p} />
        </>
      );
    case 'settings':
      return (
        <>
          <Circle cx={12} cy={12} r={3} {...p} />
          <Path d="M19.4 15a7.5 7.5 0 0 0 .1-1.5 7.5 7.5 0 0 0-.1-1.5l2-1.5-2-3.5-2.4 1a7.5 7.5 0 0 0-2.6-1.5L14 4h-4l-.4 2.5a7.5 7.5 0 0 0-2.6 1.5l-2.4-1-2 3.5 2 1.5a7.5 7.5 0 0 0-.1 1.5 7.5 7.5 0 0 0 .1 1.5l-2 1.5 2 3.5 2.4-1a7.5 7.5 0 0 0 2.6 1.5L10 22h4l.4-2.5a7.5 7.5 0 0 0 2.6-1.5l2.4 1 2-3.5z" {...p} />
        </>
      );
    case 'logout':
      return (
        <>
          <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" {...p} />
        </>
      );
    case 'mail':
      return (
        <>
          <Rect x={3} y={5} width={18} height={14} rx={2} {...p} />
          <Path d="m3 7 9 6 9-6" {...p} />
        </>
      );
    case 'lock':
      return (
        <>
          <Rect x={5} y={11} width={14} height={10} rx={2} {...p} />
          <Path d="M8 11V8a4 4 0 0 1 8 0v3" {...p} />
        </>
      );
    case 'eye':
      return (
        <>
          <Path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" {...p} />
          <Circle cx={12} cy={12} r={3} {...p} />
        </>
      );
    case 'eye-off':
      return (
        <>
          <Path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4 4M9.9 5.1A10.7 10.7 0 0 1 12 5c6 0 10 7 10 7a16.4 16.4 0 0 1-3.4 4.1M6.6 6.6A16.4 16.4 0 0 0 2 12s4 7 10 7c1.3 0 2.5-.3 3.6-.7" {...p} />
        </>
      );
    case 'arrow-right':
      return <Path d="M5 12h14M13 5l7 7-7 7" {...p} />;
    case 'chevron-right':
      return <Path d="m9 6 6 6-6 6" {...p} />;
    case 'plus':
      return <Path d="M12 5v14M5 12h14" {...p} />;
    case 'bell':
      return (
        <>
          <Path d="M6 18V11a6 6 0 0 1 12 0v7l1.5 2h-15z" {...p} />
          <Path d="M10 22a2 2 0 0 0 4 0" {...p} />
        </>
      );
    case 'sparkles':
      return (
        <>
          <Path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.5 5.5l4 4M14.5 14.5l4 4M5.5 18.5l4-4M14.5 9.5l4-4" {...p} />
        </>
      );
    case 'shield':
      return <Path d="M12 22s8-4 8-10V6l-8-3-8 3v6c0 6 8 10 8 10z" {...p} />;
    case 'chart':
      return (
        <>
          <Path d="M3 21h18M6 17v-6M12 17V7M18 17v-9" {...p} />
        </>
      );
    case 'clock':
      return (
        <>
          <Circle cx={12} cy={12} r={9} {...p} />
          <Path d="M12 7v5l3 2" {...p} />
        </>
      );
    case 'star':
      return <Path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z" {...p} />;
    default:
      return null;
  }
}
