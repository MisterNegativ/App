import React, { useState, useEffect } from 'react'
import {View,Text,StyleSheet,Button,Alert,Image,TouchableOpacity,} from 'react-native'
import {
	doc,
	onSnapshot,
	updateDoc,
	arrayUnion,
	serverTimestamp,
} from 'firebase/firestore'
import { db, auth, storage } from '../../firebaseConfig'
import * as ImagePicker from 'expo-image-picker'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { TaskStatus, TaskAction } from '../../models'

export default function TaskDetailsScreen({ route, navigation }) {
	const { taskId } = route.params
	const [task, setTask] = useState(null)
	const [image, setImage] = useState(null)
	const [uploading, setUploading] = useState(false)

	useEffect(() => {
		const unsubscribe = onSnapshot(doc(db, 'tasks', taskId), doc => {
			if (doc.exists()) {
				const data = doc.data()
				setTask({
					id: doc.id,
					...data,
					formattedCreatedAt: data.createdAt
						? format(data.createdAt.toDate(), 'HH:mm', { locale: ru })
						: '--:--',
				})
			}
		})
		return unsubscribe
	}, [taskId])

	const pickImage = async () => {
		const { status } = await ImagePicker.requestCameraPermissionsAsync()
		if (status !== 'granted') {
			Alert.alert('Требуется разрешение', 'Необходим доступ к камере')
			return
		}

		let result = await ImagePicker.launchCameraAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.8,
		})

		if (!result.canceled) {
			setImage(result.assets[0].uri)
		}
	}

	const uploadImage = async () => {
		if (!image) return

		setUploading(true)
		try {
			const response = await fetch(image)
			const blob = await response.blob()
			const storageRef = ref(storage, `task-proofs/${taskId}/${Date.now()}`)
			const snapshot = await uploadBytes(storageRef, blob)
			return await getDownloadURL(snapshot.ref)
		} catch (error) {
			Alert.alert('Ошибка', 'Не удалось загрузить изображение')
			return null
		} finally {
			setUploading(false)
		}
	}

<<<<<<< HEAD
	const openChat = () => {
		navigation.navigate('TaskChat', { 
		  taskId: task.id,
		  // Можно добавить дополнительную информацию:
		  recipientId: auth.currentUser.uid === task.employerId ? task.employeeId : task.employerId,
		  recipientName: auth.currentUser.uid === task.employerId 
			? task.employeeName 
			: task.employerName
		});
	  };

=======
>>>>>>> 403e663c603ae6aee4328f4a485921d838261833
	const updateStatus = async newStatus => {
		try {
			let imageUrl = null

			if (newStatus === TaskStatus.COMPLETED) {
				if (!image) {
					Alert.alert('Требуется фото', 'Сделайте фото выполненной работы')
					return
				}

				imageUrl = await uploadImage()
				if (!imageUrl) return
			}

			await updateDoc(doc(db, 'tasks', taskId), {
				status: newStatus,
				history: arrayUnion({
					action: TaskAction.STATUS_CHANGED,
					status: newStatus,
					userId: auth.currentUser.uid,
					timestamp: serverTimestamp(),
					...(imageUrl && { proofImage: imageUrl }),
				}),
				...(newStatus === TaskStatus.COMPLETED && {
					completedAt: serverTimestamp(),
					employeeProof: imageUrl,
				}),
			})

			if (newStatus === TaskStatus.COMPLETED) {
				Alert.alert('Успех', 'Задача завершена')
				setImage(null)
			}
		} catch (error) {
			Alert.alert('Ошибка', error.message)
		}
	}

	if (!task) {
		return (
			<View style={styles.loadingContainer}>
				<Text>Загрузка данных...</Text>
			</View>
		)
	}

	const getStatusText = status => {
		switch (status) {
			case 'open':
				return 'Открыта'
			case 'in_progress':
				return 'В работе'
			case 'blocked':
				return 'Проблема'
			case 'completed':
				return 'Завершена'
			default:
				return status
		}
	}

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.time}>{task.formattedCreatedAt}</Text>
				<Text style={styles.title}>{task.title || 'Без названия'}</Text>
			</View>

			<View style={styles.details}>
				<View style={styles.detailRow}>
					<Text style={styles.detailLabel}>Статус:</Text>
					<Text style={[styles.detailValue, styles[`status_${task.status}`]]}>
						{getStatusText(task.status)}
					</Text>
				</View>

				<View style={styles.detailRow}>
					<Text style={styles.detailLabel}>Создатель:</Text>
					<Text style={styles.detailValue}>
						{task.employerPhone || 'Нет номера'}
					</Text>
				</View>

				{task.description && (
					<View style={styles.descriptionContainer}>
						<Text style={styles.description}>{task.description}</Text>
					</View>
				)}
			</View>

			{image && (
				<View style={styles.imageContainer}>
					<Image source={{ uri: image }} style={styles.image} />
					<Button
						title='Удалить фото'
						onPress={() => setImage(null)}
						color='#ff4444'
					/>
				</View>
			)}

			{auth.currentUser?.uid === task.employeeId && (
				<View style={styles.actions}>
					<TouchableOpacity
						style={styles.problemButton}
						onPress={() => updateStatus(TaskStatus.BLOCKED)}
					>
						<Text style={styles.buttonText}>Возникли проблемы</Text>
					</TouchableOpacity>

					<TouchableOpacity style={styles.photoButton} onPress={pickImage}>
						<Text style={styles.buttonText}>Сделать фото работы</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.completeButton,
							(!image || uploading) && styles.disabledButton,
						]}
						onPress={() => updateStatus(TaskStatus.COMPLETED)}
						disabled={!image || uploading}
					>
						<Text style={styles.buttonText}>
							{uploading ? 'Отправка...' : 'Завершить задачу'}
						</Text>
					</TouchableOpacity>
				</View>
			)}

