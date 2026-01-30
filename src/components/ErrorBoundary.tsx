import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface Props {
    children: ReactNode;
    fallbackComponent?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallbackComponent) {
                return this.props.fallbackComponent;
            }

            return (
                <View style={styles.container}>
                    <View style={styles.content}>
                        <Ionicons name="warning" size={64} color={Colors.bloodRed} />
                        <Text style={styles.title}>¡Algo salió mal!</Text>
                        <Text style={styles.message}>
                            La aplicación encontró un error inesperado.
                        </Text>
                        {__DEV__ && this.state.error && (
                            <View style={styles.errorDetails}>
                                <Text style={styles.errorText}>
                                    {this.state.error.toString()}
                                </Text>
                                {this.state.errorInfo && (
                                    <Text style={styles.errorStack}>
                                        {this.state.errorInfo.componentStack}
                                    </Text>
                                )}
                            </View>
                        )}
                        <TouchableOpacity
                            style={styles.button}
                            onPress={this.handleReset}
                        >
                            <Text style={styles.buttonText}>Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
        maxWidth: 400,
    },
    title: {
        fontSize: 24,
        fontFamily: 'Inter_700Bold',
        color: Colors.white,
        marginTop: 20,
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
        color: Colors.metalSilver,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    errorDetails: {
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(220, 38, 38, 0.3)',
    },
    errorText: {
        fontSize: 12,
        fontFamily: 'Inter_400Regular',
        color: Colors.bloodRed,
        marginBottom: 8,
    },
    errorStack: {
        fontSize: 10,
        fontFamily: 'Inter_400Regular',
        color: Colors.metalSilver,
        marginTop: 8,
    },
    button: {
        backgroundColor: Colors.bloodRed,
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
        elevation: 3,
        shadowColor: Colors.bloodRed,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    buttonText: {
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
        color: Colors.white,
    },
});
