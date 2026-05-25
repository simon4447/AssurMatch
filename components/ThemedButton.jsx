import { Pressable, StyleSheet } from 'react-native'
import React from 'react'
import {colors} from '../constants/colors'


function ThemedButton ({style, ...props}) {

  return (
    <Pressable 
      style = {({pressed}) => [styles.btn, pressed && styles.pressed, style]}
      {...props}
    />

  )
}
const styles = StyleSheet.create ({
    btn: {
        backgroundColor: colors.primary,
        padding: 18,
        borderRadius: 6,
        marginVertical: 10
    },
    pressed: {
        opacity: 0.8
    }
})
export default ThemedButton