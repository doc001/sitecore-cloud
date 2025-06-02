// components/MainLayout.tsx
import React, { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

/**
 * MainLayout component that spans 100% of the viewport
 * @param children - Content to be rendered inside the layout
 */
const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen w-full bg-white">
      {children}
    </div>
  );
};

export default MainLayout;