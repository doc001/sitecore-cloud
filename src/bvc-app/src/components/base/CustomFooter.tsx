// components/CustomFooter.tsx
import React from "react";
import Link from "next/link";
import Image from "next/image";
import Icon from "@/components/base/Icon"; // Adjust this path to match your actual Icon component location
import styles from '@/styles/_PathSelectionSection.module.css';

// Import only the social media icons we need from react-icons
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaGithub,
  FaTiktok,
  FaPinterest,
  FaDiscord,
  FaSlack,
} from "react-icons/fa";

import {
  FaXTwitter
} from "react-icons/fa6"

/**
 * Type for rendering social media icons as components
 */
type SocialIconRenderer = (props: { size?: number; className?: string }) => React.ReactNode;

/**
 * Map of social media platform names to their corresponding icon components
 */
const socialIconsMap: {[key: string]: SocialIconRenderer} = {
  facebook: (props) => <FaFacebookF {...props} />,
  twitter: (props) => <FaXTwitter {...props} />,
  instagram: (props) => <FaInstagram {...props} />,
  linkedin: (props) => <FaLinkedinIn {...props} />,
  youtube: (props) => <FaYoutube {...props} />,
  github: (props) => <FaGithub {...props} />,
  tiktok: (props) => <FaTiktok {...props} />,
  pinterest: (props) => <FaPinterest {...props} />,
  discord: (props) => <FaDiscord {...props} />,
  slack: (props) => <FaSlack {...props} />,
};

/**
 * Interface for footer link items
 */
interface FooterLinkItem {
  href: string;
  label: string;
}

/**
 * Interface for footer column configuration
 */
interface FooterColumn {
  title: string;
  links: FooterLinkItem[];
}

/**
 * Interface for social media link items
 */
interface SocialLinkItem {
  href: string;
  label: string;
  iconName: string; // Icon name (either Google icon or social media platform)
  iconType?: string; // "social" or "google"
}

/**
 * Interface for styling options
 */
interface FooterStyling {
  background?: string;
  textColor?: string;
  headingColor?: string;
  linkColor?: string;
  linkHoverColor?: string;
  borderColor?: string;
  containerClassName?: string;
  iconSize?: string;
  iconVariant?: string;
  iconColor?: string;
  socialIconSize?: number | string;
}

/**
 * Props for the CustomFooter component
 */
interface CustomFooterProps {
  logo?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  companyName: string;
  companyDescription?: string;
  columns?: FooterColumn[];
  socialLinks?: SocialLinkItem[];
  contactInfo?: {
    address?: string[];
    email?: string;
    phone?: string[];
  };
  copyrightText: string;
  styling?: FooterStyling;
}

/**
 * Default contact information for Bow Valley College
 */
const defaultContactInfo = {
  address: ["Bow Valley College", "345 - 6 Avenue SE,", "Calgary, AB T2G 4V1"],
  email: "info@bowvalleycollege.ca",
  phone: ["+1 403-410-1400", "1-866-428-2669 (toll free)"]
};

/**
 * Default styling options
 */
const defaultStyling: FooterStyling = {
  background: "bg-[var(--color-neutral-5)]",
  textColor: "text-[var(--color-neutral-80)]",
  headingColor: "text-[var(--color-navy-100)]",
  linkColor: "text-[var(--color-blue-100)]",
  linkHoverColor: "hover:text-[var(--color-orange-100)]",
  borderColor: "border-gray-700",
  iconSize: "lg",
  iconVariant: "outlined",
  iconColor: "text-[var(--color-navy-100)]",
  socialIconSize: 16
  
};

/**
 * A highly customizable footer component with Google Icon and social media icons integration
 */