<<<<<<< HEAD
			
			<TouchableOpacity
				style={styles.chatButton}
				onPress={openChat}
			>
				<Text style={styles.chatButtonText}>💬 Чат</Text>
=======
			<TouchableOpacity
				style={styles.chatButton}
				onPress={() => navigation.navigate('TaskChat', { taskId })}
			>
				<Text style={styles.chatButtonText}>Чат</Text>
>>>>>>> 403e663c603ae6aee4328f4a485921d838261833
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
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	header: {
		marginBottom: 20,
		paddingBottom: 15,
		borderBottomWidth: 1,
		borderBottomColor: '#e0e0e0',
	},
	time: {
		fontSize: 14,
		color: '#757575',
		marginBottom: 5,
	},
	title: {
		fontSize: 22,
		fontWeight: 'bold',
		color: '#212121',
	},
	details: {
		backgroundColor: '#fff',
		borderRadius: 8,
		padding: 15,
		marginBottom: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	detailRow: {
		flexDirection: 'row',
		marginBottom: 10,
	},
	detailLabel: {
		width: 100,
		fontSize: 16,
		color: '#616161',
	},
	detailValue: {
		flex: 1,
		fontSize: 16,
	},
	status_open: {
		color: '#1976d2',
		fontWeight: 'bold',
	},
	status_in_progress: {
		color: '#ff8f00',
		fontWeight: 'bold',
	},
	status_blocked: {
		color: '#d32f2f',
		fontWeight: 'bold',
	},
	status_completed: {
		color: '#388e3c',
		fontWeight: 'bold',
	},
	descriptionContainer: {
		marginTop: 15,
		paddingTop: 15,
		borderTopWidth: 1,
		borderTopColor: '#eeeeee',
	},
	description: {
		fontSize: 15,
		lineHeight: 22,
		color: '#424242',
	},
	imageContainer: {
		marginBottom: 20,
		alignItems: 'center',
	},
	image: {
		width: '100%',
		height: 250,
		borderRadius: 8,
		marginBottom: 10,
		resizeMode: 'contain',
		backgroundColor: '#e0e0e0',
	},
	actions: {
		marginBottom: 20,
	},
	photoButton: {
		backgroundColor: '#4caf50',
		padding: 15,
		borderRadius: 8,
		alignItems: 'center',
		marginBottom: 10,
	},
	problemButton: {
		backgroundColor: '#f44336',
		padding: 15,
		borderRadius: 8,
		alignItems: 'center',
		marginBottom: 10,
	},
	completeButton: {
		backgroundColor: '#2196f3',
		padding: 15,
		borderRadius: 8,
		alignItems: 'center',
		marginBottom: 10,
	},
	disabledButton: {
		opacity: 0.6,
	},
	buttonText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 16,
	},
	chatButton: {
		backgroundColor: '#673ab7',
		padding: 15,
		borderRadius: 8,
		alignItems: 'center',
	},
	chatButtonText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 16,
	},
})
