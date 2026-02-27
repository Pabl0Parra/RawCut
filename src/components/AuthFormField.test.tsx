import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AuthFormField } from './AuthFormField';
import { useForm } from 'react-hook-form';
import { View, Button } from 'react-native';

const FormWrapper = ({ onSubmit, children }: { onSubmit: any, children: (control: any) => React.ReactNode }) => {
    const { control, handleSubmit } = useForm({
        defaultValues: { testField: '' }
    });
    return (
        <View>
            {children(control)}
            <Button title="Submit" onPress={handleSubmit(onSubmit)} />
        </View>
    );
};

describe('AuthFormField', () => {
    it('renders placeholder correctly', () => {
        const { getByPlaceholderText } = render(
            <FormWrapper onSubmit={jest.fn()}>
                {(control) => <AuthFormField control={control} name="testField" label="Test" placeholder="Enter text here" />}
            </FormWrapper>
        );
        expect(getByPlaceholderText('Enter text here')).toBeTruthy();
    });

    it('updates value on typing', () => {
        const { getByPlaceholderText } = render(
            <FormWrapper onSubmit={jest.fn()}>
                {(control) => <AuthFormField control={control} name="testField" label="Test" placeholder="Type here" />}
            </FormWrapper>
        );
        const input = getByPlaceholderText('Type here');
        fireEvent.changeText(input, 'Hello World');
        expect(input.props.value).toBe('Hello World');
    });

    it('toggles secure text entry when eye icon is pressed', () => {
        const { getByPlaceholderText, getByTestId } = render(
            <FormWrapper onSubmit={jest.fn()}>
                {(control) => (
                    <AuthFormField
                        control={control}
                        name="testField"
                        label="Password"
                        placeholder="Password"
                        secureTextEntry={true}
                    />
                )}
            </FormWrapper>
        );

        const input = getByPlaceholderText('Password');
        expect(input.props.secureTextEntry).toBe(true);

        fireEvent.press(getByTestId('toggle-password-testField'));
        expect(input.props.secureTextEntry).toBe(false);
    });

    it('renders error message when error prop is passed', () => {
        const { getByText } = render(
            <FormWrapper onSubmit={jest.fn()}>
                {(control) => (
                    <AuthFormField
                        control={control}
                        name="testField"
                        label="Email"
                        placeholder="Email"
                        error="Invalid email address"
                    />
                )}
            </FormWrapper>
        );
        expect(getByText('Invalid email address')).toBeTruthy();
    });
});