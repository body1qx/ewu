import { Outlet } from 'react-router-dom';
import Header from '@/components/common/Header';

export default function MainAppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="min-h-[calc(100vh-64px)]">
        <Outlet />
      </main>
    </div>
  );
}
