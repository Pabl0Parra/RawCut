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
import { getMovieDetails, getRelatedMovies, getMovieVideos, getImageUrl, Movie, Video } from "../../../src/lib/tmdb";
import { useContentStore } from "../../../src/stores/contentStore";
import { useAuthStore } from "../../../src/stores/authStore";
import { supabase, Profile } from "../../../src/lib/supabase";
import { Colors } from "../../../src/constants/Colors";
import TrailerModal from "../../../src/components/TrailerModal";

const { width } = Dimensions.get("window");

export default function MovieDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [movie, setMovie] = useState<(Movie & { genres: { id: number; name: string }[] }) | null>(null);
    const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);
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

    const { user } = useAuthStore();
    const {
        isFavorite,
        isInWatchlist,
        isWatched,
        addToFavorites,
        removeFromFavorites,
        addToWatchlist,
        removeFromWatchlist,
        toggleWatched,
    } = useContentStore();

    useEffect(() => {
        if (id) {
            loadMovie(Number.parseInt(id));
        }
    }, [id]);

    const loadMovie = async (movieId: number) => {
        setLoading(true);
        try {
            const data = await getMovieDetails(movieId);
            setMovie(data);

            const related = await getRelatedMovies(movieId);
            setRelatedMovies(related.results);

            const videos = await getMovieVideos(movieId);
            const trailer = videos.results.find(
                v => v.type === "Trailer" && v.site === "YouTube" && v.official
            ) || videos.results.find(v => v.type === "Trailer" && v.site === "YouTube");

            if (trailer) {
                setTrailerKey(trailer.key);
            }
        } catch (err) {
            console.error("Error loading movie:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFavorite = async () => {
        if (!movie || !user) return;
        if (isFavorite(movie.id, "movie")) {
            await removeFromFavorites(movie.id, "movie");
        } else {
            await addToFavorites(movie.id, "movie");
        }
    };

    const handleToggleWatchlist = async () => {
        if (!movie || !user) return;
        if (isInWatchlist(movie.id, "movie")) {
            await removeFromWatchlist(movie.id, "movie");
        } else {
            await addToWatchlist(movie.id, "movie");
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
        if (!movie || !user || !selectedUser) return;

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
                tmdb_id: movie.id,
                media_type: "movie",
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
            // Show success feedback
            alert("¡Recomendación enviada!");
        } catch (err) {
            console.error("Error sending recommendation:", err);
            alert("Error al enviar recomendación");
        } finally {
            setSendingRecommendation(false);
        }
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

    if (!movie) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>Película no encontrada</Text>
                </View>
            </SafeAreaView>
        );
    }

    const handleWatchTrailer = () => {
        if (trailerKey) {
            setShowTrailerModal(true);
        }
    };

    const backdropUrl = getImageUrl(movie.backdrop_path, "original");
    const posterUrl = getImageUrl(movie.poster_path, "w300");

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

                {/* Backdrop with Trailer Button */}
                <View style={{ position: 'relative' }}>
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
                                <Text style={styles.posterPlaceholderIcon}>🎬</Text>
                            </View>
                        )}

                        {/* Title and info */}
                        <View style={styles.infoContainer}>
                            <Text
                                style={[styles.title, { fontFamily: "BebasNeue_400Regular" }]}
                            >
                                {movie.title}
                            </Text>
                            <Text style={styles.yearText}>
                                {movie.release_date?.split("-")[0]}
                                {movie.runtime ? ` • ${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : ""}
                            </Text>
                            <Text style={styles.ratingText}>
                                ⭐ {movie.vote_average.toFixed(1)}/10
                            </Text>
                        </View>
                    </View>

                    {/* Genres */}
                    <View style={styles.genresContainer}>
                        {movie.genres?.map((genre) => (
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
                                    isFavorite(movie.id, "movie")
                                        ? styles.activeButton
                                        : styles.inactiveButton,
                                ]}
                                onPress={handleToggleFavorite}
                            >
                                <View style={{ flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: 6 }}>
                                    <Ionicons
                                        name={isFavorite(movie.id, "movie") ? "skull" : "skull-outline"}
                                        size={20}
                                        color={isFavorite(movie.id, "movie") ? Colors.white : "#f4f4f5"}
                                    />
                                    <Text
                                        style={
                                            isFavorite(movie.id, "movie")
                                                ? styles.activeButtonText
                                                : styles.inactiveButtonText
                                        }
                                        numberOfLines={1}
                                    >
                                        {isFavorite(movie.id, "movie") ? "En Favoritos" : "Añadir"}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    isInWatchlist(movie.id, "movie")
                                        ? styles.activeButton
                                        : styles.inactiveButton,
                                ]}
                                onPress={handleToggleWatchlist}
                            >
                                <View style={{ flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: 6 }}>
                                    <MaterialCommunityIcons
                                        name={isInWatchlist(movie.id, "movie") ? "sword-cross" : "sword"}
                                        size={20}
                                        color={isInWatchlist(movie.id, "movie") ? Colors.white : "#f4f4f5"}
                                    />
                                    <Text
                                        style={
                                            isInWatchlist(movie.id, "movie")
                                                ? styles.activeButtonText
                                                : styles.inactiveButtonText
                                        }
                                        numberOfLines={1}
                                    >
                                        {isInWatchlist(movie.id, "movie")
                                            ? "En Lista"
                                            : "Watchlist"}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    isWatched(movie.id, "movie")
                                        ? styles.activeButton
                                        : styles.inactiveButton,
                                ]}
                                onPress={() => toggleWatched(movie.id, "movie")}
                            >
                                <View style={{ flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: 6 }}>
                                    <Ionicons
                                        name={isWatched(movie.id, "movie") ? "eye" : "eye-outline"}
                                        size={20}
                                        color={isWatched(movie.id, "movie") ? Colors.white : "#f4f4f5"}
                                    />
                                    <Text
                                        style={
                                            isWatched(movie.id, "movie")
                                                ? styles.activeButtonText
                                                : styles.inactiveButtonText
                                        }
                                        numberOfLines={1}
                                    >
                                        {isWatched(movie.id, "movie") ? "Ya Visto" : "Marcar Visto"}
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
                                    // Debug: Check current user ID
                                    console.log("Current user ID:", user?.id);

                                    // Debug: Check all profiles
                                    const { data: allProfiles } = await supabase
                                        .from("profiles")
                                        .select("*");
                                    console.log("All profiles in database:", allProfiles);

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
                            {movie.overview || "Sin descripción disponible"}
                        </Text>
                    </View>

                    {/* Crew Info (Directors & Producers) */}
                    {movie.credits && (
                        <View style={styles.sectionContainer}>
                            {movie.credits.crew.filter(c => c.job === "Director").length > 0 && (
                                <View style={{ marginBottom: 12 }}>
                                    <Text style={[styles.sectionTitle, { fontFamily: "BebasNeue_400Regular", fontSize: 16, marginBottom: 4 }]}>
                                        Dirección
                                    </Text>
                                    <Text style={{ color: "#f4f4f5", fontSize: 14 }}>
                                        {movie.credits.crew.filter(c => c.job === "Director").map(d => d.name).join(", ")}
                                    </Text>
                                </View>
                            )}
                            {movie.credits.crew.filter(c => c.job === "Producer" || c.job === "Executive Producer").length > 0 && (
                                <View>
                                    <Text style={[styles.sectionTitle, { fontFamily: "BebasNeue_400Regular", fontSize: 16, marginBottom: 4 }]}>
                                        Producción
                                    </Text>
                                    <Text style={{ color: "#f4f4f5", fontSize: 14 }}>
                                        {movie.credits.crew
                                            .filter(c => c.job === "Producer" || c.job === "Executive Producer")
                                            .slice(0, 3) // Limit to 3 producers for brevity
                                            .map(p => p.name).join(", ")}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Cast */}
                    {movie.credits && movie.credits.cast.length > 0 && (
                        <View style={styles.sectionContainer}>
                            <Text
                                style={[styles.sectionTitle, { fontFamily: "BebasNeue_400Regular" }]}
                            >
                                Reparto
                            </Text>
                            <FlatList
                                data={movie.credits.cast}
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

                    {/* Related Movies */}
                    {relatedMovies.length > 0 && (
                        <View style={styles.sectionContainer}>
                            <Text
                                style={[styles.sectionTitle, { fontFamily: "BebasNeue_400Regular" }]}
                            >
                                Relacionadas
                            </Text>
                            <FlatList
                                data={relatedMovies}
                                keyExtractor={(item, index) => `${item.id}-${index}`}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.castList}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.castItem}
                                        onPress={() => router.push(`/movie/${item.id}`)}
                                    >
                                        {item.poster_path ? (
                                            <Image
                                                source={{ uri: getImageUrl(item.poster_path, "w300") ?? undefined }}
                                                style={styles.castImage}
                                                contentFit="cover"
                                            />
                                        ) : (
                                            <View style={styles.castPlaceholder}>
                                                <Text style={styles.castPlaceholderIcon}>🎬</Text>
                                            </View>
                                        )}
                                        <Text style={styles.castName} numberOfLines={2}>
                                            {item.title}
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

                    {/* Movie preview */}
                    <View style={styles.previewContainer}>
                        {posterUrl && (
                            <Image
                                source={{ uri: posterUrl }}
                                style={styles.previewImage}
                            />
                        )}
                        <View style={styles.previewInfo}>
                            <Text style={styles.previewTitle}>{movie.title}</Text>
                            <Text style={styles.previewYear}>
                                {movie.release_date?.split("-")[0]}
                            </Text>
                        </View>
                    </View>

                    {/* User search */}
                    <Text style={styles.inputLabel}>
                        Buscar usuario
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Escribe un nombre de usuario..."
                        placeholderTextColor="#71717a"
                        value={searchUsers}
                        onChangeText={(text) => {
                            setSearchUsers(text);
                            if (text.length > 2) {
                                searchForUsers(text);
                            } else {
                                setUsers([]);
                            }
                        }}
                        onFocus={() => setShowUserList(true)}
                    />
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
                                        keyExtractor={(item, index) => `${item.user_id}-${index}`}
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
                    <Text style={styles.inputLabel}>
                        Mensaje (opcional)
                    </Text>
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

            <TrailerModal
                visible={showTrailerModal}
                videoKey={trailerKey}
                onClose={() => setShowTrailerModal(false)}
            />
        </SafeAreaView>
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
    },
    modalTitle: {
        color: "#f4f4f5", // zinc-100
        fontSize: 24,
    },
    closeButtonText: {
        color: Colors.bloodRed,
        fontSize: 18,
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
    playButtonOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)', // Subtle darken
    },
    playTrailerText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: -10,
        textShadowColor: 'rgba(0,0,0,0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
});
