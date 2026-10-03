import type { ComponentType, SVGProps } from "react"
import { CentralIcon } from "@central-icons-react/all"
import type { CentralIconName } from "@central-icons-react/all/icons"

export type NavIcon = ComponentType<SVGProps<SVGSVGElement>>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CentralIconAny = CentralIcon as any

const makeIcon = (name: CentralIconName): NavIcon =>
  function Icon(props: SVGProps<SVGSVGElement>) {
    return (
      <CentralIconAny
        name={name}
        join="round"
        fill="outlined"
        stroke="1.5"
        radius="1"
        {...props}
      />
    )
  }

export type NavItem = {
  title: string
  url: string
  icon: NavIcon
}

export const operationsNav: NavItem[] = [
  { title: "Overview", url: "/admin/dashboard", icon: makeIcon("IconLayoutDashboard") },
  { title: "IMEI Registry", url: "/admin/dashboard/imei-registry", icon: makeIcon("IconPhone") },
  { title: "Participants", url: "/admin/dashboard/participants", icon: makeIcon("IconPeople") },
]

export const rewardsNav: NavItem[] = [
  { title: "Scratch Rewards", url: "/admin/dashboard/scratch-rewards", icon: makeIcon("IconGift1") },
  { title: "Gold Kite Draw", url: "/admin/dashboard/gold-kite-draw", icon: makeIcon("IconTrophy") },
]

export const secondaryNav: NavItem[] = [
  { title: "Campaign Settings", url: "/admin/dashboard/settings", icon: makeIcon("IconSettingsGear1") },
]

export const allNav: NavItem[] = [...operationsNav, ...rewardsNav, ...secondaryNav]

export function findNavByPath(pathname: string): NavItem | undefined {
  const exact = allNav.find((item) => item.url === pathname)
  if (exact) return exact
  return allNav
    .filter((item) => item.url !== "/admin/dashboard" && pathname.startsWith(item.url))
    .sort((a, b) => b.url.length - a.url.length)[0]
}
