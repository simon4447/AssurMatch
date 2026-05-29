import { TextInput, useColorScheme } from 'react-native'
import React from 'react'
import { colors } from '../constants/colors'

const ThemedTextInput = ({style, ...props }) => {
    const colorScheme = useColorScheme()
    const theme = colors[colorScheme] ?? colors.light
  return (
    <TextInput
       style={[
        {
            backgroundColor: theme.uiBackground,
            color: theme.text,
            padding: 20,
            borderRadius: 6
        },
        style
       ]}
       {...props}
    />
  )
}

export default ThemedTextInput

