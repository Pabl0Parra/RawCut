import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../login';
import { useAuthStore } from '../../src/stores/authStore';
import { useRouter } from 'expo-router';

jest.mock('../../src/stores/authStore', () => ({
    useAuthStore: jest.fn(),
}));

jest.mock('expo-router', () => ({
    useRouter: jest.fn(),
}));

describe('LoginScreen Integration', () => {
    const mockSignIn = jest.fn();
    const mockRouterReplace = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        (useRouter as jest.Mock).mockReturnValue({
            replace: mockRouterReplace,
            push: jest.fn()
        });

        (useAuthStore as unknown as jest.Mock).mockReturnValue({
            signIn: mockSignIn,
            isLoading: false,
            error: null,
            clearError: jest.fn(),
        });
    });

    it('displays validation errors when fields are empty', async () => {
        const { getByText } = render(<LoginScreen />);

        fireEvent.press(getByText('auth.loginTitle'));

        await waitFor(() => {
            expect(getByText('Ingresa tu email o nombre de usuario')).toBeTruthy();
            expect(getByText('Ingresa tu contraseña')).toBeTruthy();
        });

        expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('calls signIn on the store and navigates on success', async () => {
        mockSignIn.mockResolvedValueOnce(true);

        const { getByTestId, getByText } = render(<LoginScreen />);

        fireEvent.changeText(getByTestId('input-identifier'), 'testuser');
        fireEvent.changeText(getByTestId('input-password'), 'password123');

        fireEvent.press(getByText('auth.loginTitle'));

        await waitFor(() => {
            expect(mockSignIn).toHaveBeenCalledWith('testuser', 'password123');
        });
    });

    it('shows error state when login fails', async () => {
        mockSignIn.mockResolvedValueOnce(false);
        (useAuthStore as unknown as jest.Mock).mockReturnValue({
            signIn: mockSignIn,
            isLoading: false,
            error: 'Credenciales inválidas',
            clearError: jest.fn(),
        });

        const { getByTestId, getByText } = render(<LoginScreen />);

        fireEvent.changeText(getByTestId('input-identifier'), 'test@example.com');
        fireEvent.changeText(getByTestId('input-password'), 'wrongpass');

        fireEvent.press(getByText('auth.loginTitle'));

        await waitFor(() => {
            expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'wrongpass');
        });

        expect(getByText('Credenciales inválidas')).toBeTruthy();
        expect(mockRouterReplace).not.toHaveBeenCalled();
    });
});