import React from 'react';
import { Image } from 'react-native';

export const HeaderLeft = () => (
    <Image
        source={require('../../../assets/icons/metal-hand.png')}
        style={{ width: 30, height: 30, marginLeft: 16, tintColor: "#fff" }}
        resizeMode="contain"
    />
);
