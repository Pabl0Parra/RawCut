import { StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from "react-native";
import { Colors } from "../constants/Colors";

/**
 * Common styles shared between movie and TV detail screens
 * Extracted to reduce duplication and ensure consistency
 */
export const detailScreenStyles = StyleSheet.create({
    // Container styles
    safeArea: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
    } as ViewStyle,
    centerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    } as ViewStyle,
    contentContainer: {
        paddingHorizontal: 16,
        marginTop: -64,
    } as ViewStyle,
    sectionContainer: {
        marginVertical: 16,
    } as ViewStyle,

    // Header styles
    headerRow: {
        flexDirection: "row",
    } as ViewStyle,
    infoContainer: {
        flex: 1,
        marginLeft: 16,
        marginTop: 64,
    } as ViewStyle,

    // Text styles
    title: {
        color: "#f4f4f5",
        fontSize: 20,
        fontWeight: "bold",
        fontFamily: "BebasNeue_400Regular",
    } as TextStyle,
    yearText: {
        color: Colors.metalSilver,
        fontSize: 14,
        marginTop: 4,
    } as TextStyle,
    ratingText: {
        color: "#eab308",
        fontSize: 14,
        marginTop: 4,
    } as TextStyle,
    sectionTitle: {
        color: "#f4f4f5",
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 12,
        fontFamily: "BebasNeue_400Regular",
    } as TextStyle,
    errorText: {
        color: Colors.metalSilver,
    } as TextStyle,

    // Description styles
    descriptionContainer: {
        marginVertical: 16,
    } as ViewStyle,
    descriptionTitle: {
        color: "#f4f4f5",
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 8,
    } as TextStyle,
    descriptionText: {
        color: Colors.metalSilver,
        fontSize: 14,
        lineHeight: 20,
    } as TextStyle,

    // Crew styles
    crewGroup: {
        marginBottom: 12,
    } as ViewStyle,
    crewLabel: {
        color: Colors.metalSilver,
        fontSize: 12,
        textTransform: "uppercase",
        marginBottom: 4,
    } as TextStyle,
    crewNames: {
        color: "#f4f4f5",
        fontSize: 14,
    } as TextStyle,

    // Media list styles (cast, related content)
    horizontalList: {
        paddingHorizontal: 16,
        gap: 12,
    } as ViewStyle,
    mediaItem: {
        width: 100,
    } as ViewStyle,
    mediaImage: {
        width: 100,
        height: 150,
        borderRadius: 8,
    } as ImageStyle,
    mediaPlaceholder: {
        width: 100,
        height: 150,
        backgroundColor: Colors.metalGray,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    } as ViewStyle,
    mediaPlaceholderIcon: {
        fontSize: 32,
    } as TextStyle,
    mediaName: {
        color: "#f4f4f5",
        fontSize: 12,
        marginTop: 8,
        fontWeight: "600",
    } as TextStyle,
    mediaSubtitle: {
        color: Colors.metalSilver,
        fontSize: 10,
        marginTop: 2,
    } as TextStyle,

    // Button styles
    backButton: {
        position: "absolute",
        top: 16,
        left: 16,
        zIndex: 10,
        backgroundColor: "rgba(10, 10, 10, 0.5)",
        borderRadius: 9999,
        padding: 8,
    } as ViewStyle,
    backButtonText: {
        fontSize: 28,
        color: "#fff",
        fontWeight: "900",
        top: -5,
    } as TextStyle,
    recommendButton: {
        backgroundColor: Colors.bloodRed,
        paddingVertical: 8,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginVertical: 16,
    } as ViewStyle,
    recommendButtonContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    } as ViewStyle,
    recommendButtonText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: "bold",
        textTransform: "uppercase",
    } as TextStyle,

    // Spacing
    bottomSpacer: {
        height: 40,
    } as ViewStyle,
});

export default detailScreenStyles;
