import { Image, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export const HeaderLeft = () => (
    <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
        <Image
            source={require('../../../assets/icons/metal-hand.png')}
            style={{ width: 30, height: 30, marginLeft: 16, tintColor: "#fff" }}
            resizeMode="contain"
        />
    </TouchableOpacity>
);
