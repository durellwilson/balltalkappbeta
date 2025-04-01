import { Link, useLocation } from 'wouter';
import { Home, Compass, LibraryBig, PlusCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileNav() {
  const [location] = useLocation();
  
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-10">
      <div className="flex justify-around">
        <NavItem to="/" icon={<Home />} label="Home" isActive={location === '/'} />
        <NavItem to="/discover" icon={<Compass />} label="Discover" isActive={location === '/discover'} />
        <NavItem to="/uploads" icon={<PlusCircle />} label="Upload" isActive={location === '/uploads'} />
        <NavItem to="/library" icon={<LibraryBig />} label="Library" isActive={location === '/library'} />
        <NavItem to="/profile" icon={<User />} label="Profile" isActive={location === '/profile'} />
      </div>
    </nav>
  );
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function NavItem({ to, icon, label, isActive }: NavItemProps) {
  return (
    <Link href={to}>
      <a className={cn(
        "flex flex-col items-center justify-center w-full pt-2 pb-1",
        isActive ? "text-primary" : "text-gray-500 dark:text-gray-400"
      )}>
        {icon}
        <span className="text-xs mt-1">{label}</span>
      </a>
    </Link>
  );
}
