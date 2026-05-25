import { StyleSheet, Text, Keyboard, TouchableWithoutFeedback } from 'react-native'
import React, { useState } from 'react'
import {Link} from 'expo-router'
import { useUser } from '../../hooks/useUser'
import { colors } from '../../constants/colors'


//import components
import ThemedView from '../../components/ThemedView'
import ThemedText from '../../components/ThemedText'
import Spacer from '../../components/Spacer'
import ThemedButton from '../../components/ThemedButton'
import ThemedTextInput from '../../components/ThemedTextInput'




const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)

    const { login } = useUser()


    const handleSubmit = async () => {
        setError(null)

         try{
            await login(email, password)
        }catch(error) {
           setError(error.message)
        }
        
    }
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <ThemedView style={styles.container}>

        <Spacer/>
        <ThemedText title={true} style={styles.title}>
            Login to your Account
        </ThemedText>

        <Spacer height={100}/>

        <ThemedTextInput 
          style={{width: '80%', marginBottom: 20}}
          placeholder='Email'
          keyboardType="email-address"
          onChangeText={setEmail}
          value={email}
        />
        
        <ThemedTextInput 
          style={{width: '80%', marginBottom: 20}}
          placeholder='Password'
          onChangeText={setPassword}
          value={password}
          secureTextEntry
        />

        <ThemedButton onPress={handleSubmit}>
            <Text style={{color : '#f2f2f2'}}>Login</Text>
        </ThemedButton>

        <Spacer/>
        {error && <Text style={styles.error}>{error}</Text>}

        <Spacer />



        <Link href ='/register'>
          <ThemedText style = {{ textAlign: 'center'}}>Register instead</ThemedText>
        </Link>

        <Spacer/>
       

       

    </ThemedView>
    </TouchableWithoutFeedback>
  )
}

export default Login

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    title: {
        textAlign: "center",
        fontSize: 18,
        marginBottom: 30
    },
    error: {
      color: colors.warning,
      padding: 10,
      backgroundColor: '#f5c1c8',
      borderColor: colors.warning,
      borderWidth: 1,
      borderRadius: 6,
      marginHorizontal:  10,
    }
})