const CustomFooter: React.FC<CustomFooterProps> = (props) => {
  // Extract and provide default values for all props to prevent undefined errors
  const {
    logo,
    companyName,
    companyDescription,
    columns = [],
    socialLinks = [],
    contactInfo = defaultContactInfo,
    copyrightText,
    styling = defaultStyling
  } = props;

  // Process the styling object with defaults
  // const mergedStyling = { ...defaultStyling, ...styling };
  const mergedStyling = { ...defaultStyling, ...(styling || {}) };
  
  // Handle socialIconSize - convert from string to number if needed
  const socialIconSize = typeof mergedStyling.socialIconSize === 'string' 
    ? parseInt(mergedStyling.socialIconSize as string, 10) 
    : (mergedStyling.socialIconSize as number || 20);

  // Destructure the rest of the styling properties
  const {
    background,
    textColor,
    headingColor,
    linkColor,
    linkHoverColor,
    borderColor,
    containerClassName,
    iconSize,
    iconVariant,
    iconColor
  } = mergedStyling;

  // Validate icon size and variant
  const validIconSizes = ["xs", "sm", "md", "lg", "xl"];
  const validIconVariants = ["filled", "outlined", "round", "sharp", "two-tone"];

  // Ensure icon size is valid, or default to "md"
  const safeIconSize = validIconSizes.includes(iconSize || '')
    ? (iconSize as "xs" | "sm" | "md" | "lg" | "xl")
    : "md";

  // Ensure icon variant is valid, or default to "filled"
  const safeIconVariant = validIconVariants.includes(iconVariant || '')
    ? (iconVariant as "filled" | "outlined" | "round" | "sharp" | "two-tone")
    : "filled";

  /**
   * Render the appropriate icon based on the icon type (social or google)
   */
  const renderIcon = (socialLink: SocialLinkItem) => {
    const { iconName, iconType = "social" } = socialLink;

    if (iconType === "google") {
      // Use the Google Icon component
      return (
        <Icon
          name={iconName}
          variant={safeIconVariant}
          size={safeIconSize}
          color={iconColor}
          className={linkHoverColor?.replace("hover:", "") || ''}
        />
      );
    } else {
      // Use react-icons for social media
      const renderSocialIcon = socialIconsMap[iconName.toLowerCase()];
      if (renderSocialIcon) {
        // Instead of adding color classes to the icon directly, we'll return the icon
        // without color classes - the parent <a> tag will control colors with fill-current
        return renderSocialIcon({
          size: socialIconSize,
          className: "transition-colors duration-200" // Only add transition, no colors
        });
      }
      // Fallback if icon not found
      return <span>{socialLink.label}</span>;
    }
  };

  return (

     <footer className={`${background || 'bg-gray-900'} ${textColor || 'text-gray-300'}`}>
      {/* Colored divider at the top */}
     <div className={`${styles['c-divider__all-colors']} bg-divider-all-colors`}></div>
      <div
        className="container-layout"
      >
        <div className="grid grid-cols-1 gap-0 md:grid-cols-2 lg:grid-cols-3 lg:gap-0">
          {/* Company info section */}
          <div className="mb-6 md:mb-0">
            {logo && (
              <div className="mb-4">
                <Link href="/" className="flex items-center">
                  <Image
                    src={logo.src}
                    alt={logo.alt}
                    width={logo.width}
                    height={logo.height}
                    className="mr-3"
                  />
                </Link>
              </div>
            )}
          </div>

          {/* Connect with us section (using Google Material Icons) */}
          <div>
            <h3 className={`mb-6 text-base font-semibold ${headingColor || 'text-[var(--color-navy-100)]'}`}>
              Connect with us
            </h3>
            <div
              className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3"
            >
              {contactInfo?.address && contactInfo.address.length > 0 && (
                <>
                  <div>
                    <p>
                      <Icon name="location_on" variant={safeIconVariant} size={safeIconSize} color='text-[var(--color-navy-100)]' />
                    </p>
                  </div>
                  <div>
                    <p className="font-sans font-normal pb-7 antialiased">
                      {contactInfo.address.map((line, index) => (
                        <React.Fragment key={index}>
                          {line}<br />
                        </React.Fragment>
                      ))}
                    </p>
                  </div>
                </>
              )}
              
              {contactInfo?.email && (
                <>
                  <div>
                    <p>
                      <Icon name="email" variant={safeIconVariant} size={safeIconSize} color='text-[var(--color-navy-100)]' />
                    </p>
                  </div>
                  <div>
                    <p className="font-sans font-normal pb-7 antialiased">
                      <a 
                        href={`mailto:${contactInfo.email}?subject=Information%20request`}
                        className={`font-sans font-normal pb-7 antialiased ${linkColor || ''} ${linkHoverColor || ''}`}
                      >
                        {contactInfo.email}
                      </a>
                    </p>
                  </div>
                </>
              )}
              
              {contactInfo?.phone && contactInfo.phone.length > 0 && (
                <>
                  <div>
                    <p>
                      <Icon name="call" variant={safeIconVariant} size={safeIconSize} color='text-[var(--color-navy-100)]' />
                    </p>
                  </div>
                  <div>
                    {contactInfo.phone.map((phoneNumber, index) => (
                      <p key={index} className="font-sans font-normal antialiased">{phoneNumber}</p>
                    ))}
                    <p className="pb-7"></p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Follow us section (using React Icons) */}
          <div>
            <h3 className={`mb-6 text-base font-semibold ${headingColor || 'text-[var(--color-navy-100)]'}`}>
              Follow us
            </h3>
            {/* Social links with appropriate icons */}
            {socialLinks && socialLinks.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-5">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className={`${linkColor || ''} ${linkHoverColor || ''} text-[var(--color-navy-100)] flex items-center justify-center transition-colors duration-200`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                  >
                    {renderIcon(social)}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Copyright section */}
        <div className="mt-8 pt-8">
          <div className="text-sm sm:flex sm:items-center sm:justify-between">
            <div>{copyrightText}</div>
            <div className="mt-4 sm:mt-0">
              <Link
                href="/cookie-policy"
                className={`mr-4 ${linkColor || ''} ${linkHoverColor || ''}`}
              >
                Cookie Policy
              </Link>
              <Link
                href="/privacy"
                className={`mr-4 ${linkColor || ''} ${linkHoverColor || ''}`}
              >
                Privacy Policy
              </Link>
              <Link
                href="/compliance"
                className={`${linkColor || ''} ${linkHoverColor || ''}`}
              >
                Compliance
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>

     
  );
};

export default CustomFooter;