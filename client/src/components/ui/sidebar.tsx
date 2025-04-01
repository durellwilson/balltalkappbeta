import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  Home,
  Compass,
  LibraryBig,
  Award,
  Mic2,
  Upload,
  DollarSign,
  Users,
  Shield,
  ShieldCheck,
  UserCog,
  User,
  Settings,
  HelpCircle
} from 'lucide-react';

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const isActive = (path: string) => location === path;
  
  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <nav className="flex-1 px-4 py-6 space-y-1">
        <div className="mb-8">
          <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Main</p>
          
          <NavLink to="/" isActive={isActive("/")} icon={<Home className="h-5 w-5" />} label="Dashboard" />
          <NavLink to="/discover" isActive={isActive("/discover")} icon={<Compass className="h-5 w-5" />} label="Discover" />
          <NavLink to="/library" isActive={isActive("/library")} icon={<LibraryBig className="h-5 w-5" />} label="Library" />
          <NavLink to="/subscriptions" isActive={isActive("/subscriptions")} icon={<Award className="h-5 w-5" />} label="Subscriptions" />
        </div>
        
        {/* Athlete Section - Only visible to athletes */}
        {user?.role === 'athlete' && (
          <div className="mb-8">
            <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Creator Studio</p>
            
            <NavLink to="/studio" isActive={isActive("/studio")} icon={<Mic2 className="h-5 w-5" />} label="Studio" />
            <NavLink to="/uploads" isActive={isActive("/uploads")} icon={<Upload className="h-5 w-5" />} label="Uploads" />
            <NavLink to="/earnings" isActive={isActive("/earnings")} icon={<DollarSign className="h-5 w-5" />} label="Earnings" />
            <NavLink to="/fans" isActive={isActive("/fans")} icon={<Users className="h-5 w-5" />} label="Fans" />
          </div>
        )}
        
        {/* Admin Section - Only visible to admins */}
        {user?.role === 'admin' && (
          <div className="mb-8">
            <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</p>
            
            <NavLink to="/admin/verifications" isActive={isActive("/admin/verifications")} icon={<ShieldCheck className="h-5 w-5" />} label="Verifications" />
            <NavLink to="/admin/content-moderation" isActive={isActive("/admin/content-moderation")} icon={<Shield className="h-5 w-5" />} label="Content Moderation" />
            <NavLink to="/admin/user-management" isActive={isActive("/admin/user-management")} icon={<UserCog className="h-5 w-5" />} label="User Management" />
          </div>
        )}
        
        {/* Account Section */}
        <div>
          <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
          
          <NavLink to="/profile" isActive={isActive("/profile")} icon={<User className="h-5 w-5" />} label="Profile" />
          <NavLink to="/settings" isActive={isActive("/settings")} icon={<Settings className="h-5 w-5" />} label="Settings" />
          <NavLink to="/support" isActive={isActive("/support")} icon={<HelpCircle className="h-5 w-5" />} label="Help & Support" />
        </div>
        
        {/* Athlete Verification Link for Fans */}
        {user?.role === 'fan' && (
          <div className="mt-8">
            <Link href="/athlete-verification">
              <a className="flex items-center px-4 py-3 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark transition-colors">
                <Shield className="mr-2 h-5 w-5" />
                Become an Athlete
              </a>
            </Link>
          </div>
        )}
      </nav>
    </aside>
  );
}

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function NavLink({ to, icon, label, isActive }: NavLinkProps) {
  return (
    <Link href={to}>
      <a className={cn(
        "flex items-center px-2 py-2 mt-1 text-sm font-medium rounded-md",
        isActive 
          ? "bg-primary bg-opacity-10 text-primary dark:text-primary-100" 
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      )}>
        <span className={cn(
          "mr-3",
          isActive ? "text-primary" : "text-gray-400 dark:text-gray-500"
        )}>
          {icon}
        </span>
        {label}
      </a>
    </Link>
  );
}
