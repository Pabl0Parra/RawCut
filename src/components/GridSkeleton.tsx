import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Skeleton } from "./Skeleton";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - 48) / 2;

export const GridSkeleton = ({ rows = 3 }) => (
    <View style={styles.container}>
        {new Array(rows).fill(null).map((_, rowIndex) => (
            <View key={`skeleton-row-${rowIndex}`} style={styles.row}>
                <View style={styles.item}>
                    <Skeleton width={COLUMN_WIDTH} height={COLUMN_WIDTH * 1.5} borderRadius={12} />
                    <Skeleton width={COLUMN_WIDTH * 0.8} height={20} borderRadius={4} style={{ marginTop: 8 }} />
                </View>
                <View style={styles.item}>
                    <Skeleton width={COLUMN_WIDTH} height={COLUMN_WIDTH * 1.5} borderRadius={12} />
                    <Skeleton width={COLUMN_WIDTH * 0.8} height={20} borderRadius={4} style={{ marginTop: 8 }} />
                </View>
            </View>
        ))}
    </View>
);

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    item: {
        width: COLUMN_WIDTH,
    },
});
