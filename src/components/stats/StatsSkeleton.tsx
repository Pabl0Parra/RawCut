import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Skeleton } from "../Skeleton";
import { Colors } from "../../constants/Colors";

export const StatsSkeleton = () => (
    <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            <View style={styles.row}>
                <Skeleton width="48%" height={110} borderRadius={8} />
                <Skeleton width="48%" height={110} borderRadius={8} />
            </View>

            <View style={styles.row}>
                <Skeleton width="48%" height={110} borderRadius={8} />
                <Skeleton width="48%" height={110} borderRadius={8} />
            </View>

            <View style={styles.row}>
                <Skeleton width="48%" height={110} borderRadius={8} />
                <Skeleton width="48%" height={110} borderRadius={8} />
            </View>

            <Skeleton width="100%" height={100} borderRadius={8} style={{ marginBottom: 16 }} />
            <Skeleton width="100%" height={100} borderRadius={8} style={{ marginBottom: 16 }} />

            <Skeleton width="100%" height={130} borderRadius={8} style={{ marginBottom: 16 }} />
            <Skeleton width="100%" height={130} borderRadius={8} style={{ marginBottom: 16 }} />

            <View style={styles.row}>
                <Skeleton width="48%" height={110} borderRadius={8} />
                <Skeleton width="48%" height={110} borderRadius={8} />
            </View>

            <Skeleton width="100%" height={110} borderRadius={8} style={{ marginBottom: 16 }} />
            <Skeleton width="100%" height={110} borderRadius={8} style={{ marginBottom: 16 }} />

            <Skeleton width="100%" height={250} borderRadius={8} style={{ marginBottom: 16 }} />

            <View style={styles.footerSpacer} />
        </ScrollView>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },

    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    footerSpacer: {
        height: 40,
    },
});
