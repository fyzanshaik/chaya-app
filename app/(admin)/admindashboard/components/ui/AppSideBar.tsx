import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, Users, Settings } from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/users", label: "Users", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
]

export default function AppSidebar() {
  const pathname = usePathname()

  return (
    <nav className="space-y-2">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              pathname === item.href ? "bg-muted hover:bg-muted" : "hover:bg-transparent hover:underline",
            )}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </Button>
        </Link>
      ))}
    </nav>
  )
}

