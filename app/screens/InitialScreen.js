import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import SubscriptionListener from '../components/SubscriptionListener'
import { getAuth } from 'firebase/auth'
import { useUser } from '../contexts/user.context'

const InitialScreen = ({navigation}) => {
  const userId = getAuth()?.currentUser?.uid;
  const { userData, loading, error, isAuthenticated } = useUser();
  return (
    <View>
      <Text>Checking for subscription</Text>
      {loading && <Text>Loading...</Text>}
      {!loading && userId && <SubscriptionListener navigation={navigation} userId={userId} />}
    </View>
  )
}

export default InitialScreen

const styles = StyleSheet.create({})