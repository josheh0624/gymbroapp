import { StyleSheet } from "react-native";

const liquidGlassStyles = StyleSheet.create({
    glassViewAddButton: {
        position: 'absolute',
        width: '100%',
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    tintedGlassAddButton: {
        position: 'absolute',
        width: '100%',
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    tintedGlassThumbnail: {
        width: '100%',
        ...StyleSheet.absoluteFill,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
})

export default liquidGlassStyles;