// ProfileScreen.js
import React, { useState, useEffect } from 'react'
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Alert,
	Image,
	ScrollView,
	ActivityIndicator,
} from 'react-native'
import { auth } from '../../firebaseConfig'
import { signOut, deleteUser } from 'firebase/auth'
import {
	getFirestore,
	collection,
	query,
	where,
	getDocs,
	doc,
	getDoc,
} from 'firebase/firestore'
import { useNavigation } from '@react-navigation/native'
import Constants from 'expo-constants'

export default function ProfileScreen() {
	const navigation = useNavigation()
	const user = auth.currentUser
	const [loading, setLoading] = useState(false)
	const [roleLoading, setRoleLoading] = useState(true)
	const [userRole, setUserRole] = useState(null)
	const [ratingLoading, setRatingLoading] = useState(true)
	const [averageRating, setAverageRating] = useState('0.0')

	useEffect(() => {
		// Fetch user role from 'users' collection
		const fetchRole = async () => {
			try {
				const db = getFirestore()
				const userDoc = await getDoc(doc(db, 'users', user.uid))
				if (userDoc.exists()) {
					setUserRole(userDoc.data().userType)
				}
			} catch (e) {
				console.error('Ошибка загрузки роли пользователя:', e)
			} finally {
				setRoleLoading(false)
			}
		}
		fetchRole()
	}, [])

	useEffect(() => {
		// Fetch average rating only for employees
		if (userRole !== 'employee') {
			setRatingLoading(false)
			return
		}
		const fetchAverageRating = async () => {
			try {
				const db = getFirestore()
				const tasksQuery = query(
					collection(db, 'tasks'),
					where('employeeId', '==', user.uid)
				)
				const snapshot = await getDocs(tasksQuery)
				let sum = 0
				let count = 0
				snapshot.forEach(doc => {
					const rating = doc.data().rating
					if (rating != null && typeof rating === 'number') {
						sum += rating
						count += 1
					}
				})
				const avg = count > 0 ? sum / count : 0
				setAverageRating(avg.toFixed(1))
			} catch (e) {
				console.error('Ошибка загрузки среднего рейтинга:', e)
			} finally {
				setRatingLoading(false)
			}
		}
		fetchAverageRating()
	}, [userRole])

	const handleLogout = () => {
		Alert.alert(
			'Подтверждение выхода',
			'Вы действительно хотите выйти?',
			[
				{ text: 'Отмена', style: 'cancel' },
				{
					text: 'Выйти',
					onPress: async () => {
						try {
							setLoading(true)
							await signOut(auth)
							navigation.replace('Login')
						} catch {
							Alert.alert('Ошибка', 'Не удалось выйти')
						} finally {
							setLoading(false)
						}
					},
				},
			],
			{ cancelable: false }
		)
	}

	const handleDeleteAccount = () => {
		Alert.alert(
			'Удаление аккаунта',
			'Это действие необратимо. Вы уверены?',
			[
				{ text: 'Отмена', style: 'cancel' },
				{
					text: 'Удалить',
					style: 'destructive',
					onPress: async () => {
						try {
							setLoading(true)
							await deleteUser(user)
							navigation.replace('Login')
						} catch {
							Alert.alert('Ошибка', 'Не удалось удалить аккаунт')
						} finally {
							setLoading(false)
						}
					},
				},
			],
			{ cancelable: false }
		)
	}

	if (loading || roleLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size='large' />
			</View>
		)
	}

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<View style={styles.profileInfo}>
				{user?.photoURL ? (
					<Image source={{ uri: user.photoURL }} style={styles.avatar} />
				) : (
					<View style={[styles.avatar, styles.placeholderAvatar]}>
						<Text style={styles.placeholderText}>
							{user?.displayName?.[0] || '?'}
						</Text>
					</View>
				)}
				<Text style={styles.name}>{user?.displayName || 'Пользователь'}</Text>
				<Text style={styles.email}>{user?.email || 'Email не указан'}</Text>
				<Text style={styles.userId}>ID: {user?.uid || 'неизвестен'}</Text>
			</View>

			{/* Показ рейтинга только для employee */}
			{userRole === 'employee' && (
				<View style={styles.ratingContainer}>
					{ratingLoading ? (
						<ActivityIndicator />
					) : (
						<Text style={styles.ratingText}>
							Средняя оценка сотрудника: {averageRating}
						</Text>
					)}
				</View>
			)}

			<View style={styles.options}>
				<TouchableOpacity
					style={styles.optionButton}
					onPress={() => navigation.navigate('ChangePassword')}
				>
					<Text style={styles.optionText}>Сменить пароль</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.optionButton, styles.destructive]}
					onPress={handleDeleteAccount}
				>
					<Text style={[styles.optionText, styles.destructiveText]}>
						Удалить аккаунт
					</Text>
				</TouchableOpacity>
			</View>

			<TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
				<Text style={styles.logoutButtonText}>Выйти из аккаунта</Text>
			</TouchableOpacity>

			<Text style={styles.version}>
				Версия приложения: {Constants.manifest?.version || '1.0.0'}
			</Text>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	container: { padding: 20, backgroundColor: '#f5f5f5' },
	loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
	profileInfo: { alignItems: 'center', marginBottom: 20 },
	avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 20 },
	placeholderAvatar: {
		backgroundColor: '#ccc',
		justifyContent: 'center',
		alignItems: 'center',
	},
	placeholderText: { fontSize: 48, color: '#fff' },
	name: { fontSize: 24, fontWeight: 'bold', marginBottom: 5, color: '#333' },
	email: { fontSize: 16, color: '#666', marginBottom: 5 },
	userId: { fontSize: 12, color: '#999', marginBottom: 15 },
	ratingContainer: { alignItems: 'center', marginBottom: 20 },
	ratingText: { fontSize: 18, fontWeight: '500', color: '#333' },
	options: { marginBottom: 20 },
	optionButton: {
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#ddd',
	},
	optionText: { fontSize: 16, color: '#333' },
	destructive: { borderBottomColor: '#e74c3c' },
	destructiveText: { color: '#e74c3c' },
	logoutButton: {
		backgroundColor: '#e74c3c',
		padding: 15,
		borderRadius: 8,
		alignItems: 'center',
		marginBottom: 20,
	},
	logoutButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
	version: { textAlign: 'center', fontSize: 12, color: '#999' },
})

// ChangePasswordScreen.js (без изменений)
