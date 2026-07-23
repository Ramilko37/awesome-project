import type { ComponentType, SVGProps } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleEllipsis,
  CloudOff,
  Ellipsis,
  LoaderCircle,
  LocateFixed,
  MoreHorizontal,
  Save,
  Search,
  X,
  XCircle,
} from "lucide-react";

type LucideIcon = ComponentType<SVGProps<SVGSVGElement>>;

const icons = {
  "action.close": X,
  "action.locate": LocateFixed,
  "action.more": Ellipsis,
  "action.save": Save,
  "action.search": Search,
  "navigation.chevron-down": ChevronDown,
  "navigation.chevron-right": ChevronRight,
  "status.error": XCircle,
  "status.info": CircleEllipsis,
  "status.loading": LoaderCircle,
  "status.offline": CloudOff,
  "status.success": CheckCircle2,
  "status.warning": AlertTriangle,
  check: Check,
  more: MoreHorizontal,
} as const satisfies Record<string, LucideIcon>;

export type FortisIconName = keyof typeof icons;

type IconProps = SVGProps<SVGSVGElement> & {
  decorative?: boolean;
  name: FortisIconName;
  size?: number;
};

export function Icon({ decorative = false, name, size = 16, ...props }: IconProps) {
  const Glyph = icons[name];
  return <Glyph aria-hidden={decorative || undefined} focusable="false" height={size} width={size} {...props} />;
}
