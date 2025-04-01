import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { 
  Home, Music, Headphones, Upload, 
  CreditCard, User, Settings, Disc, 
  Mic, Users, ShieldCheck, LogOut,
  PanelLeft, Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Determine user role for navigation
  const isAthlete = user?.role === 'athlete';
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const navItems = [
    {
      title: 'Dashboard',
      href: '/',
      icon: <Home className="h-5 w-5" />,
      showAlways: true
    },
    {
      title: 'Discover',
      href: '/discover',
      icon: <Disc className="h-5 w-5" />,
      showAlways: true
    },
    {
      title: 'My Library',
      href: '/library',
      icon: <Headphones className="h-5 w-5" />,
      showAlways: true
    },
    {
      title: 'Studio',
      href: '/studio',
      icon: <Mic className="h-5 w-5" />,
      showForAthlete: true
    },
    {
      title: 'My Uploads',
      href: '/uploads',
      icon: <Upload className="h-5 w-5" />,
      showForAthlete: true
    },
    {
      title: 'Earnings',
      href: '/earnings',
      icon: <CreditCard className="h-5 w-5" />,
      showForAthlete: true
    },
    {
      title: 'Athlete Verification',
      href: '/athlete-verification',
      icon: <ShieldCheck className="h-5 w-5" />,
      showForUser: true,
      hideForAthlete: true,
      hideForAdmin: true
    },
    {
      title: 'Subscriptions',
      href: '/subscriptions',
      icon: <Music className="h-5 w-5" />,
      showAlways: true
    },
    {
      title: 'Profile',
      href: '/profile',
      icon: <User className="h-5 w-5" />,
      showAlways: true
    },
  ];

  const adminNavItems = [
    {
      title: 'Verifications',
      href: '/admin/verifications',
      icon: <ShieldCheck className="h-5 w-5" />
    },
    {
      title: 'Content Moderation',
      href: '/admin/content-moderation',
      icon: <Music className="h-5 w-5" />
    },
    {
      title: 'User Management',
      href: '/admin/user-management',
      icon: <Users className="h-5 w-5" />
    }
  ];

  // Filter visible nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (item.showAlways) return true;
    if (item.showForAthlete && isAthlete) return true;
    if (item.showForUser && user && !item.hideForAthlete && !item.hideForAdmin) return true;
    if (item.hideForAthlete && isAthlete) return false;
    if (item.hideForAdmin && isAdmin) return false;
    if (item.showForUser && user) return true;
    return false;
  });

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar toggle */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={toggleSidebar}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Sidebar */}
      <div 
        className={cn(
          "w-64 border-r bg-card p-4 flex flex-col fixed h-full z-40 transition-transform lg:transform-none",
          sidebarOpen ? "transform-none" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white font-bold">
                AS
              </div>
              <h1 className="text-xl font-bold">Athlete Sound</h1>
            </div>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={toggleSidebar}
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto">
          {filteredNavItems.map((item, i) => (
            <Link key={i} href={item.href}>
              <div
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location === item.href
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {item.icon}
                <span>{item.title}</span>
              </div>
            </Link>
          ))}

          {isAdmin && (
            <>
              <Separator className="my-4" />
              <div className="px-3 py-2 text-xs uppercase text-muted-foreground">
                Admin
              </div>
              {adminNavItems.map((item, i) => (
                <Link key={i} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      location === item.href
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </div>
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="mt-6 pt-6 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-3 w-full px-3 py-2 rounded-md hover:bg-accent transition-colors">
                <Avatar className="h-8 w-8">
                  {user?.profileImage && <AvatarImage src={user.profileImage} />}
                  <AvatarFallback>
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium line-clamp-1">{user?.username || 'User'}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role || 'User'}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/subscriptions')}>
                <Music className="h-4 w-4 mr-2" />
                Subscription
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content */}
      <div 
        className={cn(
          "flex-1 transition-all",
          sidebarOpen ? "lg:ml-64" : "ml-0"
        )}
      >
        <main className="h-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}