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
    Modal,
    ScrollView,
    ViewStyle,
    TextStyle,
    ImageStyle,
} from "react-native";
import { MaterialCommunityIcons, Feather, Entypo, Ionicons } from "@expo/vector-icons";
import { useFocusEffect, router } from "expo-router";
import MovieCard from "../../src/components/MovieCard";
import { Image } from "expo-image";
import {
    getPopularMovies,
    getPopularTVShows,
    searchMovies,
    searchTVShows,
    getMovieGenres,
    getTVGenres,
    discoverMovies,
    discoverTVShows,
    getTVShowDetails,
    getImageUrl,
    Movie,
    TVShow,
    Genre,
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
    const [showProfileBanner, setShowProfileBanner] = useState(false);
    const [continueWatching, setContinueWatching] = useState<{ show: TVShow, progress: { watched: number, total: number } }[]>([]);
    const [loadingContinue, setLoadingContinue] = useState(false);
    const [showContinueSection, setShowContinueSection] = useState(true);

    // Filter State
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [genres, setGenres] = useState<Genre[]>([]);
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
    const [selectedYear, setSelectedYear] = useState<string>("");
    const [sortBy, setSortBy] = useState<string>("popularity.desc");
    const [filtersActive, setFiltersActive] = useState(false);

    const { user } = useAuthStore();
    const {
        fetchUserContent,
        isFavorite,
        isInWatchlist,
        isWatched,
        addToFavorites,
        removeFromFavorites,
        addToWatchlist,
        removeFromWatchlist,
        toggleWatched,
        tvProgress,
        fetchTVProgress,
    } = useContentStore();

    // Fetch content on mount
    useEffect(() => {
        loadContent();
        loadGenres();
    }, []);

    // Fetch user content when screen focuses
    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchUserContent();
                fetchTVProgress();
                // Check if user has generic username
                const { profile } = useAuthStore.getState();
                if (profile?.username?.startsWith("user_")) {
                    setShowProfileBanner(true);
                } else {
                    setShowProfileBanner(false);
                }
            }
        }, [user])
    );

    // Filter shows for "Continue Watching"
    useEffect(() => {
        if (activeTab === "tv" && user && tvProgress.length > 0) {
            loadContinueWatching();
        } else {
            setContinueWatching([]);
        }
    }, [activeTab, tvProgress.length, user]);

    const loadContinueWatching = async () => {
        setLoadingContinue(true);
        try {
            // Filter out movies (0,0) and fully watched shows (-1,-1)
            // Only keep entries that represent actual episode progress (season > 0)
            const actualProgress = tvProgress.filter(p => p.season_number > 0);

            // Get unique show IDs from actual progress
            const showIds = [...new Set(actualProgress.map(p => p.tmdb_id))];

            if (showIds.length === 0) {
                setContinueWatching([]);
                setLoadingContinue(false);
                return;
            }

            const showsWithDetails = await Promise.all(
                showIds.slice(0, 10).map(async (id) => {
                    try {
                        const show = await getTVShowDetails(id);
                        const watchedCount = tvProgress.filter(p => p.tmdb_id === id && p.season_number > 0).length;

                        // Check if show is already fully watched (optional logic, but good for cleanliness)
                        if (isWatched(id, "tv")) return null;

                        return {
                            show,
                            progress: {
                                watched: watchedCount,
                                total: show.number_of_episodes || 0
                            }
                        };
                    } catch (error) {
                        console.error(`Error fetching details for show ${id}:`, error);
                        return null;
                    }
                })
            );

            // Filter out nulls (failed fetches or already watched shows)
            setContinueWatching(showsWithDetails.filter(s => s !== null) as any);
        } catch (err) {
            console.error("Error loading continue watching:", err);
        } finally {
            setLoadingContinue(false);
        }
    };

    // Load content and genres when tab changes
    useEffect(() => {
        setPage(1);
        setHasMore(true);
        setSearchQuery("");
        // Reset filters when changing tabs to avoid confusion
        resetFilters(false);
        loadContent(true);
        loadGenres();
    }, [activeTab]);

    const loadGenres = async () => {
        try {
            const data = activeTab === "movies" ? await getMovieGenres() : await getTVGenres();

            // Sort genres alphabetically and clarify "Terror" as "Horror"
            const processedGenres = data.genres
                .map(g => ({
                    ...g,
                    name: g.name === "Terror" ? "Terror (Horror)" : g.name
                }))
                .sort((a, b) => a.name.localeCompare(b.name));

            setGenres(processedGenres);
        } catch (err) {
            console.error("Error loading genres:", err);
        }
    };

    const resetFilters = (reload: boolean = true) => {
        setSelectedGenre(null);
        setSelectedYear("");
        setSortBy("popularity.desc");
        setFiltersActive(false);
        if (reload) {
            loadContent(true);
        }
    };

    const applyFilters = () => {
        // Only activate filters if something is actually selected
        const hasActiveFilters = selectedGenre !== null || selectedYear.trim() !== "" || sortBy !== "popularity.desc";
        setFiltersActive(hasActiveFilters);

        setShowFilterModal(false);
        setPage(1);
        setHasMore(true);
        // Delay slightly to allow modal to close smoothly
        setTimeout(() => loadContent(true), 100);
    };

    const loadContent = async (reset: boolean = false) => {
        if (!reset && (!hasMore || loading)) return;

        setLoading(true);
        try {
            let results: any[] = [];
            let totalPages = 1;
            const currentPage = reset ? 1 : page;

            if (filtersActive && !searchQuery) {
                // Use Discover API
                const params = {
                    page: currentPage,
                    sort_by: sortBy,
                    with_genres: selectedGenre ? selectedGenre.toString() : undefined,
                    primary_release_year: activeTab === "movies" ? selectedYear : undefined,
                    first_air_date_year: activeTab === "tv" ? selectedYear : undefined,
                };

                if (activeTab === "movies") {
                    const response = await discoverMovies(params);
                    results = response.results;
                    totalPages = response.total_pages;
                } else {
                    const response = await discoverTVShows(params);
                    results = response.results;
                    totalPages = response.total_pages;
                }
            } else if (activeTab === "movies") {
                const response = await getPopularMovies(currentPage);
                results = response.results;
                totalPages = response.total_pages;
            } else {
                const response = await getPopularTVShows(currentPage);
                results = response.results;
                totalPages = response.total_pages;
            }

            if (activeTab === "movies") {
                if (reset) {
                    setMovies(results);
                } else {
                    setMovies((prev) => [...prev, ...results]);
                }
            } else {
                if (reset) {
                    setTVShows(results);
                } else {
                    setTVShows((prev) => [...prev, ...results]);
                }
            }

            setHasMore(currentPage < totalPages);
            setPage(reset ? 2 : currentPage + 1);

        } catch (err) {
            console.error("Error loading content:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            loadContent(true); // Will use filters if active
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

    const handleToggleWatched = async (tmdbId: number, mediaType: "movie" | "tv") => {
        await toggleWatched(tmdbId, mediaType);
    };

    const renderItem = ({ item }: { item: Movie | TVShow }) => (
        <MovieCard
            item={item}
            mediaType={activeTab === "movies" ? "movie" : "tv"}
            isFavorite={isFavorite(item.id, activeTab === "movies" ? "movie" : "tv")}
            inWatchlist={isInWatchlist(
                item.id,
                activeTab === "movies" ? "movie" : "tv"
            )}
            isWatched={isWatched(item.id, activeTab === "movies" ? "movie" : "tv")}
            onToggleFavorite={() =>
                handleToggleFavorite(item.id, activeTab === "movies" ? "movie" : "tv")
            }
            onToggleWatchlist={() =>
                handleToggleWatchlist(item.id, activeTab === "movies" ? "movie" : "tv")
            }
            onToggleWatched={() =>
                handleToggleWatched(item.id, activeTab === "movies" ? "movie" : "tv")
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

    const renderContinueWatching = () => {
        if (activeTab !== "tv" || continueWatching.length === 0 || !showContinueSection) return null;

        return (
            <View style={styles.continueSection}>
                <View style={styles.continueHeader}>
                    <Text style={styles.continueTitle}>Continuar Viendo</Text>
                    <TouchableOpacity onPress={() => setShowContinueSection(false)}>
                        <Ionicons name="close-circle" size={24} color={Colors.metalSilver} />
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={continueWatching}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => `${item.show.id}-${index}`}
                    contentContainerStyle={styles.continueList}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.continueCard}
                            onPress={() => router.push(`/tv/${item.show.id}`)}
                        >
                            <Image
                                source={{ uri: getImageUrl(item.show.poster_path, "w300") || undefined }}
                                style={styles.continueImage}
                                contentFit="cover"
                            />
                            <View style={styles.progressBarBg}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        { width: `${(item.progress.watched / Math.max(1, item.progress.total)) * 100}%` }
                                    ]}
                                />
                            </View>
                            <Text style={styles.continueText} numberOfLines={1}>{item.show.name}</Text>
                            <Text style={styles.continueProgress}>
                                {item.progress.watched}/{item.progress.total} eps
                            </Text>
                            {item.show.next_episode_to_air && (
                                <View style={styles.nextEpisodeBadge}>
                                    <Text style={styles.nextEpisodeText}>
                                        S{item.show.next_episode_to_air.season_number} E{item.show.next_episode_to_air.episode_number}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}
                />
            </View>
        );
    };

    return (
        <View style={[styles.safeArea, { paddingTop: 28 }]}>

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
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <MaterialCommunityIcons
                                name="movie-open-play-outline"
                                size={24}
                                color={activeTab === "movies" ? Colors.white : Colors.metalSilver}
                            />
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === "movies"
                                        ? styles.activeTabText
                                        : styles.inactiveTabText,
                                ]}
                            >
                                Películas
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === "tv" ? styles.activeTab : styles.inactiveTab,
                        ]}
                        onPress={() => setActiveTab("tv")}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <Feather
                                name="tv"
                                size={24}
                                color={activeTab === "tv" ? Colors.white : Colors.metalSilver}
                            />
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === "tv"
                                        ? styles.activeTabText
                                        : styles.inactiveTabText,
                                ]}
                            >
                                Series
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Profile Setup Banner */}
            {showProfileBanner && (
                <TouchableOpacity
                    style={styles.profileBanner}
                    onPress={() => router.push("/profile" as any)}
                >
                    <View style={styles.profileBannerContent}>
                        <Ionicons name="sparkles" size={20} color={Colors.white} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.profileBannerTitle}>¡Dale estilo a tu cuenta!</Text>
                            <Text style={styles.profileBannerSubtitle}>Cambia tu nombre de usuario genérico en tu perfil.</Text>
                        </View>
                        <TouchableOpacity onPress={(e) => {
                            e.stopPropagation();
                            setShowProfileBanner(false);
                        }}>
                            <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            )}

            {/* Search and Filter Row */}
            <View style={styles.controlsContainer}>
                <View style={styles.searchAndFilterRow}>
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
                            <Entypo name="magnifying-glass" size={24} color="#71717a" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.filterButtonCompact, filtersActive && styles.activeFilterButton]}
                        onPress={() => setShowFilterModal(true)}
                    >
                        <Ionicons
                            name="filter"
                            size={20}
                            color={filtersActive ? Colors.white : Colors.metalSilver}
                        />
                    </TouchableOpacity>
                </View>

                {filtersActive && (
                    <TouchableOpacity
                        style={styles.clearFiltersContainer}
                        onPress={() => resetFilters(true)}
                    >
                        <Text style={styles.clearFiltersText}>Limpiar filtros activos</Text>
                    </TouchableOpacity>
                )}
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
                    keyExtractor={(item, index) => `${item.id}-${index}`}
                    numColumns={3}
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

            {activeTab === 'tv' && renderContinueWatching()}

            {/* Filter Modal */}
            <Modal
                visible={showFilterModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Filtrar</Text>
                        <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalContent}>
                        {/* Sort By */}
                        <Text style={styles.sectionHeader}>Ordenar Por</Text>
                        <View style={styles.optionsRow}>
                            {[
                                { label: "Popularidad", value: "popularity.desc" },
                                { label: "Mejor Valorados", value: "vote_average.desc" },
                                { label: "Más Recientes", value: "primary_release_date.desc" }
                            ].map((opt) => (
                                <TouchableOpacity
                                    key={opt.value}
                                    style={[styles.optionChip, sortBy === opt.value && styles.activeOptionChip]}
                                    onPress={() => setSortBy(opt.value)}
                                >
                                    <Text style={[styles.optionText, sortBy === opt.value && styles.activeOptionText]}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Year */}
                        <Text style={styles.sectionHeader}>Año de Lanzamiento</Text>
                        <TextInput
                            style={styles.yearInput}
                            placeholder="Ej. 2023"
                            placeholderTextColor="#52525b"
                            keyboardType="number-pad"
                            value={selectedYear}
                            onChangeText={setSelectedYear}
                            maxLength={4}
                        />

                        {/* Genres */}
                        <Text style={styles.sectionHeader}>Género</Text>
                        <View style={styles.genresRow}>
                            {genres.map((genre) => (
                                <TouchableOpacity
                                    key={genre.id}
                                    style={[styles.genreChip, selectedGenre === genre.id && styles.activeGenreChip]}
                                    onPress={() => setSelectedGenre(selectedGenre === genre.id ? null : genre.id)}
                                >
                                    <Text style={[styles.genreChipText, selectedGenre === genre.id && styles.activeGenreText]}>
                                        {genre.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                            <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'transparent',
    } as ViewStyle,
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 8,
    } as ViewStyle,
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.metalGray,
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
    } as ViewStyle,
    activeFilterButton: {
        backgroundColor: Colors.bloodRed,
        borderColor: Colors.bloodRed,
    } as ViewStyle,
    filterButtonText: {
        color: Colors.metalSilver,
        fontWeight: 'bold',
    } as TextStyle,
    activeFilterButtonText: {
        color: Colors.white,
    } as TextStyle,
    clearFiltersText: {
        color: Colors.metalSilver,
        textDecorationLine: 'underline',
    } as TextStyle,
    controlsContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    } as ViewStyle,
    searchAndFilterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    } as ViewStyle,
    filterButtonCompact: {
        backgroundColor: Colors.metalGray,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
        justifyContent: 'center',
        alignItems: 'center',
    } as ViewStyle,
    clearFiltersContainer: {
        marginTop: 4,
        alignSelf: 'flex-end',
    } as ViewStyle,
    searchWrapper: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.metalGray,
        borderRadius: 8,
        borderColor: Colors.metalSilver,
        borderWidth: 1,
    } as ViewStyle,
    searchInput: {
        flex: 1,
        color: "#f4f4f5", // zinc-100
        paddingHorizontal: 16,
        paddingVertical: 12,
    } as TextStyle,
    searchButton: {
        paddingHorizontal: 16,
        paddingVertical: 6,
    } as ViewStyle,
    searchIcon: {
        fontSize: 20,
    } as TextStyle,
    tabsContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        marginTop: -28,
    } as ViewStyle,
    tabsWrapper: {
        flexDirection: "row",
        backgroundColor: Colors.metalGray,

        borderRadius: 9999, // full rounded
    } as ViewStyle,
    tab: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 9999,
    } as ViewStyle,
    activeTab: {
        backgroundColor: Colors.bloodRed,
    } as ViewStyle,
    inactiveTab: {
        backgroundColor: "transparent",
    } as ViewStyle,
    tabText: {
        textAlign: "center",
        fontWeight: "bold",
    } as TextStyle,
    activeTabText: {
        color: Colors.white,
    } as TextStyle,
    inactiveTabText: {
        color: Colors.metalSilver,
    } as TextStyle,
    centerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    } as ViewStyle,
    loadingText: {
        color: Colors.metalSilver,
        marginTop: 16,
    } as TextStyle,
    emptyIcon: {
        fontSize: 60,
        marginBottom: 16,
    } as TextStyle,
    emptyText: {
        color: Colors.metalSilver,
        fontSize: 18,
    } as TextStyle,
    columnWrapper: {
        paddingHorizontal: 8,
        justifyContent: "flex-start",
        gap: 8,
    } as ViewStyle,
    listContent: {
        paddingBottom: 20,
    } as ViewStyle,
    footerContainer: {
        paddingVertical: 16,
    } as ViewStyle,
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
        padding: 16,
    } as ViewStyle,
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    } as ViewStyle,
    modalTitle: {
        color: "#f4f4f5",
        fontSize: 24,
        fontWeight: "bold",
        fontFamily: "BebasNeue_400Regular",
    } as TextStyle,
    closeButtonText: {
        color: Colors.bloodRed,
        fontSize: 20,
    } as TextStyle,
    modalContent: {
        paddingBottom: 40,
    } as ViewStyle,
    sectionHeader: {
        color: Colors.metalSilver,
        fontSize: 14,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 12,
        marginTop: 16,
    } as TextStyle,
    optionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    } as ViewStyle,
    optionChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 9999,
        backgroundColor: Colors.metalGray,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
    } as ViewStyle,
    activeOptionChip: {
        backgroundColor: Colors.bloodRed,
        borderColor: Colors.bloodRed,
    } as ViewStyle,
    optionText: {
        color: '#f4f4f5',
    } as TextStyle,
    activeOptionText: {
        color: Colors.white,
        fontWeight: "bold",
    } as TextStyle,
    yearInput: {
        backgroundColor: Colors.metalGray,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
        borderRadius: 8,
        padding: 12,
        color: '#f4f4f5',
        fontSize: 16,
    } as TextStyle,
    genresRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    } as ViewStyle,
    genreChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: Colors.metalGray,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
    } as ViewStyle,
    activeGenreChip: {
        backgroundColor: Colors.bloodRed,
        borderColor: Colors.bloodRed,
    } as ViewStyle,
    genreChipText: {
        color: '#f4f4f5',
        fontSize: 12,
    } as TextStyle,
    activeGenreText: {
        color: Colors.white,
        fontWeight: 'bold',
    } as TextStyle,
    modalFooter: {
        paddingTop: 16,
    } as ViewStyle,
    applyButton: {
        backgroundColor: Colors.bloodRed,
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    } as ViewStyle,
    applyButtonText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 16,
        textTransform: 'uppercase',
    } as TextStyle,
    profileBanner: {
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: Colors.bloodRed,
        borderRadius: 8,
        padding: 12,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    } as ViewStyle,
    profileBannerContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    } as ViewStyle,
    profileBannerTitle: {
        color: Colors.white,
        fontWeight: "bold",
        fontSize: 14,
    } as TextStyle,
    profileBannerSubtitle: {
        color: "rgba(255,255,255,0.9)",
        fontSize: 12,
    } as TextStyle,
    continueSection: {
        paddingVertical: 12,
        backgroundColor: "rgba(0,0,0,0.4)",
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        marginBottom: 4,
    } as ViewStyle,
    continueHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 8,
    } as ViewStyle,
    continueTitle: {
        color: Colors.white,
        fontSize: 14,
        fontFamily: "BebasNeue_400Regular",
        letterSpacing: 1,
    } as TextStyle,
    continueList: {
        paddingHorizontal: 16,
        gap: 12,
    } as ViewStyle,
    continueCard: {
        width: 80,
    } as ViewStyle,
    continueImage: {
        width: 60,
        height: 80,
        borderRadius: 4,
        backgroundColor: Colors.metalGray,
    } as ImageStyle,
    progressBarBg: {
        height: 3,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 1.5,
        marginTop: 6,
        overflow: 'hidden',
    } as ViewStyle,
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.bloodRed,
    } as ViewStyle,
    continueText: {
        color: Colors.white,
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 4,
    } as TextStyle,
    continueProgress: {
        color: Colors.metalSilver,
        fontSize: 9,
        marginTop: 1,
    } as TextStyle,
    nextEpisodeBadge: {
        backgroundColor: "rgba(234, 179, 8, 0.2)",
        padding: 2,
        borderRadius: 2,
        marginTop: 4,
        borderWidth: 0.5,
        borderColor: "rgba(234, 179, 8, 0.5)",
    } as ViewStyle,
    nextEpisodeText: {
        color: "#ffffffff",
        fontSize: 11,
        fontWeight: "bold",
        textAlign: 'center',
    } as TextStyle,
});
