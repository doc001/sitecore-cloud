import type { Metadata } from "next";
import DrawerMenu from '@/components/base/DrawerMenu'
import MainLayout from "@/components/layouts/MainLayout";
import CustomFooter from "@/components/base/CustomFooter";
import "./globals.css";

// Import the footer data from JSON
import footerData from "@/data/footerData.json";

export const metadata: Metadata = {
  title: "Home | Bow Valley College",
  description:
    "Discover career-focused programs, flexible learning options, and student support at Bow Valley College. Start your journey toward success today!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Extract the styling properties from the JSON data
  const { styling, ...footerContent } = footerData;

  // Convert socialIconSize to number if it's a string in JSON
  const typedStyling = {
    ...styling,
    socialIconSize:
      typeof styling.socialIconSize === "string"
        ? parseInt(styling.socialIconSize, 10)
        : styling.socialIconSize,
  };

  return (
    <html lang="en">
      <head>
        {/* Basic Material Icons */}
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
          rel="stylesheet"
        />

        {/* Optional: Add these if you need the other variants */}
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Sharp"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Two+Tone"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased w-screen overflow-x-hidden">
          <DrawerMenu />
          <MainLayout>
            {children}
            

            <CustomFooter {...footerContent} {...typedStyling} />
          </MainLayout>
        
      </body>
    </html>
  );
}
