// types/footer.ts
export interface FooterData {
    companyName: string;
    companyDescription?: string;
    logo?: {
      src: string;
      alt: string;
      width: number;
      height: number;
    };
    columns: {
      title: string;
      links: {
        href: string;
        label: string;
      }[];
    }[];
    socialLinks: {
      href: string;
      label: string;
      iconName: string; // Google icon name
    }[];
    copyrightText: string;
    styling: {
      background?: string;
      textColor?: string;
      linkColor?: string;
      linkHoverColor?: string;
      borderColor?: string;
      containerClassName?: string;
      iconSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
      iconVariant?: 'filled' | 'outlined' | 'round' | 'sharp' | 'two-tone';
      iconColor?: string;
    };
  }