import { Image, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export const HeaderLeft = () => (
    <TouchableOpacity
        onPress={() => router.replace("/(tabs)")}
        style={{
            marginLeft: 16,
            width: 32,
            height: 32,
            justifyContent: 'center',
            alignItems: 'center'
        }}
    >
        <Image
            source={require('../../../assets/icons/metal-hand.png')}
            style={{ width: 28, height: 28, tintColor: "#fff" }}
            resizeMode="contain"
        />
    </TouchableOpacity>
);
