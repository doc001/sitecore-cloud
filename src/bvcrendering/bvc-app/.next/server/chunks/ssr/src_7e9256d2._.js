module.exports = {

"[project]/src/styles/_HeroHomeSection.module.css [app-ssr] (css module)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v({
  "animated-text": "_HeroHomeSection-module__GRa2va__animated-text",
  "background-video": "_HeroHomeSection-module__GRa2va__background-video",
  "button-animated": "_HeroHomeSection-module__GRa2va__button-animated",
  "c-bottom__spacer": "_HeroHomeSection-module__GRa2va__c-bottom__spacer",
  "c-button__transparent": "_HeroHomeSection-module__GRa2va__c-button__transparent",
  "c-grid": "_HeroHomeSection-module__GRa2va__c-grid",
  "c-hero__home": "_HeroHomeSection-module__GRa2va__c-hero__home",
  "c-message": "_HeroHomeSection-module__GRa2va__c-message",
  "fadeIn": "_HeroHomeSection-module__GRa2va__fadeIn",
  "fadeInUp": "_HeroHomeSection-module__GRa2va__fadeInUp",
  "overlay": "_HeroHomeSection-module__GRa2va__overlay",
  "video-container": "_HeroHomeSection-module__GRa2va__video-container",
  "white-font": "_HeroHomeSection-module__GRa2va__white-font",
  "xxl": "_HeroHomeSection-module__GRa2va__xxl",
  "xxxl": "_HeroHomeSection-module__GRa2va__xxxl",
  "youtube-container": "_HeroHomeSection-module__GRa2va__youtube-container",
  "youtube-iframe": "_HeroHomeSection-module__GRa2va__youtube-iframe",
});
}}),
"[project]/src/types/index.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// types/index.ts
/**
 * Shared Types
 * 
 * This file contains TypeScript interfaces and types that are shared
 * across multiple components for consistency and reusability.
 */ /**
 * ProgramLink
 * Represents a link to a program or program-related page
 */ __turbopack_context__.s({
    "ButtonVariant": (()=>ButtonVariant),
    "COMMON_APPLICATION_STEPS": (()=>COMMON_APPLICATION_STEPS),
    "ColorVariant": (()=>ColorVariant),
    "GradientType": (()=>GradientType),
    "HeadingLevel": (()=>HeadingLevel),
    "PROFILE_INFO_MAP": (()=>PROFILE_INFO_MAP),
    "SpacingSize": (()=>SpacingSize)
});
var GradientType = /*#__PURE__*/ function(GradientType) {
    GradientType["BLUE_PURPLE"] = "blue-purple";
    GradientType["PURPLE_RED"] = "purple-red";
    GradientType["NAVY_BLUE"] = "navy-blue";
    GradientType["ORANGE_PURPLE"] = "orange-purple";
    GradientType["ALL_COLORS"] = "all-colors";
    return GradientType;
}({});
var ColorVariant = /*#__PURE__*/ function(ColorVariant) {
    ColorVariant["BLUE"] = "blue-100";
    ColorVariant["NAVY"] = "navy-100";
    ColorVariant["PURPLE"] = "purple-100";
    ColorVariant["ORANGE"] = "orange-100";
    ColorVariant["RED"] = "red-100";
    ColorVariant["WHITE"] = "white";
    ColorVariant["NEUTRAL_90"] = "neutral-90";
    ColorVariant["NEUTRAL_80"] = "neutral-80";
    ColorVariant["NEUTRAL_70"] = "neutral-70";
    ColorVariant["NEUTRAL_60"] = "neutral-60";
    ColorVariant["NEUTRAL_50"] = "neutral-50";
    ColorVariant["NEUTRAL_40"] = "neutral-40";
    ColorVariant["NEUTRAL_30"] = "neutral-30";
    ColorVariant["NEUTRAL_20"] = "neutral-20";
    ColorVariant["NEUTRAL_10"] = "neutral-10";
    ColorVariant["NEUTRAL_5"] = "neutral-5";
    return ColorVariant;
}({});
var HeadingLevel = /*#__PURE__*/ function(HeadingLevel) {
    HeadingLevel["H1"] = "h1";
    HeadingLevel["H2"] = "h2";
    HeadingLevel["H3"] = "h3";
    HeadingLevel["H4"] = "h4";
    HeadingLevel["H5"] = "h5";
    HeadingLevel["H6"] = "h6";
    return HeadingLevel;
}({});
var ButtonVariant = /*#__PURE__*/ function(ButtonVariant) {
    ButtonVariant["PRIMARY"] = "primary";
    ButtonVariant["SECONDARY"] = "secondary";
    ButtonVariant["GRADIENT_BLUE_PURPLE"] = "gradient-bp";
    ButtonVariant["GRADIENT_PURPLE_RED"] = "gradient-pr";
    ButtonVariant["OUTLINE"] = "outline";
    ButtonVariant["TEXT"] = "text";
    return ButtonVariant;
}({});
var SpacingSize = /*#__PURE__*/ function(SpacingSize) {
    SpacingSize["NONE"] = "0";
    SpacingSize["XS"] = "1";
    SpacingSize["SM"] = "2";
    SpacingSize["MD"] = "3";
    SpacingSize["BASE"] = "4";
    SpacingSize["LG"] = "6";
    SpacingSize["XL"] = "8";
    SpacingSize["XXL"] = "10";
    SpacingSize["XXXL"] = "12";
    SpacingSize["XXXXL"] = "16";
    return SpacingSize;
}({});
const PROFILE_INFO_MAP = {
    'i-am-a-first-year-student': {
        title: 'I am first year student',
        subtitle: 'Take your first step into higher education with our comprehensive support',
        backgroundImage: '/images/backgrounds/first-year-students.jpg',
        requirements: [
            'Completed high school diploma or equivalent',
            'Official high school transcripts',
            'Standardized test scores (if applicable)',
            'Personal statement or essay',
            'Letter(s) of recommendation',
            'Application fee'
        ],
        description: [
            'Welcome to the beginning of your academic journey! As a first-year student, you\'re taking an important step toward your future goals.',
            'Our comprehensive first-year program is designed to help you transition smoothly into university life while providing the foundation for your academic success.'
        ]
    },
    'i-need-academic-upgrading': {
        title: 'Academic Upgrading',
        subtitle: 'Improve your qualifications and prepare for further education',
        backgroundImage: '/images/backgrounds/academic-upgrading.jpg',
        requirements: [
            'High School Diploma Completion',
            'Subject-Specific Upgrading (Math, English, Sciences)',
            'University/College Preparation',
            'English Language Proficiency',
            'Mature Student Pathways'
        ],
        description: [
            'Our Academic Upgrading program is designed to help you improve your qualifications and prepare for further education or career advancement.',
            'Whether you need to complete high school requirements or enhance specific subject knowledge, we offer flexible pathways to help you achieve your goals.'
        ]
    },
    'i-am-an-international-student': {
        title: 'International Student Application',
        subtitle: 'Begin your global education journey with our diverse programs',
        backgroundImage: '/images/backgrounds/international-students.jpg',
        requirements: [
            'Academic credentials with certified translations',
            'Proof of English language proficiency (IELTS, TOEFL, etc.)',
            'International student application form',
            'Copy of passport',
            'Financial documentation',
            'Personal statement'
        ],
        description: [
            'Welcome to our global community! As an international student, you bring valuable perspectives and experiences to our campus.',
            'We provide comprehensive support services to help you navigate the application process, visa requirements, and transition to studying in a new country.'
        ]
    },
    'i-am-a-transfer-student': {
        title: 'Transfer Student Application',
        subtitle: 'Continue your academic path seamlessly with our transfer programs',
        backgroundImage: '/images/backgrounds/transfer-students.jpg',
        requirements: [
            'Official transcripts from all previous institutions',
            'Course descriptions for transfer credit evaluation',
            'Statement of purpose',
            'Letter(s) of recommendation (if applicable)',
            'Application fee'
        ],
        description: [
            'We welcome transfer students from other colleges and universities. Our goal is to make your transition as smooth as possible while maximizing your transfer credits.',
            'Our transfer credit assessment team will work with you to evaluate your previous coursework and apply it toward your degree requirements.'
        ]
    },
    'i-am-a-returning-student': {
        title: 'Returning Student Application',
        subtitle: 'Welcome back! Pick up where you left off and complete your education',
        backgroundImage: '/images/backgrounds/returning-students.jpg',
        requirements: [
            'Complete the returning student application form',
            'Update your personal and contact information',
            'Review and acknowledge any changes to program requirements',
            'Meet with an advisor to plan your course schedule',
            'Register for classes and complete payment arrangements'
        ],
        description: [
            'Welcome back! We\'re excited that you\'re continuing your educational journey with us.',
            'As a returning student, you\'ll benefit from a streamlined application process and specialized support to help you resume your studies successfully.'
        ]
    }
};
const COMMON_APPLICATION_STEPS = [
    {
        title: 'Create an Account',
        description: 'Sign up for our application portal to begin your application process.'
    },
    {
        title: 'Complete Your Profile',
        description: 'Fill in your personal information, educational background, and contact details.'
    },
    {
        title: 'Submit Required Documents',
        description: 'Upload all necessary documentation based on your applicant type.'
    },
    {
        title: 'Pay Application Fee',
        description: 'Complete payment of the non-refundable application processing fee.'
    },
    {
        title: 'Track Your Application',
        description: 'Monitor your application status through your applicant portal.'
    }
];
}}),
"[project]/src/components/common/Button.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// components/common/Button.tsx
/**
 * Button Component
 * 
 * A reusable button component that supports various styles defined
 * in the design system from globals.css. This component can be used
 * throughout the application for consistency.
 * 
 * The button supports different variants, sizes, and can include
 * Material Icons or other content.
 */ __turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/index.ts [app-ssr] (ecmascript)");
