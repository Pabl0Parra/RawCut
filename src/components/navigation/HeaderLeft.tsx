import { Image, TouchableOpacity } from 'react-native';

interface HeaderLeftProps {
    onPress?: () => void;
}

export const HeaderLeft = ({ onPress }: HeaderLeftProps) => (
    <TouchableOpacity
        onPress={onPress}
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
            style={{ width: 28, height: 28, tintColor: "#ffffff" }}
            resizeMode="contain"
        />
    </TouchableOpacity>
);
