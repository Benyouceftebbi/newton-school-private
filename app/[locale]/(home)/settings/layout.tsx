
import { Separator } from "@/components/ui/separator"
import { SidebarNav } from "./components/sidebar-nav"
import { useTranslations } from "next-intl"
import { unstable_setRequestLocale } from "next-intl/server";
const locales = ['en', 'ar'];
 
export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}
const sidebarNavItems = [
  {
    title: "Profile",
    href: "/settings",
  },
   {
    title: "Action History",
    href: "/settings/history",
  },
]

interface SettingsLayoutProps {
  children: React.ReactNode,
  params: {locale: string};
}

export default function SettingsLayout({ children , params: {locale}}: SettingsLayoutProps) {
  unstable_setRequestLocale(locale);
  const t=useTranslations()
  return (

      <div className=" space-y-6 p-10 pb-16 md:block">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">{t('settings')}</h2>
          <p className="text-muted-foreground">
            {t('manage-your-account-settings-and-set-e-mail-preferences')} </p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1 w-full">{children}</div>
        </div>
      </div>

  )
}
