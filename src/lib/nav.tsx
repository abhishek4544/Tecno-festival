import {
  GiftIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  SmartphoneIcon,
  TrophyIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

export type NavIcon = LucideIcon

export type NavItem = {
  title: string
  url: string
  icon: NavIcon
}

export const operationsNav: NavItem[] = [
  { title: "Overview", url: "/admin/dashboard", icon: LayoutDashboardIcon },
  { title: "IMEI Registry", url: "/admin/dashboard/imei-registry", icon: SmartphoneIcon },
  { title: "Participants", url: "/admin/dashboard/participants", icon: UsersIcon },
]

export const rewardsNav: NavItem[] = [
  { title: "Scratch Rewards", url: "/admin/dashboard/scratch-rewards", icon: GiftIcon },
  { title: "Gold Kite Draw", url: "/admin/dashboard/gold-kite-draw", icon: TrophyIcon },
]

export const secondaryNav: NavItem[] = [
  { title: "Campaign Settings", url: "/admin/dashboard/settings", icon: SettingsIcon },
]

export const allNav: NavItem[] = [...operationsNav, ...rewardsNav, ...secondaryNav]

export function findNavByPath(pathname: string): NavItem | undefined {
  const exact = allNav.find((item) => item.url === pathname)
  if (exact) return exact
  return allNav
    .filter((item) => item.url !== "/admin/dashboard" && pathname.startsWith(item.url))
    .sort((a, b) => b.url.length - a.url.length)[0]
}
