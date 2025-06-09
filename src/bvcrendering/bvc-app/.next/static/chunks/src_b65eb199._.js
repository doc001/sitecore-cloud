(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/components/sections/ApplyPathSection.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
'use client';
;
;
/**
 * PathSelectionSection component for displaying admission path options
 * 
 * This component displays a grid of admission path options with gradient styling
 * and SVG icons. Each path is clickable and navigates to a specific application route.
 * 
 * @param className - Additional CSS classes for the component
 */ const PathSelectionSection = ({ className = '' })=>{
    // Path options data with SVG icons
    const pathOptions = [
        {
            id: 'first-year',
            title: 'I am a first year student.',
            href: '/apply/i-am-ready/i-am-a-first-year-student',
            iconSvg: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                width: "50",
                height: "62",
                viewBox: "0 0 50 62",
                fill: "none",
                xmlns: "http://www.w3.org/2000/svg",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: "M19.8839 39.4984C19.8668 40.6688 19.6908 41.755 19.3476 42.7613C18.837 44.2685 17.5541 45.4011 15.9838 45.7884L9.82244 47.3167C4.9955 48.5125 1.61879 52.7732 1.61879 57.6571V61H49V57.6571C49 52.7732 45.619 48.5125 40.7964 47.3167L34.635 45.7884C33.0647 45.4011 31.7818 44.2685 31.2712 42.7613C30.9322 41.755 30.7563 40.6688 30.7349 39.4984M33.5581 45.6832L25.3115 57.2445M25.3115 57.2445L17.065 45.6832M25.3115 57.2445V60.4106M13.3322 24.4131C12.2037 24.4257 11.2812 25.2172 11.0581 26.2403C10.9809 26.6024 11.0238 26.9813 11.1268 27.3392L11.8476 29.8022C12.0664 30.5474 12.6542 31.1116 13.3836 31.3263C13.98 31.4947 14.4606 31.9241 14.6923 32.4883C16.6917 37.4185 20.6476 41.1403 25.2 41.1403C29.7523 41.1403 33.6439 37.4732 35.6605 32.5978C35.9179 31.9789 36.4371 31.5031 37.085 31.301C37.7801 31.0695 38.3378 30.5179 38.5481 29.798L39.2689 27.335C39.3719 26.9771 39.4148 26.5982 39.3375 26.2361C39.1144 25.213 38.192 24.4215 37.0635 24.4089M3.72119 10.4688V18.1651M12.7443 11.9929V21.0112C12.7443 24.2657 18.2406 26.9055 25.0198 26.9055C31.7989 26.9055 37.2952 24.2657 37.2952 21.0112V11.9929M6.33417 23.1921L3.72119 17.7904L1.10821 23.1921C0.760668 23.9079 1.2927 24.7331 2.09934 24.7331H5.33875C6.14538 24.7331 6.67742 23.9079 6.32988 23.1921H6.33417ZM3.72119 9.44572V9.08364L25.0198 1L46.3184 9.08364V9.44572L25.0198 16.9736L3.72119 9.44572Z",
                        stroke: "url(#paint0_linear_47_179)",
                        strokeWidth: "1.8",
                        strokeMiterlimit: "10"
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                        lineNumber: 37,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("defs", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("linearGradient", {
                            id: "paint0_linear_47_179",
                            x1: "25",
                            y1: "61",
                            x2: "25",
                            y2: "1",
                            gradientUnits: "userSpaceOnUse",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                    stopColor: "#0079BE"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                    lineNumber: 40,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                    offset: "0.951923",
                                    stopColor: "#6A4CD7"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                    lineNumber: 41,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                            lineNumber: 39,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                        lineNumber: 38,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                lineNumber: 36,
                columnNumber: 9
            }, this)
        },
        {
            id: 'international',
            title: 'I am an international student.',
            href: '/apply/i-am-ready/i-am-an-international-student',
            iconSvg: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                width: "72",
                height: "60",
                viewBox: "0 0 72 60",
                fill: "none",
                xmlns: "http://www.w3.org/2000/svg",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                        clipPath: "url(#clip0_48_180)",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                d: "M52.8371 13.9093C46.5529 18.704 38.2385 20.337 29.1198 20.337C20.0011 20.337 11.8417 18.7562 5.5817 14.0422M52.8371 43.6364C46.5529 38.8417 38.2385 37.2086 29.1198 37.2086C20.0011 37.2086 11.8417 38.7894 5.5817 43.5034M53.6523 14.0666C61.9419 27.2069 57.7897 44.4433 44.3782 52.5652C30.9666 60.6872 13.3744 56.619 5.08477 43.4787C-3.20484 30.3385 0.947315 13.1021 14.3589 4.98015C27.7704 -3.14177 45.3627 0.926391 53.6523 14.0666ZM40.7871 28.7728C40.7871 44.2206 35.6741 56.7434 29.3669 56.7434C23.0597 56.7434 17.9467 44.2206 17.9467 28.7728C17.9467 13.3251 23.0597 0.802265 29.3669 0.802265C35.6741 0.802265 40.7871 13.3251 40.7871 28.7728Z",
                                stroke: "url(#paint0_linear_48_180)",
                                strokeWidth: "1.8",
                                strokeMiterlimit: "10"
                            }, void 0, false, {
                                fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                lineNumber: 54,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                d: "M53.4574 52.6276H64.2331V30.3347H57.4014C54.5475 30.3347 51.8245 31.569 50.0269 33.7337C48.2294 31.569 45.5063 30.3347 42.6525 30.3347H35.8207V52.6276H46.5481",
                                fill: "white"
                            }, void 0, false, {
                                fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                lineNumber: 55,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                d: "M53.4574 52.6276H64.2331V30.3347H57.4014C54.5475 30.3347 51.8245 31.569 50.0269 33.7337C48.2294 31.569 45.5063 30.3347 42.6525 30.3347H35.8207V52.6276H46.5481",
                                stroke: "white",
                                strokeWidth: "2.4",
                                strokeMiterlimit: "10"
                            }, void 0, false, {
                                fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                lineNumber: 56,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                d: "M50.0269 33.7574V56.5013",
                                stroke: "white",
                                strokeWidth: "2.4",
                                strokeMiterlimit: "10"
                            }, void 0, false, {
                                fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                lineNumber: 57,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                d: "M31.3728 35.0534V56.7434H68.6762V35.0534",
                                fill: "white"
                            }, void 0, false, {
                                fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                lineNumber: 58,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                d: "M31.3728 35.0534V56.7434H68.6762V35.0534",
                                stroke: "white",
                                strokeWidth: "2.4",
                                strokeMiterlimit: "10"
                            }, void 0, false, {
                                fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                lineNumber: 59,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                d: "M53.9418 52.1529H63.7486V30.3347H57.4013C54.5475 30.3347 51.8245 31.569 50.0269 33.7337C48.2293 31.569 45.5063 30.3347 42.6525 30.3347H36.3052V52.1529H46.0635M50.0269 33.7574V56.5013M31.3728 35.0534V56.7434H68.6762V35.0534",
                                stroke: "url(#paint1_linear_48_180)",
                                strokeWidth: "1.8",
                                strokeMiterlimit: "10"
                            }, void 0, false, {
                                fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                lineNumber: 60,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                        lineNumber: 53,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("defs", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("linearGradient", {
                                id: "paint0_linear_48_180",
                                x1: "29.3685",
                                y1: "56.7471",
                                x2: "29.3685",
                                y2: "0.798248",
                                gradientUnits: "userSpaceOnUse",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                        stopColor: "#0079BE"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                        lineNumber: 64,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                        offset: "1",
                                        stopColor: "#6A4CD7"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                        lineNumber: 65,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                lineNumber: 63,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("linearGradient", {
                                id: "paint1_linear_48_180",
                                x1: "50.0245",
                                y1: "56.7434",
                                x2: "50.0245",
                                y2: "30.3347",
                                gradientUnits: "userSpaceOnUse",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                        stopColor: "#0079BE"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                        lineNumber: 68,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                        offset: "1",
                                        stopColor: "#6A4CD7"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                        lineNumber: 69,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                lineNumber: 67,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("clipPath", {
                                id: "clip0_48_180",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                    width: "72",
                                    height: "60",
                                    fill: "white"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                    lineNumber: 72,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                lineNumber: 71,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                        lineNumber: 62,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                lineNumber: 52,
                columnNumber: 9
            }, this)
        },
        {
            id: 'academic-upgrading',
            title: 'I need academic upgrading.',
            href: '/apply/i-am-ready/i-need-academic-upgrading',
            iconSvg: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                width: "73",
                height: "62",
                viewBox: "0 0 73 62",
                fill: "none",
                xmlns: "http://www.w3.org/2000/svg",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: "M53.0577 52.5923C45.9841 51.8218 37.7412 51.9924 28.9089 52.6264C27.4328 52.7337 25.9713 52.2509 24.8362 51.2951L8.15082 37.2253C7.39572 36.5913 7.50776 35.3672 8.38953 34.9234C8.41389 34.9088 8.43825 34.899 8.46261 34.8844C11.4879 33.3872 15.1319 33.9481 17.748 36.0793L26.5413 42.8825M40.5522 42.9215L29.1525 43.8969C27.389 44.048 25.8398 42.741 25.6888 40.9756C25.5377 39.2102 26.8433 37.6594 28.6069 37.5082L36.8059 36.8059C38.5597 36.6547 40.2306 36.089 41.7993 35.2892C46.7928 32.7435 53.92 35.6111 58.8063 39.7759M4.04889 11.8266V20.6342M14.1673 13.5725V23.8871C14.1673 27.613 20.3299 30.6318 27.9297 30.6318C35.5295 30.6318 41.6921 27.613 41.6921 23.8871V13.5725M61.8656 61L54.1733 57.6106C53.0285 57.1034 52.3903 55.85 52.6826 54.6308C54.1392 48.5786 56.6091 42.9654 60.0924 37.7813C60.7988 36.7279 62.1677 36.3475 63.332 36.8547L71 40.2343L61.8705 61H61.8656ZM6.97675 26.3792L4.04889 20.2051L1.12103 26.3792C0.731296 27.1985 1.33051 28.1446 2.23664 28.1446H5.86114C6.76727 28.1446 7.36648 27.1985 6.97675 26.3792ZM4.04889 10.6562V10.2465L27.9249 1L51.8008 10.2465V10.6562L27.9249 19.2687L4.04889 10.6562Z",
                        stroke: "url(#paint0_linear_48_209)",
                        strokeWidth: "1.8",
                        strokeMiterlimit: "10"
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                        lineNumber: 84,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("defs", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("linearGradient", {
                            id: "paint0_linear_48_209",
                            x1: "36",
                            y1: "1",
                            x2: "36",
                            y2: "61",
                            gradientUnits: "userSpaceOnUse",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                    stopColor: "#6A4CD7"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                    lineNumber: 87,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                    offset: "1",
                                    stopColor: "#0079BE"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                    lineNumber: 88,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                            lineNumber: 86,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                        lineNumber: 85,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                lineNumber: 83,
                columnNumber: 9
            }, this)
        },
        {
            id: 'transfer',
            title: 'I am a transfer student.',
            href: '/apply/i-am-ready/i-am-a-transfer-student',
            iconSvg: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                width: "69",
                height: "65",
                viewBox: "0 0 69 65",
                fill: "none",
                xmlns: "http://www.w3.org/2000/svg",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: "M21.924 56.139H48.721C52.0941 56.139 54.8301 53.4133 54.8301 50.0529C54.8301 46.6925 52.0941 43.9668 48.721 43.9668H46.8739C39.7574 43.9668 40.1031 37.2214 40.1031 37.2214V30.8499M64.1641 11.9077V20.7786M53.9214 13.6691V24.0603C53.9214 27.8093 47.6839 30.8499 39.9944 30.8499C32.305 30.8499 26.0675 27.8093 26.0675 24.0603V13.6691M61.112 26.7515L64.1641 20.3456L67.2162 26.7515C67.5668 27.4895 67.0285 28.3456 66.2037 28.3456H62.1244C61.3046 28.3456 60.7614 27.4945 61.112 26.7515ZM64.1641 10.7269V10.3137L39.9944 1L15.8248 10.3137V10.7269L39.9944 19.4059L64.1641 10.7269ZM26.0626 49.428L17.4249 61.8905C16.1458 63.7356 13.4147 63.7356 12.1356 61.8905L3.49796 49.428C-2.66545 40.5326 3.22633 28.0947 14.0666 27.6076C14.3037 27.5978 14.5407 27.5929 14.7827 27.5929C15.0247 27.5929 15.2618 27.5978 15.4988 27.6076C26.3391 28.0947 32.2309 40.5326 26.0675 49.428H26.0626ZM21.7857 41.5461C21.7857 45.4019 18.6482 48.5277 14.7778 48.5277C10.9074 48.5277 7.76987 45.4019 7.76987 41.5461C7.76987 37.6903 10.9074 34.5646 14.7778 34.5646C18.6482 34.5646 21.7857 37.6903 21.7857 41.5461Z",
                        stroke: "url(#paint0_linear_48_234)",
                        strokeWidth: "1.8",
                        strokeMiterlimit: "10"
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                        lineNumber: 100,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("defs", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("linearGradient", {
                            id: "paint0_linear_48_234",
                            x1: "34.1625",
                            y1: "1",
                            x2: "34.1625",
                            y2: "63.2743",
                            gradientUnits: "userSpaceOnUse",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                    stopColor: "#6A4CD7"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                    lineNumber: 103,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                    offset: "1",
                                    stopColor: "#0079BE"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                    lineNumber: 104,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                            lineNumber: 102,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                        lineNumber: 101,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                lineNumber: 99,
                columnNumber: 9
            }, this)
        },
        {
            id: 'english',
            title: 'I want to learn or improve my English.',
            href: '/apply/i-am-ready/english-language-skills',
            iconSvg: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                width: "75",
                height: "64",
                viewBox: "0 0 75 64",
                fill: "none",
                xmlns: "http://www.w3.org/2000/svg",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: "M9.67532 39.7732H8.04999C4.15749 39.7732 1.00001 36.573 1.00001 32.621V8.15218C0.99483 4.20543 4.15231 1 8.04999 1H37.2024C41.0949 1 44.2524 4.20021 44.2524 8.15218V9.51475M24.9192 39.7732H19.0546L9.67532 49.1075V34.965M66.2616 51.6656H66.95C70.8425 51.6656 74 48.4654 74 44.5134V21.4385C74 17.4866 70.8425 14.2863 66.95 14.2863H36.664C32.7715 14.2863 29.6141 17.4866 29.6141 21.4385V44.5134C29.6141 48.4654 32.7715 51.6656 36.664 51.6656H56.8875L66.2667 61V47.0872M43.2948 32.3234C43.2948 34.2898 41.7142 35.8838 39.7646 35.8838C37.8149 35.8838 36.2344 34.2898 36.2344 32.3234C36.2344 30.357 37.8149 28.763 39.7646 28.763C41.7142 28.763 43.2948 30.357 43.2948 32.3234ZM55.3346 32.3234C55.3346 34.2898 53.7541 35.8838 51.8044 35.8838C49.8548 35.8838 48.2743 34.2898 48.2743 32.3234C48.2743 30.357 49.8548 28.763 51.8044 28.763C53.7541 28.763 55.3346 30.357 55.3346 32.3234ZM67.3745 32.3234C67.3745 34.2898 65.7939 35.8838 63.8443 35.8838C61.8946 35.8838 60.3141 34.2898 60.3141 32.3234C60.3141 30.357 61.8946 28.763 63.8443 28.763C65.7939 28.763 67.3745 30.357 67.3745 32.3234Z",
                        stroke: "url(#paint0_linear_48_197)",
                        strokeWidth: "1.8",
                        strokeMiterlimit: "10"
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                        lineNumber: 116,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("defs", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("linearGradient", {
                            id: "paint0_linear_48_197",
                            x1: "37.5",
                            y1: "1",
                            x2: "37.5",
                            y2: "61",
                            gradientUnits: "userSpaceOnUse",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                    stopColor: "#6A4CD7"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                    lineNumber: 119,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                    offset: "1",
                                    stopColor: "#0079BE"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                    lineNumber: 120,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                            lineNumber: 118,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                        lineNumber: 117,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                lineNumber: 115,
                columnNumber: 9
            }, this)
        },
        {
            id: 'professional',
            title: 'I want professional development.',
            href: '/study/professional-development',
            iconSvg: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                width: "72",
                height: "62",
                viewBox: "0 0 72 62",
                fill: "none",
                xmlns: "http://www.w3.org/2000/svg",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: "M67.629 8.84817V47.3874H25.4904M24.6332 8.84817H72M36.1005 61L40.9689 47.3874M53.0183 61L48.1552 47.3874M57.3894 19.1518H40.064M57.3894 28.5026H31.7294M52.3463 37.8482H31.7294M13.9067 60.2618V43.1885M6.66222 27.555C6.66222 40.5497 6.62518 48.9843 7.83171 58.6126C8.00104 59.9738 9.18111 60.9948 10.5676 60.9948H17.2458C18.6376 60.9948 19.8123 59.9686 19.9817 58.6073C21.0136 50.3717 21.1512 28.377 21.1512 26.3141C21.1512 25.0471 22.1936 24.0157 23.4743 24.0157H34.0526C35.8571 24.0157 37.3176 22.5707 37.3176 20.7853C37.3176 19 35.8571 17.555 34.0526 17.555H13.9067C9.56742 17.555 6.34471 18.4555 4.20154 19.356C2.24886 20.178 1 22.0995 1 24.199V35.8377C1 37.6544 2.48699 39.1309 4.32854 39.1309H6.66222M19.6059 6.95811C19.6059 10.733 17.0923 13.7016 13.9914 13.7016C10.8904 13.7016 8.37676 10.733 8.37676 6.95811C8.37676 3.18325 10.8904 1 13.9914 1C17.0923 1 19.6059 3.17801 19.6059 6.95288V6.95811Z",
                        stroke: "url(#paint0_linear_123_52)",
                        strokeWidth: "2",
                        strokeMiterlimit: "10"
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                        lineNumber: 132,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("defs", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("linearGradient", {
                            id: "paint0_linear_123_52",
                            x1: "36.5",
                            y1: "1",
                            x2: "36.5",
                            y2: "61",
                            gradientUnits: "userSpaceOnUse",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                    stopColor: "#0079BE"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                    lineNumber: 135,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                    offset: "1",
                                    stopColor: "#A16E35"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                    lineNumber: 136,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                            lineNumber: 134,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                        lineNumber: 133,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                lineNumber: 131,
                columnNumber: 9
            }, this)
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: `bg-neutral-5 py-16 ${className}`,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "container-layout",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-1 md:grid-cols-2 gap-8",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-3xl md:text-4xl font-bold leading-tight",
                                    children: [
                                        "You've chosen a path. ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                            fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                            lineNumber: 151,
                                            columnNumber: 37
                                        }, this),
                                        "What's next?"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                    lineNumber: 150,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-neutral-70",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            children: "We make applying to the program of your choice easy."
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                            lineNumber: 154,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "mt-4",
                                            children: "Once you've gathered all your application details, choose the option that fits you best."
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                            lineNumber: 155,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                    lineNumber: 153,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    className: "text-xl font-semibold text-neutral-80",
                                    children: "We're excited you're here!"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                    lineNumber: 157,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                            lineNumber: 149,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
                            children: pathOptions.map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "relative rounded-md overflow-hidden",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "absolute inset-0 bg-gradient-to-br from-purple-100 to-blue-100 rounded-md"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                            lineNumber: 165,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            href: option.href,
                                            className: "block relative bg-white m-[1px] rounded-[5px] h-full transform transition-transform hover:scale-[0.98] hover:shadow-lg",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "p-4",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex flex-col items-start gap-3 text-neutral-80 hover:text-neutral-70",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "h-16",
                                                            children: option.iconSvg
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                                            lineNumber: 174,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-lg font-medium",
                                                            children: option.title
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                                            lineNumber: 179,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                                    lineNumber: 172,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                                lineNumber: 171,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                            lineNumber: 167,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, option.id, true, {
                                    fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                    lineNumber: 163,
                                    columnNumber: 15
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                            lineNumber: 161,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                    lineNumber: 147,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-12 text-neutral-70",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "font-semibold",
                            children: "Are you a previous student seeking re-admission?"
                        }, void 0, false, {
                            fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                            lineNumber: 192,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "mt-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("em", {
                                    children: "Welcome back"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                    lineNumber: 194,
                                    columnNumber: 13
                                }, this),
                                ". If you're returning to Bow Valley College after a year or more away, you'll need to re-apply for admission. You can apply to return within 3 years for a certificate or 5 years for a diploma by completing the",
                                ' ',
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    href: "https://forms.office.com/Pages/ResponsePage.aspx?id=9MYRj45kDEy7mZboQIqOKto9o33Kh5VMhC10M25jbd1URE41TTEzSThCR05NRFJTN0pMQllCNkpTMyQlQCN0PWcu",
                                    className: "text-blue-100 hover:underline",
                                    children: "online re-admission form"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                                    lineNumber: 197,
                                    columnNumber: 13
                                }, this),
                                "."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                            lineNumber: 193,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
                    lineNumber: 191,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
            lineNumber: 146,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/sections/ApplyPathSection.tsx",
        lineNumber: 145,
        columnNumber: 5
    }, this);
};
_c = PathSelectionSection;
const __TURBOPACK__default__export__ = PathSelectionSection;
var _c;
__turbopack_context__.k.register(_c, "PathSelectionSection");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
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
"[project]/src/components/banners/GenericHero.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
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
 * GenericHero component
 * 
 * A call-to-action component that displays a prominent message encouraging users to apply
 * Uses CSS variables from globals.css for consistent styling across the application
 * 
 * @param title - The main title (defaults to "I am ready")
 * @param subtitle - The subtitle displayed below the title (defaults to "to apply.")
 * @param description - The descriptive text (defaults to "You're ready to make this happen...")
 * @param className - Additional CSS classes for customization
 */ const GenericHero = ({ title = "I am ready", subtitle = "to apply.", description = "You're ready to make this happen. Let's take the first step together.", className = '' })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_GradientHeroSection$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"]['c-gradient-nbp']} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$_GradientHeroSection$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"]['is-75']}`,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "container-layout grid grid-cols-1 md:grid-cols-2 gap-6 items-center",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "opacity-100 transform transition-all duration-500 ease-in-out",
                    style: {
                        transform: 'translate3d(0px, 0px, 0px) scale3d(1, 1, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg, 0deg)',
                        transformStyle: 'preserve-3d'
                    },
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-8",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-5xl font-bold text-[color:var(--color-white)] mb-2",
                                children: title
                            }, void 0, false, {
                                fileName: "[project]/src/components/banners/GenericHero.tsx",
                                lineNumber: 43,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-7xl font-bold text-[color:var(--color-white)]",
                                children: subtitle
                            }, void 0, false, {
                                fileName: "[project]/src/components/banners/GenericHero.tsx",
                                lineNumber: 47,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/banners/GenericHero.tsx",
                        lineNumber: 41,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/banners/GenericHero.tsx",
                    lineNumber: 34,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-2xl md:text-3xl font-medium text-[color:var(--color-white)]",
                        children: description
                    }, void 0, false, {
                        fileName: "[project]/src/components/banners/GenericHero.tsx",
                        lineNumber: 56,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/banners/GenericHero.tsx",
                    lineNumber: 54,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/banners/GenericHero.tsx",
            lineNumber: 32,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/banners/GenericHero.tsx",
        lineNumber: 31,
        columnNumber: 5
    }, this);
};
_c = GenericHero;
const __TURBOPACK__default__export__ = GenericHero;
var _c;
__turbopack_context__.k.register(_c, "GenericHero");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_b65eb199._.js.map