import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuthStore } from "../../src/stores/authStore";
import { Colors } from "../../src/constants/Colors";

export default function ProfileScreen() {
    const { user, profile, signOut, isLoading } = useAuthStore();

    // Beer milestone calculation
    const getBeerBadge = (points: number) => {
        if (points >= 50) return "🍺🍺🍺";
        if (points >= 25) return "🍺🍺";
        if (points >= 10) return "🍺";
        return "";
    };

    const handleSignOut = async () => {
        await signOut();
        router.replace("/login");
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.container}>
                    {/* Avatar placeholder */}
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarIcon}>👤</Text>
                    </View>

                    {/* Username */}
                    <Text
                        style={[styles.username, { fontFamily: "BebasNeue_400Regular" }]}
                    >
                        {profile?.username || user?.email || "Usuario"}
                    </Text>

                    {/* Email */}
                    {user?.email && (
                        <Text style={styles.emailText}>
                            {user.email}
                        </Text>
                    )}

                    {/* Points */}
                    <View style={styles.pointsContainer}>
                        <Text style={styles.pointsText}>
                            🏆 {profile?.points || 0} puntos
                        </Text>
                    </View>

                    {/* Beer badge */}
                    {(profile?.points || 0) >= 10 && (
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>
                                Este usuario merece una cerveza{" "}
                                {getBeerBadge(profile?.points || 0)}
                            </Text>
                        </View>
                    )}

                    {/* Action buttons */}
                    <View style={styles.actionButtonsContainer}>
                        {!user ? (
                            <>
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={() => router.push("/login")}
                                >
                                    <Text style={styles.primaryButtonText}>
                                        Iniciar Sesión
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.secondaryButton}
                                    onPress={() => router.push("/register")}
                                >
                                    <Text style={styles.secondaryButtonText}>
                                        Registrarse
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <TouchableOpacity
                                style={[
                                    styles.logoutButton,
                                    isLoading && styles.disabledButton,
                                ]}
                                onPress={handleSignOut}
                                disabled={isLoading}
                            >
                                <Text style={styles.logoutButtonText}>
                                    Cerrar Sesión
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Stats section */}
                    <View style={styles.statsSection}>
                        <Text style={styles.sectionTitle}>
                            Estadísticas
                        </Text>
                        <View style={styles.statsCard}>
                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Favoritos</Text>
                                <Text style={styles.statValue}>0</Text>
                            </View>
                            <View style={[styles.statRow, styles.statBorder]}>
                                <Text style={styles.statLabel}>Watchlist</Text>
                                <Text style={styles.statValue}>0</Text>
                            </View>
                            <View style={[styles.statRow, styles.statBorder]}>
                                <Text style={styles.statLabel}>Recomendaciones enviadas</Text>
                                <Text style={styles.statValue}>0</Text>
                            </View>
                            <View style={[styles.statRow, styles.statBorder]}>
                                <Text style={styles.statLabel}>Recomendaciones recibidas</Text>
                                <Text style={styles.statValue}>0</Text>
                            </View>
                        </View>
                    </View>

                    {/* Point milestones */}
                    <View style={styles.milestoneSection}>
                        <Text style={styles.sectionTitle}>
                            Hitos de Cerveza 🍺
                        </Text>
                        <View style={styles.statsCard}>
                            <View style={styles.milestoneRow}>
                                <Text style={styles.milestoneIcon}>🍺</Text>
                                <Text style={styles.milestoneText}>10 puntos</Text>
                                <Text
                                    style={
                                        (profile?.points || 0) >= 10
                                            ? styles.milestoneCompleted
                                            : styles.milestonePending
                                    }
                                >
                                    {(profile?.points || 0) >= 10 ? "✓" : `${profile?.points || 0}/10`}
                                </Text>
                            </View>
                            <View style={[styles.milestoneRow, styles.statBorder]}>
                                <Text style={styles.milestoneIcon}>🍺🍺</Text>
                                <Text style={styles.milestoneText}>25 puntos</Text>
                                <Text
                                    style={
                                        (profile?.points || 0) >= 25
                                            ? styles.milestoneCompleted
                                            : styles.milestonePending
                                    }
                                >
                                    {(profile?.points || 0) >= 25 ? "✓" : `${profile?.points || 0}/25`}
                                </Text>
                            </View>
                            <View style={[styles.milestoneRow, styles.statBorder]}>
                                <Text style={styles.milestoneIcon}>🍺🍺🍺</Text>
                                <Text style={styles.milestoneText}>50 puntos</Text>
                                <Text
                                    style={
                                        (profile?.points || 0) >= 50
                                            ? styles.milestoneCompleted
                                            : styles.milestonePending
                                    }
                                >
                                    {(profile?.points || 0) >= 50 ? "✓" : `${profile?.points || 0}/50`}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
    },
    container: {
        alignItems: "center",
        padding: 24,
    },
    avatarContainer: {
        width: 96,
        height: 96,
        backgroundColor: Colors.metalGray,
        borderRadius: 48,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        borderWidth: 2,
        borderColor: Colors.bloodRed,
    },
    avatarIcon: {
        fontSize: 36, // ~text-4xl
    },
    username: {
        color: "#f4f4f5", // zinc-100
        fontSize: 24,
        fontWeight: "bold",
    },
    emailText: {
        color: Colors.metalSilver,
        fontSize: 14,
        marginTop: 4,
    },
    pointsContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 16,
    },
    pointsText: {
        color: Colors.metalGold,
        fontSize: 20,
    },
    badgeContainer: {
        marginTop: 16,
        backgroundColor: Colors.metalGray,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    badgeText: {
        color: "#f97316", // orange-500
        fontSize: 18,
        textAlign: "center",
    },
    actionButtonsContainer: {
        width: "100%",
        marginTop: 32,
        paddingHorizontal: 16,
    },
    primaryButton: {
        backgroundColor: Colors.bloodRed,
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 4,
        marginBottom: 16,
    },
    primaryButtonText: {
        color: Colors.metalBlack,
        fontWeight: "bold",
        textAlign: "center",
        textTransform: "uppercase",
    },
    secondaryButton: {
        backgroundColor: Colors.metalGray,
        borderColor: Colors.metalSilver,
        borderWidth: 1,
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 4,
    },
    secondaryButtonText: {
        color: "#f4f4f5", // zinc-100
        fontWeight: "bold",
        textAlign: "center",
        textTransform: "uppercase",
    },
    logoutButton: {
        backgroundColor: Colors.metalGray,
        borderColor: Colors.bloodRed,
        borderWidth: 1,
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 4,
    },
    disabledButton: {
        opacity: 0.5,
    },
    logoutButtonText: {
        color: Colors.bloodRed,
        fontWeight: "bold",
        textAlign: "center",
        textTransform: "uppercase",
    },
    statsSection: {
        width: "100%",
        marginTop: 32,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        color: Colors.metalSilver,
        fontSize: 14,
        textTransform: "uppercase",
        letterSpacing: 0.5, // tracking-wider
        marginBottom: 16,
    },
    statsCard: {
        backgroundColor: Colors.metalGray,
        borderRadius: 8,
        padding: 16,
        borderColor: Colors.metalSilver,
        borderWidth: 1,
    },
    statRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
    },
    statBorder: {
        borderTopColor: Colors.metalSilver,
        borderTopWidth: 1,
    },
    statLabel: {
        color: Colors.metalSilver,
    },
    statValue: {
        color: "#f4f4f5", // zinc-100
        fontWeight: "bold",
    },
    milestoneSection: {
        width: "100%",
        marginTop: 32,
        paddingHorizontal: 16,
        marginBottom: 32,
    },
    milestoneRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
    },
    milestoneIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    milestoneText: {
        color: "#f4f4f5", // zinc-100
        flex: 1,
    },
    milestoneCompleted: {
        color: "#22c55e", // green-500
    },
    milestonePending: {
        color: Colors.metalSilver,
    },
});
