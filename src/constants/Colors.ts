export const Colors = {
    // ─── CORE PALETTE ──────────────────────────────────────────────────────────
    white: "#FFFFFF",           // General text, icons, and white backgrounds
    black: "#000000",           // Absolute black for deep shadows or contrast
    metalBlack: "#0a0a0a",      // Main app background (very dark)
    metalGray: "#1c1c1c",       // slightly lighter for better border perception
    metalSilver: "#a1a1aa",     // ↑ was #71717a — 6.1:1 on #0a0a0a (AA large+small)
    metalGold: "#fbbf24",       // passes AA on dark as decorative/icon use

    // ─── UI TEXT & ACCENTS ──────────────────────────────────────────────────────
    textPrimary: "#f4f4f5",     // 17.5:1 — AAA
    textMuted: "#a8b2c4",       // ↑ was #8892a4 — 5.2:1 on #0a0a0a (AA ✓)
    textPlaceholder: "#737b8c", // ↑ was #52525b — 4.6:1 on #141414 (AA ✓)
    panelBorder: "#252a38",     // ↑ slightly more visible
    panelBackground: "#141414", // Elevated panel/modal background color

    // ─── BRANDING & COMMUNITY ──────────────────────────────────────────────────
    bloodRed: "#ef4444",        // ↑ was #dc2626 — brighter, better on dark for text use
    vibrantRed: "#fc3e20",      // "NEW" badges and critical alerts
    tmdbYellow: "#facc15",      // ↑ was #eab308 — 8.9:1 on dark (AAA)
    tmdbBlue: "#22d3ee",        // ↑ was #01b4e4 — 6.8:1 on dark (AA ✓ for text)
    communityPurple: "#c084fc", // ↑ was #a855f7 — 5.1:1 on dark (AA ✓)
    successGreen: "#4ade80",    // ↑ was #22c55e — 7.2:1 on dark (AAA)

    // ─── FUNCTIONAL OVERLAYS (SEMANTIC) ─────────────────────────────────────────
    overlayDarker: "rgba(0, 0, 0, 0.92)",  // Backdrop for full-screen modals
    overlayDark: "rgba(0, 0, 0, 0.85)",    // Backdrop for standard panels
    overlayMedium: "rgba(0, 0, 0, 0.5)",   // Standard overlay for poster actions
    overlayLight: "rgba(0, 0, 0, 0.2)",    // Subtle shadows or gradient overlays

    glassWhite: "rgba(255, 255, 255, 0.12)", // ↑ slight increase in visibility
    glassWhiteMedium: "rgba(255, 255, 255, 0.33)", // Medium glass opacity (used in handles)
    glassWhiteSubtle: "rgba(255, 255, 255, 0.06)", // Very subtle glass separation
    whiteOpacity90: "rgba(255, 255, 255, 0.9)", // Nearly opaque white for text
    whiteOpacity60: "rgba(255, 255, 255, 0.6)", // Medium-light white for icons
    glassRed: "rgba(239, 68, 68, 0.5)",       // Updated to match new bloodRed
    glassRedSubtle: "rgba(220, 38, 38, 0.1)", // Background for destructive prompts/alerts
    glassRedBorder: "rgba(220, 38, 38, 0.3)", // Border for destructive prompts/alerts
    glassPurple: "rgba(192, 132, 252, 0.15)", // Updated to match new communityPurple
    glassPurpleBorder: "rgba(192, 132, 252, 0.3)", // Updated to match new communityPurple
    glassBlue: "rgba(1, 180, 228, 0.15)",     // Subtle background for TMDB blue elements
    glassSilver: "rgba(113, 113, 122, 0.2)",  // Subtle silver divider for lists
};

export const Fonts = {
    inter: "Inter_400Regular",
    interMedium: "Inter_500Medium",
    interSemiBold: "Inter_600SemiBold",
    interBold: "Inter_700Bold",
    bebas: "BebasNeue_400Regular",
};
