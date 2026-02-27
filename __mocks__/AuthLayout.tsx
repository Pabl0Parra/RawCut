const React = require('react');
const { View, TouchableOpacity, Text } = require('react-native');

export const AuthLayout = ({ children, error, submitButtonText, onSubmit }: any) =>
    React.createElement(View, null,
        children,
        React.createElement(TouchableOpacity, { onPress: onSubmit },
            React.createElement(Text, null, submitButtonText)
        ),
        error ? React.createElement(Text, null, error) : null
    );

export const AuthLink = ({ children, ...props }: any) =>
    React.createElement(TouchableOpacity, props, children);