;
;
;
const Button = ({ children, variant = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ButtonVariant"].PRIMARY, className = '', href, iconBefore, iconAfter = '', size = 'md', fullWidth = false, disabled = false, onClick, type = 'button' })=>{
    // Base classes that apply to all button variants
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-300 focus:outline-none';
    // Size classes
    const sizeClasses = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg'
    };
    // Variant classes
    const variantClasses = {
        [__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ButtonVariant"].PRIMARY]: 'bg-blue-100 text-white hover:bg-blue-100/90 active:bg-blue-100/80',
        [__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ButtonVariant"].SECONDARY]: 'bg-neutral-10 text-neutral-80 hover:bg-neutral-20 active:bg-neutral-30',
        [__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ButtonVariant"].GRADIENT_BLUE_PURPLE]: 'bg-gradient-to-r from-purple-100 to-blue-100 text-white hover:shadow-md',
        [__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ButtonVariant"].GRADIENT_PURPLE_RED]: 'bg-gradient-to-r from-purple-100 to-red-100 text-white hover:shadow-md',
        [__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ButtonVariant"].OUTLINE]: 'border-2 border-blue-100 text-blue-100 hover:bg-blue-100/10',
        [__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ButtonVariant"].TEXT]: 'text-blue-100 hover:text-purple-100 bg-transparent'
    };
    // Assemble full class list
    const classes = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${fullWidth ? 'w-full' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `;
    // Icon elements
    const beforeIconElement = iconBefore ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "material-icon mr-2 text-current",
        children: iconBefore
    }, void 0, false, {
        fileName: "[project]/src/components/common/Button.tsx",
        lineNumber: 120,
        columnNumber: 5
    }, this) : null;
    const afterIconElement = iconAfter ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "material-icon ml-2 text-current",
        children: iconAfter
    }, void 0, false, {
        fileName: "[project]/src/components/common/Button.tsx",
        lineNumber: 124,
        columnNumber: 5
    }, this) : null;
    // If href is provided, render as a link
    if (href && !disabled) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
            href: href,
            className: classes,
            children: [
                beforeIconElement,
                children,
                afterIconElement
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/common/Button.tsx",
            lineNumber: 130,
            columnNumber: 7
        }, this);
    }
    // Otherwise render as a button
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        type: type,
        className: classes,
        onClick: onClick,
        disabled: disabled,
        children: [
            beforeIconElement,
            children,
            afterIconElement
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/common/Button.tsx",
        lineNumber: 140,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = Button;
}}),
"[project]/src/components/banners/HeroHomeSection.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// components/HeroHomeSection.tsx
/**
 * HeroHomeSection Component
 * 
 * A bold hero section for the homepage featuring large text callouts
 * and a call-to-action button.
 * 
 * This component uses CSS variables and utility classes from globals.css,
 * adheres to the original markup structure, and integrates with other
 * components created for this project.
 * 
 * Features:
 * - Optional background image or video (local or YouTube)
 * - Text animations
 * - Responsive design
 * - Integration with Button component
 * 
 * @author Your Name
 * @version 1.0.0
 */ __turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_HeroHomeSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/styles/_HeroHomeSection.module.css [app-ssr] (css module)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/common/Button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/index.ts [app-ssr] (ecmascript)");
;
;
;
;
const HeroHomeSection = ({ className = '', headlinePart1 = 'Hit the ground', headlinePart2 = 'working', subheadline = 'Graduate career-ready.', buttonText = 'Get started now!', buttonHref = '/program-list', backgroundImage = 'https://cdn.prod.website-files.com/66a28fdfe76f2f849d7b00f3/66e4fe8fecfe3a601045b24b_Homepage-1.webp', backgroundVideo, youtubeId, animated = true })=>{
    // Generate background style based on props
    const backgroundStyle = backgroundImage ? {
        backgroundImage: `linear-gradient(#0000004d, #0000004d), url(${backgroundImage}), linear-gradient(#000, #fff)`
    } : {};
    // Animation classes
    const animationClasses = animated ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_HeroHomeSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['animated-text'] : '';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_HeroHomeSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['c-hero__home']} ${className}`,
        style: backgroundStyle,
        children: [
            youtubeId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_HeroHomeSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['youtube-container'],
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("iframe", {
                    src: `https://www.youtube.com/embed/${youtubeId}?autoplay=1&controls=0&showinfo=0&rel=0&loop=1&mute=1&playlist=${youtubeId}`,
                    title: "Background video",
                    frameBorder: "0",
                    allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
                    allowFullScreen: true,
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_HeroHomeSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['youtube-iframe']
                }, void 0, false, {
                    fileName: "[project]/src/components/banners/HeroHomeSection.tsx",
                    lineNumber: 109,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/banners/HeroHomeSection.tsx",
                lineNumber: 108,
                columnNumber: 9
            }, this),
            backgroundVideo && !youtubeId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_HeroHomeSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['video-container'],
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
                    autoPlay: true,
                    muted: true,
                    loop: true,
                    playsInline: true,
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_HeroHomeSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['background-video'],
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("source", {
                        src: backgroundVideo,
                        type: "video/mp4"
                    }, void 0, false, {
                        fileName: "[project]/src/components/banners/HeroHomeSection.tsx",
                        lineNumber: 130,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/banners/HeroHomeSection.tsx",
                    lineNumber: 123,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/banners/HeroHomeSection.tsx",
                lineNumber: 122,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_HeroHomeSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['c-message']}`,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_HeroHomeSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['c-grid']} content-center`,
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_HeroHomeSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['c-bottom__spacer']} ${animationClasses}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: `text-6xl font-bold leading-24 ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_HeroHomeSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['white-font']}`,
                                        children: headlinePart1
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/banners/HeroHomeSection.tsx",
                                        lineNumber: 140,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: `text-8xl font-bold ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_HeroHomeSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['white-font']}`,
                                        children: headlinePart2
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/banners/HeroHomeSection.tsx",
                                        lineNumber: 143,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: `text-3xl font-bold leading-24 ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_HeroHomeSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['white-font']}`,
                                        children: subheadline
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/banners/HeroHomeSection.tsx",
                                        lineNumber: 146,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/banners/HeroHomeSection.tsx",
                                lineNumber: 139,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: animated ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_HeroHomeSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['button-animated'] : '',
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    href: buttonHref,
                                    variant: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ButtonVariant"].OUTLINE,
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_HeroHomeSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['c-button__transparent'],
                                    children: buttonText
                                }, void 0, false, {
                                    fileName: "[project]/src/components/banners/HeroHomeSection.tsx",
                                    lineNumber: 153,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/banners/HeroHomeSection.tsx",
                                lineNumber: 152,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/banners/HeroHomeSection.tsx",
                        lineNumber: 138,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/banners/HeroHomeSection.tsx",
                    lineNumber: 137,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/banners/HeroHomeSection.tsx",
                lineNumber: 136,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/banners/HeroHomeSection.tsx",
        lineNumber: 102,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = HeroHomeSection;
}}),
"[project]/src/styles/_GradientHeroSection.module.css [app-ssr] (css module)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v({
  "c-blue-gradient__h2": "_GradientHeroSection-module__sHDqWG__c-blue-gradient__h2",
  "c-gradient-nbp": "_GradientHeroSection-module__sHDqWG__c-gradient-nbp",
  "is-100": "_GradientHeroSection-module__sHDqWG__is-100",
  "is-25": "_GradientHeroSection-module__sHDqWG__is-25",
  "is-50": "_GradientHeroSection-module__sHDqWG__is-50",
  "is-75": "_GradientHeroSection-module__sHDqWG__is-75",
});
}}),
"[project]/src/components/banners/GradientHeroSection.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// components/GradientHeroSection.tsx
/**
 * GradientHeroSection Component
 * 
 * A hero section component with gradient styling that displays a custom heading
 * with part of the text emphasized using a gradient span. This component follows
 * the markup provided: 
 * <section class="c-gradient-nbp is-25">
 *   <h2 class="c-blue-gradient__h2">
 *     Our programs <br>
 *     <span class="text-span">empower you for your career journey</span> 
 *     and a lifetime of continuous learning and growth.
 *   </h2>
 * </section>
 * 
 * And leverages the CSS variables and utility classes from the globals.css file.
 *
 * @author Your Name
 * @version 1.0.0
 */ __turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_GradientHeroSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/styles/_GradientHeroSection.module.css [app-ssr] (css module)");
