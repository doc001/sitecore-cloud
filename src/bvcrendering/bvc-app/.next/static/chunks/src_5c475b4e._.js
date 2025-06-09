(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/styles/_GradientHeroSection.module.css [app-client] (css module)": ((__turbopack_context__) => {

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
"[project]/src/components/banners/HeroBannerSection.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_GradientHeroSection$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/styles/_GradientHeroSection.module.css [app-client] (css module)");
'use client';
;
;
/**
 * HeroBannerSection component for displaying a hero section with a gradient background
 * 
 * This component uses Tailwind CSS classes and provides a responsive hero section
 * with configurable content via props or JSON data provided in contentData.
 * 
 * @param className - Additional CSS classes for the hero component
 * @param subtitle - The subtitle displayed above the main title (fallback if not in contentData)
 * @param title - The main title displayed in the hero section (fallback if not in contentData)
 * @param height - Height of the hero section (40vh, 60vh, 80vh, or 100vh)
 * @param containerClassName - Additional CSS classes for the container element
 * @param contentData - JSON data containing subtitle and title text
 */ const HeroBannerSection = ({ className = '', subtitle = 'How to apply', title = 'I am a first-year student.', containerClassName = '', contentData })=>{
    // Use contentData values if provided, otherwise fall back to props
    const displaySubtitle = contentData?.subtitle || subtitle;
    const displayTitle = contentData?.title || title;
    // Define gradient styles for c-gradient-nbp
    // This assumes we need to create a custom class for the navy-blue-purple gradient
    // based on your globals.css which has various gradient utilities
    const gradientStyle = {
        backgroundImage: 'linear-gradient(220deg, var(--color-blue-100), var(--color-purple-100) 50%, var(--color-navy-100))'
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_GradientHeroSection$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"]['c-gradient-nbp']} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_GradientHeroSection$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"]['is-75']}`,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: `w-full max-w-7xl mx-auto px-6 md:px-8 lg:px-10 py-12 md:py-16 ${containerClassName}`,
            children: [
                displaySubtitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-white text-lg md:text-xl mb-3 font-medium",
                    children: displaySubtitle
                }, void 0, false, {
                    fileName: "[project]/src/components/banners/HeroBannerSection.tsx",
                    lineNumber: 54,
                    columnNumber: 11
                }, this),
                displayTitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    className: "text-white text-3xl md:text-5xl font-bold",
                    children: displayTitle
                }, void 0, false, {
                    fileName: "[project]/src/components/banners/HeroBannerSection.tsx",
                    lineNumber: 57,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/banners/HeroBannerSection.tsx",
            lineNumber: 52,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/banners/HeroBannerSection.tsx",
        lineNumber: 49,
        columnNumber: 5
    }, this);
};
_c = HeroBannerSection;
const __TURBOPACK__default__export__ = HeroBannerSection;
var _c;
__turbopack_context__.k.register(_c, "HeroBannerSection");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_5c475b4e._.js.map