import {
  CheckCircle2,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CloudOff,
  Ellipsis,
  LoaderCircle,
  Menu,
  Save,
  Search,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import type { SVGAttributes } from "react";

const iconMap = {
  "action.close": X,
  "action.confirm": Check,
  "action.more": Ellipsis,
  "action.save": Save,
  "action.search": Search,
  "navigation.menu": Menu,
  "navigation.chevronDown": ChevronDown,
  "navigation.chevronRight": ChevronRight,
  "status.error": CircleAlert,
  "status.loading": LoaderCircle,
  "status.offline": CloudOff,
  "status.success": CheckCircle2,
  "status.warning": TriangleAlert,
} satisfies Record<string, LucideIcon>;

export type FortisIconName = keyof typeof iconMap;

export interface IconProps extends Omit<SVGAttributes<SVGSVGElement>, "children"> {
  decorative?: boolean;
  label?: string;
  name: FortisIconName;
  size?: number;
  strokeWidth?: number;
}

export function Icon({ decorative, label, name, size = 18, strokeWidth = 1.8, ...props }: IconProps) {
  const IconComponent = iconMap[name];
  const isDecorative = decorative ?? !label;

  return (
    <IconComponent
      aria-hidden={isDecorative || undefined}
      aria-label={isDecorative ? undefined : label}
      focusable="false"
      role={isDecorative ? undefined : "img"}
      size={size}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
}