'use client';
;
;
const GradientHeroSection = ({ className = '', textBefore = 'Our programs', emphasizedText = 'empower you for your career journey', textAfter = 'and a lifetime of continuous learning and growth.', animated = false })=>{
    // Combine gradient classes with optional animation
    const gradientClasses = `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_GradientHeroSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['c-gradient-nbp']} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_GradientHeroSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['is-25']} ${animated ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_GradientHeroSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['animated-gradient'] : ''}`;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: `${gradientClasses} ${className}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_GradientHeroSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['gradient-overlay']
            }, void 0, false, {
                fileName: "[project]/src/components/banners/GradientHeroSection.tsx",
                lineNumber: 66,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "container mx-auto px-4 md:px-6 lg:px-8",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_GradientHeroSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['c-blue-gradient__h2']} text-3xl md:text-xl lg:text-3xl font-semibold max-w-4xl mx-auto`,
                    children: [
                        textBefore,
                        " ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                            fileName: "[project]/src/components/banners/GradientHeroSection.tsx",
                            lineNumber: 70,
                            columnNumber: 24
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-span gradient-text-blue",
                            children: emphasizedText
                        }, void 0, false, {
                            fileName: "[project]/src/components/banners/GradientHeroSection.tsx",
                            lineNumber: 71,
                            columnNumber: 11
                        }, this),
                        " ",
                        textAfter
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/banners/GradientHeroSection.tsx",
                    lineNumber: 69,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/banners/GradientHeroSection.tsx",
                lineNumber: 68,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/banners/GradientHeroSection.tsx",
        lineNumber: 64,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = GradientHeroSection;
}}),
"[project]/src/styles/_PathSelectionSection.module.css [app-ssr] (css module)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v({
  "box-gradient-bp": "_PathSelectionSection-module__Tbcy1q__box-gradient-bp",
  "box-white-select-your-path": "_PathSelectionSection-module__Tbcy1q__box-white-select-your-path",
  "c-box-n10__stack-h2": "_PathSelectionSection-module__Tbcy1q__c-box-n10__stack-h2",
  "c-box-n10__stack-h4": "_PathSelectionSection-module__Tbcy1q__c-box-n10__stack-h4",
  "c-box-n10__stack-h5": "_PathSelectionSection-module__Tbcy1q__c-box-n10__stack-h5",
  "c-box-neutral10": "_PathSelectionSection-module__Tbcy1q__c-box-neutral10",
  "c-box-neutral10__stack3x2": "_PathSelectionSection-module__Tbcy1q__c-box-neutral10__stack3x2",
  "c-button__grad-pb": "_PathSelectionSection-module__Tbcy1q__c-button__grad-pb",
  "c-divider__all-colors": "_PathSelectionSection-module__Tbcy1q__c-divider__all-colors",
});
}}),
"[project]/src/components/sections/PathSelectionSection.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// components/PathSelectionSection.tsx
/**
 * PathSelectionSection Component
 * 
 * A responsive section component that displays different path options
 * for users to explore educational programs. The component includes:
 * - A colored divider at the top
 * - A 3x2 grid layout with various content cells
 * - Gradient backgrounds for certain cells
 * - Lists of program options
 * 
 * This component leverages the CSS variables and utility classes defined
 * in globals.css and maintains consistency with other components.
 *
 * @author Your Name
 * @version 1.0.0
 */ __turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_PathSelectionSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/styles/_PathSelectionSection.module.css [app-ssr] (css module)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/common/Button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/index.ts [app-ssr] (ecmascript)");
