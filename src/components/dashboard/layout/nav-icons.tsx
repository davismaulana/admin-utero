import { FileTextIcon, PaintBrushIcon, SignpostIcon, Sparkle, StorefrontIcon, TagIcon } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react/dist/lib/types";
import { ChartPieIcon } from "@phosphor-icons/react/dist/ssr/ChartPie";
import { GearSixIcon } from "@phosphor-icons/react/dist/ssr/GearSix";
import { PlugsConnectedIcon } from "@phosphor-icons/react/dist/ssr/PlugsConnected";
import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";
import { UsersIcon } from "@phosphor-icons/react/dist/ssr/Users";
import { XSquare } from "@phosphor-icons/react/dist/ssr/XSquare";

export const navIcons = {
	"chart-pie": ChartPieIcon,
	"gear-six": GearSixIcon,
	"plugs-connected": PlugsConnectedIcon,
	"x-square": XSquare,
	user: UserIcon,
	users: UsersIcon,

	tag: TagIcon,
	storefront: StorefrontIcon,
	"file-text": FileTextIcon,
	"paint-brush": PaintBrushIcon,
	signpost: SignpostIcon,
	sparkles: Sparkle,
} as Record<string, Icon>;
