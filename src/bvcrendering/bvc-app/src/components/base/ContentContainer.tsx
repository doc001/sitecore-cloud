// components/ContentContainer.tsx
import React, { ReactNode } from 'react';

interface ContentContainerProps {
  children: ReactNode;
}

/**
 * ContentContainer component that adds 20% horizontal padding
 * Use this to wrap content that needs the horizontal spacing
 * @param children - Content to be rendered with padding
 */
const ContentContainer = ({ children }: ContentContainerProps) => {
  return (
    <div className="w-full px-[10%]">
      {children}
    </div>
  );
};

export default ContentContainer;