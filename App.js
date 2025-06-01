import React, { useEffect, useState } from 'react'
import { ActivityIndicator, View, Alert, Platform } from 'react-native'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { auth, db } from './firebaseConfig'
import AppNavigation from './src/navigation'

// Показываем уведомления в foreground
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: false,
	}),
})

export default function App() {
	const [loading, setLoading] = useState(true)
	const [user, setUser] = useState(null)

	useEffect(() => {
		// 1. Слушаем авторизацию
		const unsubscribeAuth = onAuthStateChanged(auth, u => {
			setUser(u)
			setLoading(false)
		})

		// 2. Регистрируем пуш-уведомления
		registerForPushNotificationsAsync()
			.then(token => {
				if (token && auth.currentUser) {
					// Сохраняем токен в Firestore
					setDoc(
						doc(db, 'users', auth.currentUser.uid),
						{ pushToken: token },
						{ merge: true }
					).catch(console.error)
				}
			})
			.catch(console.error)

		// 3. Слушатели получения уведомлений
		const receivedSubscription = Notifications.addNotificationReceivedListener(
			notification => {
				console.log('📩 Уведомление получено:', notification)
			}
		)

		const responseSubscription =
			Notifications.addNotificationResponseReceivedListener(response => {
				console.log('👉 Клик по уведомлению:', response)
			})

		return () => {
			unsubscribeAuth()
			receivedSubscription.remove()
			responseSubscription.remove()
		}
	}, [])

	if (loading) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<ActivityIndicator size='large' />
			</View>
		)
	}

	return <AppNavigation />
}

// Функция регистрации устройства для пушей
async function registerForPushNotificationsAsync() {
	let token

	try {
		const { status: existingStatus } = await Notifications.getPermissionsAsync()
		let finalStatus = existingStatus

		if (existingStatus !== 'granted') {
			const { status } = await Notifications.requestPermissionsAsync()
			finalStatus = status
		}

		if (finalStatus !== 'granted') {
			Alert.alert('Не удалось получить разрешение на уведомления')
			return null
		}

		const projectId =
			Constants?.expoConfig?.extra?.eas?.projectId ||
			'1ca59fce-4f16-4483-aa7a-aa3a569a070f'

		const tokenData = await Notifications.getExpoPushTokenAsync({ projectId })
		token = tokenData.data
		console.log('✅ Expo Push Token:', token)

		// Android-specific notification channel
		if (Platform.OS === 'android') {
			await Notifications.setNotificationChannelAsync('default', {
				name: 'default',
				importance: Notifications.AndroidImportance.MAX,
				vibrationPattern: [0, 250, 250, 250],
				lightColor: '#FF231F7C',
			})
		}
	} catch (error) {
		console.error('Ошибка при регистрации пушей', error)
	}

	return token
}
