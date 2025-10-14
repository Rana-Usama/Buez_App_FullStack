import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import SubscriptionListener from '../components/SubscriptionListener'
import { getAuth } from 'firebase/auth'
import { useUser } from '../contexts/user.context'

const InitialScreen = () => {
  return (
    <View>
      <Text>Checking for subscription</Text>
      <Text>Loading...</Text>
      {/* {userId && <SubscriptionListener navigation={navigation} userId={userId} />} */}
    </View>
  )
}

export default InitialScreen

const styles = StyleSheet.create({})