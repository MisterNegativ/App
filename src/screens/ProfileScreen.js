import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { auth } from '../../firebaseConfig'
import { signOut } from 'firebase/auth'
import { useNavigation } from '@react-navigation/native'

export default function ProfileScreen() {
	const navigation = useNavigation()
	const user = auth.currentUser

const handleLogout = async () => {
	Alert.alert(
		'Подтверждение',
		'Вы действительно хотите выйти?',
		[
			{
				text: 'Отмена',
				style: 'cancel',
			},
			{
				text: 'Выйти',
				onPress: async () => {
					try {
						await signOut(auth)
						navigation.replace('Login')
					} catch (error) {
						Alert.alert('Ошибка', 'Не удалось выйти')
					}
				},
			},
		],
		{ cancelable: false }
	)
}

	return (
		<View style={styles.container}>
			<View style={styles.profileInfo}>
				{user?.photoURL && (
					<Image source={{ uri: user.photoURL }} style={styles.avatar} />
				)}

				<Text style={styles.name}>{user?.displayName || 'Пользователь'}</Text>

				<Text style={styles.email}>{user?.email || 'Email не указан'}</Text>

				<Text style={styles.userId}>ID: {user?.uid || 'неизвестен'}</Text>
			</View>

			<TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
				<Text style={styles.logoutButtonText}>Выйти из аккаунта</Text>
			</TouchableOpacity>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: '#f5f5f5',
	},
	profileInfo: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 30,
	},
	avatar: {
		width: 120,
		height: 120,
		borderRadius: 60,
		marginBottom: 20,
	},
	name: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 10,
		color: '#333',
	},
	email: {
		fontSize: 16,
		color: '#666',
		marginBottom: 5,
	},
	userId: {
		fontSize: 12,
		color: '#999',
		marginTop: 20,
	},
	logoutButton: {
		backgroundColor: '#e74c3c',
		padding: 15,
		borderRadius: 8,
		alignItems: 'center',
	},
	logoutButtonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
	},
})
