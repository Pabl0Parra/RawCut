import { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Modal,
    TextInput,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getTVShowDetails, getRelatedTVShows, getTVSeasonDetails, getTVVideos, getImageUrl, TVShow, Season, Episode, Video } from "../../../src/lib/tmdb";
import { useContentStore } from "../../../src/stores/contentStore";
import { useAuthStore } from "../../../src/stores/authStore";
import { supabase, Profile } from "../../../src/lib/supabase";
import { Colors } from "../../../src/constants/Colors";
import TrailerModal from "../../../src/components/TrailerModal";

const { width } = Dimensions.get("window");

export default function TVDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [tvShow, setTVShow] = useState<(TVShow & { genres: { id: number; name: string }[] }) | null>(null);
    const [relatedTVShows, setRelatedTVShows] = useState<TVShow[]>([]);
    const [trailerKey, setTrailerKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showRecommendModal, setShowRecommendModal] = useState(false);
    const [recommendMessage, setRecommendMessage] = useState("");
    const [searchUsers, setSearchUsers] = useState("");
    const [users, setUsers] = useState<Profile[]>([]);
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [sendingRecommendation, setSendingRecommendation] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [showUserList, setShowUserList] = useState(true);
    const [showTrailerModal, setShowTrailerModal] = useState(false);

    // Season Details State
    const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number | null>(null);
    const [seasonEpisodes, setSeasonEpisodes] = useState<Episode[]>([]); // Use correct type if available
    const [loadingSeason, setLoadingSeason] = useState(false);
    const [showSeasonModal, setShowSeasonModal] = useState(false);

    // Episode Details Modal State
    const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
    const [showEpisodeModal, setShowEpisodeModal] = useState(false);

    const { user } = useAuthStore();
    const {
        isFavorite,
        isInWatchlist,
        addToFavorites,
        removeFromFavorites,
        addToWatchlist,
        removeFromWatchlist,
        fetchTVProgress,
        isEpisodeWatched,
        isSeasonWatched,
        isWatched,
        getNextEpisodeToWatch,
        toggleEpisodeWatched,
        toggleWatched,
    } = useContentStore();

    useEffect(() => {
        if (id) {
            loadTVShow(Number.parseInt(id));
            if (user) {
                fetchTVProgress();
            }
        }
    }, [id, user]);

    const loadTVShow = async (tvId: number) => {
        setLoading(true);
        try {
            const data = await getTVShowDetails(tvId);
            setTVShow(data);

            const related = await getRelatedTVShows(tvId);
            setRelatedTVShows(related.results);

            const videos = await getTVVideos(tvId);
            const trailer = videos.results.find(
                v => v.type === "Trailer" && v.site === "YouTube" && v.official
            ) || videos.results.find(v => v.type === "Trailer" && v.site === "YouTube");

            if (trailer) {
                setTrailerKey(trailer.key);
            }
        } catch (err) {
            console.error("Error loading TV show:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFavorite = async () => {
        if (!tvShow || !user) return;
        if (isFavorite(tvShow.id, "tv")) {
            await removeFromFavorites(tvShow.id, "tv");
        } else {
            await addToFavorites(tvShow.id, "tv");
        }
    };

    const handleToggleWatchlist = async () => {
        if (!tvShow || !user) return;
        if (isInWatchlist(tvShow.id, "tv")) {
            await removeFromWatchlist(tvShow.id, "tv");
        } else {
            await addToWatchlist(tvShow.id, "tv");
        }
    };

    const searchForUsers = async (query: string) => {
        setLoadingUsers(true);
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .ilike("username", `%${query}%`)
                .neq("user_id", user?.id)
                .limit(10);

            if (data) {
                setUsers(data);
            }
        } catch (err) {
            console.error("Error searching users:", err);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleSendRecommendation = async () => {
        if (!tvShow || !user || !selectedUser) return;

        setSendingRecommendation(true);
        try {
            // Debug logs
            const { data: sessionData } = await supabase.auth.getSession();
            console.log("Current Auth ID:", sessionData.session?.user?.id);
            console.log("Sending Recommendation as:", user.id);
            console.log("To Receiver:", selectedUser.user_id);

            const { data, error } = await supabase.from("recommendations").insert({
                sender_id: user.id,
                receiver_id: selectedUser.user_id,
                tmdb_id: tvShow.id,
                media_type: "tv",
                message: recommendMessage || null,
            }).select();

            if (error) {
                console.error("Supabase insert error details:", error);
                throw error;
            }

            console.log("Insert success data:", data);

            setShowRecommendModal(false);
            setRecommendMessage("");
            setSelectedUser(null);
            setSearchUsers("");
            alert("¡Recomendación enviada!");
        } catch (err) {
            console.error("Error sending recommendation:", err);
            alert("Error al enviar recomendación");
        } finally {
            setSendingRecommendation(false);
        }
    };

    const openSeasonDetails = async (seasonNumber: number) => {
        if (!tvShow) return;

        setSelectedSeasonNumber(seasonNumber);
        setShowSeasonModal(true);
        setLoadingSeason(true);

        try {
            const data = await getTVSeasonDetails(tvShow.id, seasonNumber);
            setSeasonEpisodes(data.episodes);
        } catch (err) {
            console.error("Error loading season details:", err);
            alert("Error al cargar episodios");
        } finally {
            setLoadingSeason(false);
        }
    };

    const handleToggleEpisode = async (episodeNumber: number) => {
        if (!tvShow || !selectedSeasonNumber) return;
        await toggleEpisodeWatched(tvShow.id, selectedSeasonNumber, episodeNumber);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#dc2626" />
                </View>
            </SafeAreaView>
        );
    }

    if (!tvShow) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>Serie no encontrada</Text>
                </View>
            </SafeAreaView>
        );
    }

    const handleWatchTrailer = () => {
        if (trailerKey) {
            setShowTrailerModal(true);
        }
    };

    const backdropUrl = getImageUrl(tvShow.backdrop_path, "original");
    const posterUrl = getImageUrl(tvShow.poster_path, "w300");

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Back button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>

                {/* Next episode badge */}
                {tvShow.seasons && (
                    (() => {
                        const next = getNextEpisodeToWatch(tvShow.id, tvShow.seasons.map(s => ({
                            season_number: s.season_number,
                            episode_count: s.episode_count
                        })));
                        return next ? (
                            <View style={styles.nextBadgeContainer}>
                                <Text style={styles.nextBadgeLabel}>SIGUIENTE</Text>
                                <Text style={styles.nextBadgeValue}>S{next.season} E{next.episode}</Text>
                            </View>
                        ) : null;
                    })()
                )}

                {/* Backdrop with Trailer Button */}
                <View style={{ position: "relative" }}>
                    {backdropUrl ? (
                        <Image
                            source={{ uri: backdropUrl }}
                            style={{ width, height: width * 0.56 }}
                            contentFit="cover"
                        />
                    ) : (
                        <View
                            style={[styles.backdropPlaceholder, { width, height: width * 0.56 }]}
                        />
                    )}

                    {trailerKey && (
                        <TouchableOpacity
                            style={styles.playButtonOverlay}
                            onPress={handleWatchTrailer}
                        >
                            <Ionicons name="play-circle" size={80} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.playTrailerText}>Ver Trailer</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Content */}
                <View style={styles.contentContainer}>
                    <View style={styles.headerRow}>
                        {/* Poster */}
                        {posterUrl ? (
                            <Image
                                source={{ uri: posterUrl }}
                                style={styles.poster}
                                contentFit="cover"
                            />
                        ) : (
                            <View style={styles.posterPlaceholder}>
                                <Text style={styles.posterPlaceholderIcon}>📺</Text>
                            </View>
                        )}

                        {/* Title and info */}
                        <View style={styles.infoContainer}>
                            <Text
                                style={[styles.title, { fontFamily: "BebasNeue_400Regular" }]}
                            >
                                {tvShow.name}
                            </Text>
                            <Text style={styles.yearText}>
                                {tvShow.first_air_date?.split("-")[0]}
                            </Text>
                            <Text style={styles.ratingText}>
                                ⭐ {tvShow.vote_average.toFixed(1)}/10
                            </Text>
                        </View>
                    </View>

                    {/* Genres */}
                    <View style={styles.genresContainer}>
                        {tvShow.genres?.map((genre) => (
                            <View
                                key={genre.id}
                                style={styles.genreBadge}
                            >
                                <Text style={styles.genreText}>{genre.name}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Action buttons */}
                    {user && (
                        <View style={styles.actionButtonsRow}>
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    isFavorite(tvShow.id, "tv")
                                        ? styles.activeButton
                                        : styles.inactiveButton,
                                ]}
                                onPress={handleToggleFavorite}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Ionicons
                                        name={isFavorite(tvShow.id, "tv") ? "skull" : "skull-outline"}
                                        size={20}
                                        color={isFavorite(tvShow.id, "tv") ? Colors.white : "#f4f4f5"}
                                    />
                                    <Text
                                        style={
                                            isFavorite(tvShow.id, "tv")
                                                ? styles.activeButtonText
                                                : styles.inactiveButtonText
                                        }
                                        numberOfLines={1}
                                    >
                                        {isFavorite(tvShow.id, "tv") ? "En Favoritos" : "Añadir"}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    isInWatchlist(tvShow.id, "tv")
                                        ? styles.activeButton
                                        : styles.inactiveButton,
                                ]}
                                onPress={handleToggleWatchlist}
                            >
                                <View style={{ flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: 6 }}>
                                    <MaterialCommunityIcons
                                        name={isInWatchlist(tvShow.id, "tv") ? "sword-cross" : "sword"}
                                        size={20}
                                        color={isInWatchlist(tvShow.id, "tv") ? Colors.white : "#f4f4f5"}
                                    />
                                    <Text
                                        style={
                                            isInWatchlist(tvShow.id, "tv")
                                                ? styles.activeButtonText
                                                : styles.inactiveButtonText
                                        }
                                        numberOfLines={1}
                                    >
                                        {isInWatchlist(tvShow.id, "tv")
                                            ? "En Lista"
                                            : "Watchlist"}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    isWatched(tvShow.id, "tv")
                                        ? styles.activeButton
                                        : styles.inactiveButton,
                                ]}
                                onPress={() => toggleWatched(tvShow.id, "tv")}
                            >
                                <View style={{ flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: 6 }}>
                                    <Ionicons
                                        name={isWatched(tvShow.id, "tv") ? "eye" : "eye-outline"}
                                        size={20}
                                        color={isWatched(tvShow.id, "tv") ? Colors.white : "#f4f4f5"}
                                    />
                                    <Text
                                        style={
                                            isWatched(tvShow.id, "tv")
                                                ? styles.activeButtonText
                                                : styles.inactiveButtonText
                                        }
                                        numberOfLines={1}
                                    >
                                        {isWatched(tvShow.id, "tv") ? "Ya Visto" : "Marcar Visto"}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Recommend button */}
                    {user && (
                        <TouchableOpacity
                            style={styles.recommendButton}
                            onPress={async () => {
                                setSelectedUser(null);
                                setSearchUsers("");
                                setShowRecommendModal(true);
                                // Load all users immediately
                                setLoadingUsers(true);
                                try {
                                    const { data, error } = await supabase
                                        .from("profiles")
                                        .select("*")
                                        .neq("user_id", user?.id)
                                        .order("username", { ascending: true })
                                        .limit(50);

                                    if (error) {
                                        console.error("Supabase error loading users:", error);
                                        alert(`Error loading users: ${error.message}`);
                                    } else {
                                        console.log("Loaded users:", data?.length || 0);
                                        setUsers(data || []);
                                    }
                                } catch (err) {
                                    console.error("Error loading users:", err);
                                    alert("Error loading users");
                                } finally {
                                    setLoadingUsers(false);
                                }
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <MaterialCommunityIcons name="email-outline" size={24} color={Colors.white} />
                                <Text style={styles.recommendButtonText}>
                                    Recomendar
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* Description */}
                    <View style={styles.descriptionContainer}>
                        <Text
                            style={[styles.descriptionTitle, { fontFamily: "BebasNeue_400Regular" }]}
                        >
                            Sinopsis
                        </Text>
                        <Text style={styles.descriptionText}>
                            {tvShow.overview || "Sin descripción disponible"}
                        </Text>
                    </View>

                    {/* Crew Info (Creators & Producers) */}
                    <View style={styles.sectionContainer}>
                        {tvShow.created_by && tvShow.created_by.length > 0 && (
                            <View style={{ marginBottom: 12 }}>
                                <Text style={[styles.sectionTitle, { fontFamily: "BebasNeue_400Regular", fontSize: 16, marginBottom: 4 }]}>
                                    Creación
                                </Text>
                                <Text style={{ color: "#f4f4f5", fontSize: 14 }}>
                                    {tvShow.created_by.map(c => c.name).join(", ")}
                                </Text>
                            </View>
                        )}
                        {tvShow.credits && tvShow.credits.crew.filter(c => c.job === "Producer" || c.job === "Executive Producer").length > 0 && (
                            <View>
                                <Text style={[styles.sectionTitle, { fontFamily: "BebasNeue_400Regular", fontSize: 16, marginBottom: 4 }]}>
                                    Producción
                                </Text>
                                <Text style={{ color: "#f4f4f5", fontSize: 14 }}>
                                    {tvShow.credits.crew
                                        .filter(c => c.job === "Producer" || c.job === "Executive Producer")
                                        .slice(0, 3) // Limit to 3 producers for brevity
                                        .map(p => p.name).join(", ")}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Seasons */}
                    {tvShow.seasons && tvShow.seasons.length > 0 && (
                        <View style={styles.sectionContainer}>
                            <Text
                                style={[styles.sectionTitle, { fontFamily: "BebasNeue_400Regular" }]}
                            >
                                Temporadas
                            </Text>
                            <FlatList
                                data={tvShow.seasons}
                                keyExtractor={(item, index) => `${item.id}-${index}`}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.seasonList}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.seasonItem}
                                        onPress={() => openSeasonDetails(item.season_number)}
                                    >
                                        {item.poster_path ? (
                                            <View style={styles.seasonImageContainer}>
                                                <Image
                                                    source={{ uri: getImageUrl(item.poster_path, "w200") ?? undefined }}
                                                    style={styles.seasonImage}
                                                    contentFit="cover"
                                                />
                                                {isSeasonWatched(tvShow.id, item.season_number, item.episode_count) && (
                                                    <View style={styles.seasonWatchedOverlay}>
                                                        <Ionicons name="checkmark-circle" size={32} color={Colors.white} />
                                                        <Text style={styles.seasonWatchedText}>VISTO</Text>
                                                    </View>
                                                )}
                                            </View>
                                        ) : (
                                            <View style={styles.seasonPlaceholder}>
                                                <Text style={styles.seasonPlaceholderIcon}>📺</Text>
                                                {isSeasonWatched(tvShow.id, item.season_number, item.episode_count) && (
                                                    <View style={styles.seasonWatchedOverlay}>
                                                        <Ionicons name="checkmark-circle" size={32} color={Colors.white} />
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                        <Text style={styles.seasonName} numberOfLines={1}>
                                            {item.name}
                                        </Text>
                                        <Text style={styles.seasonEpisodes}>
                                            {item.episode_count} eps
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    )}

                    {/* Cast */}
                    {tvShow.credits && tvShow.credits.cast.length > 0 && (
                        <View style={styles.sectionContainer}>
                            <Text
                                style={[styles.sectionTitle, { fontFamily: "BebasNeue_400Regular" }]}
                            >
                                Reparto
                            </Text>
                            <FlatList
                                data={tvShow.credits.cast}
                                keyExtractor={(item, index) => `${item.id}-${index}`}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.castList}
                                renderItem={({ item }) => (
                                    <View style={styles.castItem}>
                                        {item.profile_path ? (
                                            <Image
                                                source={{ uri: getImageUrl(item.profile_path, "w200") ?? undefined }}
                                                style={styles.castImage}
                                                contentFit="cover"
                                            />
                                        ) : (
                                            <View style={styles.castPlaceholder}>
                                                <Text style={styles.castPlaceholderIcon}>👤</Text>
                                            </View>
                                        )}
                                        <Text style={styles.castName} numberOfLines={2}>
                                            {item.name}
                                        </Text>
                                        <Text style={styles.castCharacter} numberOfLines={2}>
                                            {item.character}
                                        </Text>
                                    </View>
                                )}
                            />
                        </View>
                    )}

                    {/* Related TV Shows */}
                    {relatedTVShows.length > 0 && (
                        <View style={styles.sectionContainer}>
                            <Text
                                style={[styles.sectionTitle, { fontFamily: "BebasNeue_400Regular" }]}
                            >
                                Relacionadas
                            </Text>
                            <FlatList
                                data={relatedTVShows}
                                keyExtractor={(item, index) => `${item.id}-${index}`}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.castList}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.castItem}
                                        onPress={() => router.push(`/tv/${item.id}`)}
                                    >
                                        {item.poster_path ? (
                                            <Image
                                                source={{ uri: getImageUrl(item.poster_path, "w300") ?? undefined }}
                                                style={styles.castImage}
                                                contentFit="cover"
                                            />
                                        ) : (
                                            <View style={styles.castPlaceholder}>
                                                <Text style={styles.castPlaceholderIcon}>📺</Text>
                                            </View>
                                        )}
                                        <Text style={styles.castName} numberOfLines={2}>
                                            {item.name}
                                        </Text>
                                        <Text style={styles.castCharacter} numberOfLines={1}>
                                            ⭐ {item.vote_average.toFixed(1)}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    )}

                    <View style={{ height: 32 }} />
                </View>
            </ScrollView>

            {/* Recommend Modal */}
            <Modal
                visible={showRecommendModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowRecommendModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalHeader}>
                        <Text
                            style={[styles.modalTitle, { fontFamily: "BebasNeue_400Regular" }]}
                        >
                            Recomendar
                        </Text>
                        <TouchableOpacity onPress={() => setShowRecommendModal(false)}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* TV preview */}
                    <View style={styles.previewContainer}>
                        {posterUrl && (
                            <Image
                                source={{ uri: posterUrl }}
                                style={styles.previewImage}
                            />
                        )}
                        <View style={styles.previewInfo}>
                            <Text style={styles.previewTitle}>{tvShow.name}</Text>
                            <Text style={styles.previewYear}>
                                {tvShow.first_air_date?.split("-")[0]}
                            </Text>
                        </View>
                    </View>

                    {/* User search */}
                    <Text style={styles.inputLabel}>
                        Seleccionar usuario
                    </Text>
                    <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setShowUserList(!showUserList)}
                    >
                        <Text style={styles.dropdownButtonText}>
                            {selectedUser ? (selectedUser.display_name || `@${selectedUser.username}`) : 'Toca para seleccionar usuario...'}
                        </Text>
                        <Ionicons
                            name={showUserList ? "chevron-up" : "chevron-down"}
                            size={20}
                            color={Colors.metalSilver}
                        />
                    </TouchableOpacity>

                    {/* User results */}
                    {showUserList && (
                        <View style={{ zIndex: 50 }}>
                            {loadingUsers && (
                                <ActivityIndicator size="small" color={Colors.bloodRed} style={{ marginVertical: 8 }} />
                            )}

                            {users.length > 0 && (
                                <View style={styles.searchResults}>
                                    <FlatList
                                        data={users}
                                        keyExtractor={(item) => item.user_id}
                                        keyboardShouldPersistTaps="handled"
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                style={[
                                                    styles.searchResultItem,
                                                    selectedUser?.user_id === item.user_id && styles.searchResultSelected,
                                                ]}
                                                onPress={() => {
                                                    setSelectedUser(item);
                                                    setShowUserList(false);
                                                }}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <View>
                                                        {item.display_name && (
                                                            <Text style={styles.searchResultText}>{item.display_name}</Text>
                                                        )}
                                                        <Text style={[styles.searchResultText, { fontSize: 12, opacity: 0.7 }]}>@{item.username}</Text>
                                                    </View>
                                                    {selectedUser?.user_id === item.user_id && (
                                                        <Ionicons name="checkmark-circle" size={20} color={Colors.bloodRed} />
                                                    )}
                                                </View>
                                            </TouchableOpacity>
                                        )}
                                        ListEmptyComponent={() => (
                                            <Text style={{ color: Colors.metalSilver, padding: 12, textAlign: 'center' }}>
                                                No se encontraron usuarios
                                            </Text>
                                        )}
                                    />
                                </View>
                            )}

                            {!loadingUsers && users.length === 0 && (
                                <View style={styles.emptyUsersContainer}>
                                    <Text style={styles.emptyUsersText}>
                                        No hay otros usuarios disponibles
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Selected user */}
                    {selectedUser && (
                        <View style={styles.selectedUserContainer}>
                            <Text style={styles.selectedUserText}>
                                Para: @{selectedUser.username}
                            </Text>
                            <TouchableOpacity onPress={() => setSelectedUser(null)}>
                                <Text style={styles.removeUserText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Message */}
                    <View style={{ flex: 1 }}>
                        <TextInput
                            style={[styles.input, styles.multilineInput]}
                            placeholder="¿Por qué recomiendas esto?"
                            placeholderTextColor="#71717a"
                            value={recommendMessage}
                            onChangeText={setRecommendMessage}
                            maxLength={200}
                            multiline
                            numberOfLines={3}
                        />
                        <Text style={styles.charCount}>
                            {recommendMessage.length}/200
                        </Text>
                    </View>

                    {/* Send button */}
                    <View style={{ paddingTop: 16 }}>
                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                (!selectedUser || sendingRecommendation) && styles.disabledButton,
                            ]}
                            onPress={handleSendRecommendation}
                            disabled={!selectedUser || sendingRecommendation}
                        >
                            {sendingRecommendation ? (
                                <ActivityIndicator color="#0a0a0a" />
                            ) : (
                                <Text style={styles.sendButtonText}>
                                    Enviar Recomendación
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Season Details Modal */}
            <Modal
                visible={showSeasonModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowSeasonModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text
                            style={[styles.modalTitle, { fontFamily: "BebasNeue_400Regular" }]}
                        >
                            {selectedSeasonNumber !== null ? `Temporada ${selectedSeasonNumber}` : "Episodios"}
                        </Text>
                        <TouchableOpacity onPress={() => setShowSeasonModal(false)}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {loadingSeason ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color="#dc2626" />
                        </View>
                    ) : (
                        <FlatList
                            data={seasonEpisodes}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            renderItem={({ item }: { item: Episode }) => (
                                <TouchableOpacity
                                    style={styles.episodeItem}
                                    onPress={() => {
                                        setSelectedEpisode(item);
                                        setShowEpisodeModal(true);
                                    }}
                                >
                                    {item.still_path ? (
                                        <Image
                                            source={{ uri: getImageUrl(item.still_path, "w300") ?? undefined }}
                                            style={styles.episodeImage}
                                            contentFit="cover"
                                        />
                                    ) : (
                                        <View style={styles.episodePlaceholder}>
                                            <Text style={styles.episodePlaceholderIcon}>📺</Text>
                                        </View>
                                    )}
                                    <View style={styles.episodeContent}>
                                        <Text style={styles.episodeTitle}>
                                            {item.episode_number}. {item.name}
                                        </Text>
                                        <Text style={styles.episodeOverview} numberOfLines={3}>
                                            {item.overview || "Sin descripción."}
                                        </Text>
                                        <Text style={styles.episodeMeta}>
                                            ⭐ {item.vote_average.toFixed(1)} • {item.air_date}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.watchedToggle}
                                        onPress={() => handleToggleEpisode(item.episode_number)}
                                    >
                                        <Ionicons
                                            name={isEpisodeWatched(tvShow.id, selectedSeasonNumber!, item.episode_number) ? "checkbox" : "square-outline"}
                                            size={24}
                                            color={isEpisodeWatched(tvShow.id, selectedSeasonNumber!, item.episode_number) ? Colors.vibrantRed : Colors.metalSilver}
                                        />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            </Modal>

            {/* Episode Details Modal */}
            <Modal
                visible={showEpisodeModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowEpisodeModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text
                            style={[styles.modalTitle, { fontFamily: "BebasNeue_400Regular" }]}
                        >
                            {selectedEpisode ? `${selectedEpisode.episode_number}. ${selectedEpisode.name}` : "Detalle del Episodio"}
                        </Text>
                        <TouchableOpacity onPress={() => setShowEpisodeModal(false)}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {selectedEpisode && (
                        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                            {selectedEpisode.still_path ? (
                                <Image
                                    source={{ uri: getImageUrl(selectedEpisode.still_path, "w500") ?? undefined }}
                                    style={{ width: '100%', height: 200, borderRadius: 8, marginBottom: 16 }}
                                    contentFit="cover"
                                />
                            ) : (
                                <View style={{ width: '100%', height: 200, borderRadius: 8, marginBottom: 16, backgroundColor: Colors.metalGray, alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 40 }}>📺</Text>
                                </View>
                            )}

                            <Text style={styles.episodeMeta}>
                                Emitido: {selectedEpisode.air_date}
                            </Text>
                            <Text style={styles.ratingText}>
                                ⭐ {selectedEpisode.vote_average.toFixed(1)}/10
                            </Text>

                            <Text
                                style={[styles.descriptionTitle, { fontFamily: "BebasNeue_400Regular", marginTop: 24 }]}
                            >
                                Sinopsis
                            </Text>
                            <Text style={styles.descriptionText}>
                                {selectedEpisode.overview || "Sin descripción disponible para este episodio."}
                            </Text>
                        </ScrollView>
                    )}
                </View>
            </Modal>

            <TrailerModal
                visible={showTrailerModal}
                videoKey={trailerKey}
                onClose={() => setShowTrailerModal(false)}
            />
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
    },
    centerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    errorText: {
        color: Colors.metalSilver,
    },
    backButton: {
        position: "absolute",
        top: 16,
        left: 16,
        zIndex: 10,
        backgroundColor: "rgba(10, 10, 10, 0.5)", // metal-black/50
        borderRadius: 9999,
        padding: 8,
    },
    backButtonText: {
        fontSize: 28,
        color: "#fff",
        fontWeight: "900",
        top: -5,
    },
    nextBadgeContainer: {
        position: "absolute",
        top: 16,
        right: 16,
        zIndex: 10,
        backgroundColor: "rgba(10, 10, 10, 0.7)",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: Colors.bloodRed,
        alignItems: 'center',
    },
    nextBadgeLabel: {
        color: Colors.metalSilver,
        fontSize: 10,
        fontWeight: "bold",
        letterSpacing: 1,
    },
    nextBadgeValue: {
        color: Colors.white,
        fontSize: 16,
        fontFamily: "BebasNeue_400Regular",
    },
    backdropPlaceholder: {
        backgroundColor: Colors.metalGray,
    },
    contentContainer: {
        paddingHorizontal: 16,
        marginTop: -64,
    },
    headerRow: {
        flexDirection: "row",
    },
    poster: {
        width: 120,
        height: 180,
        borderRadius: 8,
    },
    posterPlaceholder: {
        backgroundColor: Colors.metalGray,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        width: 120,
        height: 180,
    },
    posterPlaceholderIcon: {
        fontSize: 36, // ~text-4xl
    },
    infoContainer: {
        flex: 1,
        marginLeft: 16,
        marginTop: 64,
    },
    title: {
        color: "#f4f4f5", // zinc-100
        fontSize: 20, // text-xl
        fontWeight: "bold",
    },
    yearText: {
        color: Colors.metalSilver,
        fontSize: 14,
        marginTop: 4,
    },
    ratingText: {
        color: "#eab308", // yellow-500
        fontSize: 18,
        marginTop: 8,
    },
    genresContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 16,
    },
    genreBadge: {
        backgroundColor: Colors.metalGray,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
    },
    genreText: {
        color: "#f4f4f5", // zinc-100
        fontSize: 12,
    },
    actionButtonsRow: {
        flexDirection: "row",
        gap: 16,
        marginTop: 24,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 4,
        alignItems: "center",
    },
    activeButton: {
        backgroundColor: Colors.vibrantRed,
    },
    inactiveButton: {
        backgroundColor: Colors.metalGray,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
    },
    activeButtonText: {
        color: Colors.white,
        fontWeight: "bold",
    },
    inactiveButtonText: {
        color: "#f4f4f5", // zinc-100
    },
    recommendButton: {
        backgroundColor: Colors.bloodRed,
        paddingVertical: 16,
        borderRadius: 4,
        marginTop: 16,
    },
    recommendButtonText: {
        color: Colors.white,
        fontWeight: "bold",
        textAlign: "center",
        textTransform: "uppercase",
    },
    descriptionContainer: {
        marginTop: 24,
    },
    descriptionTitle: {
        color: "#f4f4f5", // zinc-100
        fontSize: 18,
        marginBottom: 8,
    },
    descriptionText: {
        color: Colors.metalSilver,
        lineHeight: 24,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
        padding: 16,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        marginHorizontal: 16,
    },
    modalTitle: {
        color: "#f4f4f5", // zinc-100
        fontSize: 24,
    },
    closeButtonText: {
        color: Colors.bloodRed,
        fontSize: 18,
        marginRight: 16,
    },
    previewContainer: {
        flexDirection: "row",
        backgroundColor: Colors.metalGray,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    previewImage: {
        width: 50,
        height: 75,
        borderRadius: 4,
    },
    previewInfo: {
        flex: 1,
        marginLeft: 12,
    },
    previewTitle: {
        color: "#f4f4f5", // zinc-100
        fontWeight: "bold",
    },
    previewYear: {
        color: Colors.metalSilver,
        fontSize: 14,
    },
    inputLabel: {
        color: Colors.metalSilver,
        fontSize: 14,
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 0.5, // tracking-wider
    },
    input: {
        backgroundColor: Colors.metalGray,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
        color: "#f4f4f5", // zinc-100
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 4,
        marginBottom: 8,
    },
    multilineInput: {
        marginBottom: 16,
    },
    dropdownButton: {
        backgroundColor: Colors.metalGray,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 4,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dropdownButtonText: {
        color: "#f4f4f5",
        flex: 1,
    },
    emptyUsersContainer: {
        backgroundColor: Colors.metalGray,
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        alignItems: 'center',
    },
    emptyUsersText: {
        color: Colors.metalSilver,
        textAlign: 'center',
    },
    searchResults: {
        backgroundColor: Colors.metalGray,
        borderRadius: 8,
        marginBottom: 16,
        maxHeight: 180,
        borderWidth: 1,
        borderColor: Colors.bloodRed,
        overflow: 'hidden',
    },
    searchResultItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.metalSilver,
    },
    searchResultText: {
        color: "#f4f4f5", // zinc-100
    },
    searchResultSelected: {
        backgroundColor: "rgba(220, 38, 38, 0.2)",
        borderColor: Colors.bloodRed,
    },
    selectedUserContainer: {
        backgroundColor: Colors.metalGray,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    selectedUserText: {
        color: "#f4f4f5", // zinc-100
    },
    removeUserText: {
        color: Colors.bloodRed,
    },
    selectionHint: {
        color: Colors.bloodRed,
        fontSize: 12,
        marginBottom: 8,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    charCount: {
        color: Colors.metalSilver,
        fontSize: 12,
        textAlign: "right",
        marginBottom: 16,
    },
    sendButton: {
        backgroundColor: Colors.bloodRed,
        paddingVertical: 16,
        borderRadius: 4,
    },
    disabledButton: {
        opacity: 0.5,
    },
    sendButtonText: {
        color: 'white',
        fontWeight: "bold",
        textAlign: "center",
        textTransform: "uppercase",
    },
    sectionContainer: {
        marginTop: 24,
    },
    sectionTitle: {
        color: "#f4f4f5",
        fontSize: 18,
        marginBottom: 12,
    },
    castList: {
        gap: 12,
    },
    castItem: {
        width: 100,
        marginRight: 12,
    },
    castImage: {
        width: 100,
        height: 150,
        borderRadius: 8,
        marginBottom: 8,
    },
    castPlaceholder: {
        width: 100,
        height: 150,
        borderRadius: 8,
        backgroundColor: Colors.metalGray,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    castPlaceholderIcon: {
        fontSize: 32,
    },
    castName: {
        color: "#f4f4f5",
        fontSize: 12,
        fontWeight: "bold",
        textAlign: "center",
    },
    castCharacter: {
        color: Colors.metalSilver,
        fontSize: 10,
        textAlign: "center",
        marginTop: 2,
    },
    seasonList: {
        gap: 12,
    },
    seasonItem: {
        width: 100,
        marginRight: 12,
    },
    seasonImage: {
        width: 100,
        height: 150,
        borderRadius: 8,
        marginBottom: 8,
    },
    seasonPlaceholder: {
        width: 100,
        height: 150,
        borderRadius: 8,
        backgroundColor: Colors.metalGray,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    seasonPlaceholderIcon: {
        fontSize: 32,
    },
    seasonName: {
        color: "#f4f4f5",
        fontSize: 12,
        fontWeight: "bold",
        textAlign: "center",
    },
    seasonEpisodes: {
        color: Colors.metalSilver,
        fontSize: 10,
        textAlign: "center",
        marginTop: 2,
    },
    seasonImageContainer: {
        position: 'relative',
        width: 100,
        height: 150,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 8,
    },
    seasonWatchedOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(220, 38, 38, 0.4)', // bloodRed with opacity
        justifyContent: 'center',
        alignItems: 'center',
    },
    seasonWatchedText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 4,
        fontFamily: "BebasNeue_400Regular",
        letterSpacing: 1,
    },
    episodeItem: {
        flexDirection: "row",
        marginBottom: 16,
        backgroundColor: Colors.metalGray,
        borderRadius: 8,
        overflow: "hidden",
    },
    episodeImage: {
        width: 120,
        height: 80,
    },
    episodePlaceholder: {
        width: 120,
        height: 80,
        backgroundColor: Colors.metalBlack,
        alignItems: "center",
        justifyContent: "center",
    },
    episodePlaceholderIcon: {
        fontSize: 24,
    },
    episodeContent: {
        flex: 1,
        padding: 8,
        justifyContent: "center",
    },
    episodeTitle: {
        color: "#f4f4f5",
        fontWeight: "bold",
        fontSize: 14,
        marginBottom: 4,
    },
    episodeOverview: {
        color: Colors.metalSilver,
        fontSize: 12,
        marginBottom: 4,
    },
    episodeMeta: {
        color: Colors.metalGold,
        fontSize: 10,
    },
    watchedToggle: {
        padding: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    playButtonOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.2)", // Subtle darken
    },
    playTrailerText: {
        color: "white",
        fontSize: 14,
        fontWeight: "bold",
        marginTop: -10,
        textShadowColor: "rgba(0,0,0,0.75)",
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
});
