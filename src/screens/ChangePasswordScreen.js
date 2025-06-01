import React, { useState } from 'react'
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
} from 'react-native'
import { auth } from '../../firebaseConfig'
import {
	reauthenticateWithCredential,
	EmailAuthProvider,
	updatePassword,
} from 'firebase/auth'
import { useNavigation } from '@react-navigation/native'

export function ChangePasswordScreen() {
	const navigation = useNavigation()
	const user = auth.currentUser
	const [currentPwd, setCurrentPwd] = useState('')
	const [newPwd, setNewPwd] = useState('')
	const [loading, setLoading] = useState(false)

	const handleChange = async () => {
		if (newPwd.length < 6) {
			Alert.alert('Ошибка', 'Новый пароль должен быть минимум 6 символов')
			return
		}
		setLoading(true)
		const cred = EmailAuthProvider.credential(user.email, currentPwd)
		try {
			await reauthenticateWithCredential(user, cred)
			await updatePassword(user, newPwd)
			Alert.alert('Успех', 'Пароль успешно изменён', [
				{ text: 'OK', onPress: () => navigation.goBack() },
			])
		} catch (e) {
			Alert.alert('Ошибка', e.message)
		} finally {
			setLoading(false)
		}
	}

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size='large' />
			</View>
		)
	}

	return (
		<View style={styles.container}>
			<Text style={styles.label}>Текущий пароль</Text>
			<TextInput
				style={styles.input}
				secureTextEntry
				value={currentPwd}
				onChangeText={setCurrentPwd}
			/>

			<Text style={styles.label}>Новый пароль</Text>
			<TextInput
				style={styles.input}
				secureTextEntry
				value={newPwd}
				onChangeText={setNewPwd}
			/>

			<TouchableOpacity style={styles.button} onPress={handleChange}>
				<Text style={styles.buttonText}>Сменить пароль</Text>
			</TouchableOpacity>
		</View>
	)
}

const styles = StyleSheet.create({
	container: { flex: 1, padding: 20, backgroundColor: '#fff' },
	loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
	label: { fontSize: 16, marginTop: 15, color: '#333' },
	input: {
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 5,
		padding: 10,
		marginTop: 5,
	},
	button: {
		backgroundColor: '#3498db',
		padding: 15,
		borderRadius: 8,
		alignItems: 'center',
		marginTop: 30,
	},
	buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
})
