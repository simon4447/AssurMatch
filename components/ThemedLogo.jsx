import { Image,useColorScheme } from 'react-native'
import React from 'react'
import DarkLogo from '../assets/img/images.jpg'
import LightLogo from '../assets/img/images2.png'

const ThemedLogo = ({ ...props }) => {
     const colorScheme = useColorScheme ()
        const logo = colorScheme === 'dark' ? DarkLogo: LightLogo
  return (
    <Image source={logo} {...props} />
  )
}

export default ThemedLogo