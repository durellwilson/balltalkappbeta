import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function Dashboard() {
  // Create a simple landing page
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Welcome to Athlete Sound</h1>
      <p className="mb-4">The premier platform for athletes to share their music and connect with fans.</p>
      
      <div className="flex gap-4 mt-8">
        <Link href="/auth">
          <Button>Sign In</Button>
        </Link>
        <Link href="/discover">
          <Button variant="outline">Discover Music</Button>
        </Link>
      </div>
    </div>
  );
}