;
;
;
;
;
const PathSelectionSection = ({ className = '', interestLinks = [
    {
        title: 'Business',
        href: '/program-areas/business'
    },
    {
        title: 'Entertainment Arts',
        href: '/program-areas/entertainment-arts'
    },
    {
        title: 'Technology',
        href: '/program-areas/technology'
    },
    {
        title: 'Health & Wellness',
        href: '/program-areas/health-wellness'
    },
    {
        title: 'Community Studies',
        href: '/program-areas/community-studies'
    },
    {
        title: 'Academic Upgrading',
        href: '/program-areas/academic-upgrading'
    }
], programTypeLinks = [
    {
        title: 'Programs, diplomas, post-diplomas and certificates',
        href: '/program-list'
    },
    {
        title: 'Extended education',
        href: '/study/extended-education'
    }
], applicationLinks = [
    {
        title: 'I am a first year student',
        href: '/apply/i-am-ready/i-am-a-first-year-student'
    },
    {
        title: 'I need academic upgrading',
        href: '/apply/i-am-ready/i-need-academic-upgrading'
    },
    {
        title: 'I want professional development',
        href: '/study/professional-development'
    },
    {
        title: 'I am an international student',
        href: '/apply/i-am-ready/i-am-an-international-student'
    },
    {
        title: 'I want to learn or improve my English',
        href: '/apply/i-am-ready/english-language-skills'
    },
    {
        title: 'I am a transfer student',
        href: '/apply/i-am-ready/i-am-a-transfer-student'
    }
] })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_PathSelectionSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['c-box-neutral10']} ${className}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_PathSelectionSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['c-divider__all-colors']} bg-divider-all-colors`
            }, void 0, false, {
                fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                lineNumber: 74,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mx-auto w-full max-w-screen-3xl py-10 px-[5%] sm:px-[5%] md:px-[8%] lg:px-[10%] 2xl:px-[10%] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col justify-start",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "gradient-text-purple text-5xl md:text-5xl leading-[120%] font-medium mb-4",
                                children: [
                                    "Select your",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                        fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                        lineNumber: 82,
                                        columnNumber: 24
                                    }, this),
                                    "path"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                lineNumber: 81,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-base text-neutral-70 mb-6",
                                children: [
                                    "We make applying to the program of your choice easy.",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                        fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                        lineNumber: 86,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                        fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                        lineNumber: 86,
                                        columnNumber: 19
                                    }, this),
                                    "Starting college is an exciting journey filled with new opportunities and discoveries.",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                        fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                        lineNumber: 88,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                        fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                        lineNumber: 88,
                                        columnNumber: 19
                                    }, this),
                                    "It's a time to explore, grow, and shape your future. We'll be with you every step of the way—from choosing the right courses to celebrating your successes."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                lineNumber: 84,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-auto",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    href: "#",
                                    className: "inline-flex items-center text-blue-100 hover:text-purple-100 transition-colors duration-300",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: [
                                            "Explore ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "material-icon align-middle ml-1",
                                                children: "arrow_right_alt"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                                lineNumber: 93,
                                                columnNumber: 26
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                        lineNumber: 93,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                    lineNumber: 92,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                lineNumber: 91,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                        lineNumber: 80,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_PathSelectionSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['box-gradient-bp']} rounded-lg overflow-hidden`,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_PathSelectionSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['box-white-select-your-path']} bg-white rounded-lg`,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-xl font-semibold mb-2 text-neutral-70",
                                        children: "By interest"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                        lineNumber: 102,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-base mb-4 text-neutral-60",
                                        children: "Tailor your education to your passions"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                        lineNumber: 103,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        className: "space-y-2",
                                        children: interestLinks.map((link, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                className: "list-none",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                    href: link.href,
                                                    className: "text-blue-100 hover:text-purple-100 transition-colors duration-300",
                                                    children: link.title
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                                    lineNumber: 107,
                                                    columnNumber: 21
                                                }, this)
                                            }, index, false, {
                                                fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                                lineNumber: 106,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                        lineNumber: 104,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                lineNumber: 101,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                            lineNumber: 100,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                        lineNumber: 99,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_PathSelectionSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['box-gradient-bp']} rounded-lg overflow-hidden`,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_PathSelectionSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['box-white-select-your-path']} bg-white rounded-lg`,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-xl font-semibold mb-2 text-neutral-70",
                                        children: "Program type"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                        lineNumber: 124,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-base mb-4 text-neutral-60",
                                        children: "Select the program type that suits your learning style."
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                        lineNumber: 125,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        className: "space-y-2",
                                        children: programTypeLinks.map((link, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                className: "list-none",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                    href: link.href,
                                                    className: "text-blue-100 hover:text-purple-100 transition-colors duration-300",
                                                    children: link.title
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                                    lineNumber: 129,
                                                    columnNumber: 21
                                                }, this)
                                            }, index, false, {
                                                fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                                lineNumber: 128,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                        lineNumber: 126,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                lineNumber: 123,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                            lineNumber: 122,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                        lineNumber: 121,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "hidden lg:block"
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                        lineNumber: 143,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_PathSelectionSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['box-gradient-bp']} rounded-lg overflow-hidden`,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_PathSelectionSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['box-white-select-your-path']} bg-white rounded-lg`,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-xl font-semibold mb-2 text-neutral-70",
                                        children: "Ready to apply?"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                        lineNumber: 149,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-base mb-4 text-neutral-60",
                                        children: "Follow the steps for your specific profile."
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                        lineNumber: 150,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        className: "space-y-2",
                                        children: applicationLinks.map((link, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                className: "list-none",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                    href: link.href,
                                                    className: "text-blue-100 hover:text-purple-100 transition-colors duration-300",
                                                    children: link.title
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                                    lineNumber: 154,
                                                    columnNumber: 21
                                                }, this)
                                            }, index, false, {
                                                fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                                lineNumber: 153,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                        lineNumber: 151,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                lineNumber: 148,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                            lineNumber: 147,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                        lineNumber: 146,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col justify-center items-start p-6 bg-neutral-5 rounded-lg",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_PathSelectionSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['c-box-n10__stack-h4']} text-2xl font-semibold mb-2 text-neutral-80`,
                                children: [
                                    "Don't know where ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                        fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                        lineNumber: 170,
                                        columnNumber: 30
                                    }, this),
                                    "to start?"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                lineNumber: 169,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h5", {
                                className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_PathSelectionSection$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"]['c-box-n10__stack-h5']} text-xl mb-6 text-neutral-70`,
                                children: "We can help you."
                            }, void 0, false, {
                                fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                lineNumber: 172,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$common$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: "#",
                                variant: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ButtonVariant"].GRADIENT_BLUE_PURPLE,
                                iconBefore: "add",
                                children: "Connect with us"
                            }, void 0, false, {
                                fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                                lineNumber: 175,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                        lineNumber: 168,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
                lineNumber: 77,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/sections/PathSelectionSection.tsx",
        lineNumber: 72,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = PathSelectionSection;
}}),
"[project]/src/components/pages/Home.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// components/pages/Home.tsx
__turbopack_context__.s({
    "default": (()=>Home)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$banners$2f$HeroHomeSection$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/banners/HeroHomeSection.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$banners$2f$GradientHeroSection$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/banners/GradientHeroSection.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$sections$2f$PathSelectionSection$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/sections/PathSelectionSection.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
const interestLinks = [
    {
        title: 'Business',
        href: '/program-areas/business'
    },
    {
        title: 'Entertainment Arts',
        href: '/program-areas/entertainment-arts'
    },
    {
        title: 'Technology',
        href: '/program-areas/technology'
    },
    {
        title: 'Health & Wellness',
        href: '/program-areas/health-wellness'
    },
    {
        title: 'Community Studies',
        href: '/program-areas/community-studies'
    },
    {
        title: 'Academic Upgrading',
        href: '/program-areas/academic-upgrading'
    }
];
function Home() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "min-h-screen",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$banners$2f$HeroHomeSection$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                headlinePart1: "Hit the ground",
                headlinePart2: "working",
                subheadline: "Graduate career-ready.",
                buttonText: "Get started now!",
                buttonHref: "/program-list",
                youtubeId: "",
                animated: true
            }, void 0, false, {
                fileName: "[project]/src/components/pages/Home.tsx",
                lineNumber: 23,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$banners$2f$GradientHeroSection$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                textBefore: "Our programs",
                emphasizedText: "empower you for your career journey",
                textAfter: "and a lifetime of continuous learning and growth.",
                animated: true
            }, void 0, false, {
                fileName: "[project]/src/components/pages/Home.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$sections$2f$PathSelectionSection$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                interestLinks: interestLinks
            }, void 0, false, {
                fileName: "[project]/src/components/pages/Home.tsx",
                lineNumber: 40,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/pages/Home.tsx",
        lineNumber: 22,
        columnNumber: 5
    }, this);
}
}}),

};

//# sourceMappingURL=src_7e9256d2._.js.map