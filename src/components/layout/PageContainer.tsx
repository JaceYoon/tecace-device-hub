
import React from 'react';
import Navbar from './Navbar';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  title?: string; // Added title prop
}

const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  className,
  fullWidth = false,
  title
}) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className={cn(
        "flex-1 pb-12",
        fullWidth ? "" : "container px-4 sm:px-6 lg:px-8",
        className
      )}>
        {title && (
          <div className="my-6">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          </div>
        )}
        {children}
      </main>
      <footer className="border-t py-4 bg-background">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 px-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Tecace Device Manager. All rights reserved.</p>
          <p className="text-xs">Version 1.0.0</p>
        </div>
      </footer>
    </div>
  );
};

export default PageContainer;
