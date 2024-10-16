"use client"
import { Link } from "@/navigation"
import { CircleUser, Menu, SchoolIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ModeToggle } from "../(home)/dashboard/components/theme-mode"
import { usePathname } from "@/navigation"
import { useTranslations } from "next-intl"
import LocaleSwitcher from "@/components/LocaleSwitcher"
import { signOut } from "@/lib/auth"
import { useUser } from "@/lib/auth";

export default function Header() {
  const pathname = usePathname()
  const user = useUser(); // Get the user's role
  const t = useTranslations()

  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <SchoolIcon className="h-6 w-6" />
          <span className="sr-only">Acme Inc</span>
        </Link>
        <Link
          href="/dashboard"
          className={`${
            pathname === '/dashboard'
              ? 'text-black-500 dark:text-white'
              : 'text-muted-foreground hover:text-foreground transition-colors'
          }`}
        >
          {t('dashboard')}
        </Link>
        <Link
          href="/calendar"
          className={`${
            pathname === '/calendar'
              ? 'text-black-500 dark:text-white'
              : 'text-muted-foreground hover:text-foreground transition-colors'
          }`}
        >
          {t('calendar')}
        </Link>
        <Link
          href="/students"
          className={`${
            pathname === '/students' ? 'text-black-500 dark:text-white' : 'text-muted-foreground hover:text-foreground transition-colors'
          }`}
        >
          {t('Students')}
        </Link>
{user.role === null && (
  <Link
    href="/teachers"
    className={`${
      pathname === '/teachers' 
        ? 'text-black-500 dark:text-white' 
        : 'text-muted-foreground hover:text-foreground transition-colors'
    }`}
  >
    {t('teachers-0')}
  </Link>
)}
        <Link
          href="/classes"
          className={`${
            pathname === '/classes' ? 'text-black-500 dark:text-white' : 'text-muted-foreground hover:text-foreground transition-colors'
          }`}
        >
          {t('Classes')}
        </Link>
            <Link
          href="/billing"
          className={`${pathname=== '/billing' ?'text-black-500 dark:text-white ' : 'text-muted-foreground hover:text-foreground foreground transition-colors'}`}
         >
          {t('billing')} </Link>


          {user.role === null && (
            <Link
              href="/settings"
              className={`${
                pathname === '/settings' ? 'text-black-500 dark:text-white' : 'text-muted-foreground hover:text-foreground transition-colors'
              }`}
            >
              {t('settings')}
            </Link>
       
        )}
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">{t('toggle-navigation-menu')}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg font-medium">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
              <SchoolIcon className="h-6 w-6" />
              <span className="sr-only">Acme Inc</span>
            </Link>
            <Link
              href="/dashboard"
              className={`${
                pathname === '/dashboard' ? 'text-black-500 dark:text-white' : 'text-muted-foreground hover:text-foreground transition-colors'
              }`}
            >
              {t('dashboard')}
            </Link>
            <Link
              href="/calendar"
              className={`${
                pathname === '/calendar' ? 'text-black-500 dark:text-white' : 'text-muted-foreground hover:text-foreground transition-colors'
              }`}
            >
              {t('calendar')}
            </Link>
            <Link
              href="/students"
              className={`${
                pathname === '/students' ? 'text-black-500 dark:text-white' : 'text-muted-foreground hover:text-foreground transition-colors'
              }`}
            >
              {t('Students')}
            </Link>

            <Link
          href="/billing"
          className={`${pathname=== '/billing' ?'text-black-500 dark:text-white ' : 'text-muted-foreground hover:text-foreground foreground transition-colors'}`}
          >
          {t('billing')} </Link>

            {/* Conditionally render the Teachers and Settings links if the role is not null */}
            {user.role === null && (
              <>
                <Link
                  href="/teachers"
                  className={`${
                    pathname === '/teachers' ? 'text-black-500 dark:text-white' : 'text-muted-foreground hover:text-foreground transition-colors'
                  }`}
                >
                  {t('teachers-0')}
                </Link>
                <Link
                  href="/settings"
                  className={`${
                    pathname === '/settings' ? 'text-black-500 dark:text-white' : 'text-muted-foreground hover:text-foreground transition-colors'
                  }`}
                >
                  {t('settings')}
                </Link>
              </>
            )}
                <Link
          href="/classes"
          className={`${
            pathname === '/classes' ? 'text-black-500 dark:text-white' : 'text-muted-foreground hover:text-foreground transition-colors'
          }`}
        >
          {t('classes')}
        </Link>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Other UI components */}
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form className="ml-auto flex-1 sm:flex-initial">
          {/* Search form goes here */}
        </form>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <CircleUser className="h-5 w-5" />
              <span className="sr-only">{t('toggle-user-menu')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('my-account')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{t('settings')}</DropdownMenuItem>
            <DropdownMenuItem>{t('support')}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>{t('logout')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ModeToggle />
        <LocaleSwitcher />
      </div>
    </header>
  )
}