
import React from 'react';
import Navbar from './Navbar';
import { cn } from '@/lib/utils';
import { VERSION } from '@/constants/version';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  className,
  fullWidth = false
}) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className={cn(
        "flex-1 pb-12",
        fullWidth ? "" : "container px-4 sm:px-6 lg:px-8",
        className
      )}>
        {children}
      </main>
      <footer className="border-t py-4 bg-background">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 px-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Tecace Device Manager. All rights reserved.</p>
          <p className="text-xs">Version {VERSION}</p>
        </div>
      </footer>
    </div>
  );
};

export default PageContainer;
