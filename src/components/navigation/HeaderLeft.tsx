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
            style={{ width: 48, height: 48 }}
            resizeMode="contain"
        />
    </TouchableOpacity>
);
