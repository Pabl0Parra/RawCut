import { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    TextInput,
    RefreshControl,
    StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import MovieCard from "../../src/components/MovieCard";
import {
    getPopularMovies,
    getPopularTVShows,
    searchMovies,
    searchTVShows,
    Movie,
    TVShow,
} from "../../src/lib/tmdb";
import { useContentStore } from "../../src/stores/contentStore";
import { useAuthStore } from "../../src/stores/authStore";
import { Colors } from "../../src/constants/Colors";

export default function HomeScreen() {
    const [activeTab, setActiveTab] = useState<"movies" | "tv">("movies");
    const [movies, setMovies] = useState<Movie[]>([]);
    const [tvShows, setTVShows] = useState<TVShow[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const { user } = useAuthStore();
    const {
        fetchUserContent,
        isFavorite,
        isInWatchlist,
        addToFavorites,
        removeFromFavorites,
        addToWatchlist,
        removeFromWatchlist,
    } = useContentStore();

    // Fetch content on mount
    useEffect(() => {
        loadContent();
    }, []);

    // Fetch user content when screen focuses
    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchUserContent();
            }
        }, [user])
    );

    // Load content when tab changes
    useEffect(() => {
        setPage(1);
        setHasMore(true);
        setSearchQuery("");
        loadContent(true);
    }, [activeTab]);

    const loadContent = async (reset: boolean = false) => {
        if (!reset && (!hasMore || loading)) return;

        setLoading(true);
        try {
            if (activeTab === "movies") {
                const response = await getPopularMovies(reset ? 1 : page);
                if (reset) {
                    setMovies(response.results);
                } else {
                    setMovies((prev) => [...prev, ...response.results]);
                }
                setHasMore(response.page < response.total_pages);
                setPage(reset ? 2 : page + 1);
            } else {
                const response = await getPopularTVShows(reset ? 1 : page);
                if (reset) {
                    setTVShows(response.results);
                } else {
                    setTVShows((prev) => [...prev, ...response.results]);
                }
                setHasMore(response.page < response.total_pages);
                setPage(reset ? 2 : page + 1);
            }
        } catch (err) {
            console.error("Error loading content:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            loadContent(true);
            return;
        }

        setIsSearching(true);
        setLoading(true);
        try {
            if (activeTab === "movies") {
                const response = await searchMovies(searchQuery);
                setMovies(response.results);
            } else {
                const response = await searchTVShows(searchQuery);
                setTVShows(response.results);
            }
            setHasMore(false); // Disable pagination for search results
        } catch (err) {
            console.error("Error searching:", err);
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        setPage(1);
        setHasMore(true);
        setSearchQuery("");
        await loadContent(true);
        setRefreshing(false);
    };

    const handleToggleFavorite = async (
        tmdbId: number,
        mediaType: "movie" | "tv"
    ) => {
        if (!user) return;
        if (isFavorite(tmdbId, mediaType)) {
            await removeFromFavorites(tmdbId, mediaType);
        } else {
            await addToFavorites(tmdbId, mediaType);
        }
    };

    const handleToggleWatchlist = async (
        tmdbId: number,
        mediaType: "movie" | "tv"
    ) => {
        if (!user) return;
        if (isInWatchlist(tmdbId, mediaType)) {
            await removeFromWatchlist(tmdbId, mediaType);
        } else {
            await addToWatchlist(tmdbId, mediaType);
        }
    };

    const data = activeTab === "movies" ? movies : tvShows;

    const renderItem = ({ item }: { item: Movie | TVShow }) => (
        <MovieCard
            item={item}
            mediaType={activeTab === "movies" ? "movie" : "tv"}
            isFavorite={isFavorite(item.id, activeTab === "movies" ? "movie" : "tv")}
            inWatchlist={isInWatchlist(
                item.id,
                activeTab === "movies" ? "movie" : "tv"
            )}
            onToggleFavorite={() =>
                handleToggleFavorite(item.id, activeTab === "movies" ? "movie" : "tv")
            }
            onToggleWatchlist={() =>
                handleToggleWatchlist(item.id, activeTab === "movies" ? "movie" : "tv")
            }
        />
    );

    const renderFooter = () => {
        if (!loading || data.length === 0) return null;
        return (
            <View style={styles.footerContainer}>
                <ActivityIndicator size="small" color="#dc2626" />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchWrapper}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar..."
                        placeholderTextColor="#71717a"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                    <TouchableOpacity
                        style={styles.searchButton}
                        onPress={handleSearch}
                    >
                        <Text style={styles.searchIcon}>🔍</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Pill Tab System */}
            <View style={styles.tabsContainer}>
                <View style={styles.tabsWrapper}>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === "movies" ? styles.activeTab : styles.inactiveTab,
                        ]}
                        onPress={() => setActiveTab("movies")}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === "movies"
                                    ? styles.activeTabText
                                    : styles.inactiveTabText,
                            ]}
                        >
                            🎬 Películas
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === "tv" ? styles.activeTab : styles.inactiveTab,
                        ]}
                        onPress={() => setActiveTab("tv")}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === "tv"
                                    ? styles.activeTabText
                                    : styles.inactiveTabText,
                            ]}
                        >
                            📺 Series
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content List */}
            {loading && data.length === 0 ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#dc2626" />
                    <Text style={styles.loadingText}>Cargando contenido...</Text>
                </View>
            ) : data.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyIcon}>🎬</Text>
                    <Text style={styles.emptyText}>
                        No se encontraron resultados
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={data}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onEndReached={() => !isSearching && loadContent()}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor="#dc2626"
                            colors={["#dc2626"]}
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 8,
    },
    searchWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.metalGray,
        borderRadius: 8,
        borderColor: Colors.metalSilver,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        color: "#f4f4f5", // zinc-100
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchButton: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchIcon: {
        fontSize: 20,
    },
    tabsContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    tabsWrapper: {
        flexDirection: "row",
        backgroundColor: Colors.metalGray,
        padding: 4,
        borderRadius: 9999, // full rounded
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 9999,
    },
    activeTab: {
        backgroundColor: Colors.bloodRed,
    },
    inactiveTab: {
        backgroundColor: "transparent",
    },
    tabText: {
        textAlign: "center",
        fontWeight: "bold",
    },
    activeTabText: {
        color: Colors.metalBlack,
    },
    inactiveTabText: {
        color: Colors.metalSilver,
    },
    centerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        color: Colors.metalSilver,
        marginTop: 16,
    },
    emptyIcon: {
        fontSize: 60,
        marginBottom: 16,
    },
    emptyText: {
        color: Colors.metalSilver,
        fontSize: 18,
    },
    columnWrapper: {
        paddingHorizontal: 12,
        justifyContent: "space-between",
    },
    listContent: {
        paddingBottom: 20,
    },
    footerContainer: {
        paddingVertical: 16,
    },
});
