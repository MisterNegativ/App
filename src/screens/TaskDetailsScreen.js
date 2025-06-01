import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Button,
	Alert,
	Image,
	TouchableOpacity,
	ActivityIndicator,
	ScrollView,
	Linking,
	Modal,
} from 'react-native'
import {doc,onSnapshot,updateDoc,arrayUnion,serverTimestamp,} from 'firebase/firestore';
import { db, auth, storage } from '../../firebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { format } from 'date-fns';
import * as Sharing from 'expo-sharing'
import { ru } from 'date-fns/locale';
import { TaskStatus, TaskAction } from '../../models';

export default function TaskDetailsScreen({ route, navigation }) {
	const { taskId } = route.params
	const [task, setTask] = useState(null)
	const [images, setImages] = useState([])
	const [uploading, setUploading] = useState(false)
	const [selectedFiles, setSelectedFiles] = useState([])
	const [ratingSubmitting, setRatingSubmitting] = useState(false)
	const [modalVisible, setModalVisible] = useState(false)
	const [activeImageUri, setActiveImageUri] = useState(null)


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

	useEffect(() => {
		console.log('Selected files:', selectedFiles)
	}, [selectedFiles])

	const rateTask = async value => {
		try {
			setRatingSubmitting(true)

			const historyEntry = {
				action: 'RATED',
				userId: auth.currentUser.uid,
				value,
				timestamp: new Date().toISOString(),
			}

			await updateDoc(doc(db, 'tasks', taskId), {
				rating: value,
				history: arrayUnion(historyEntry),
			})

			Alert.alert('Спасибо!', `Вы поставили оценку: ${value} ⭐`)
		} catch (error) {
			console.error('Ошибка при оценке:', error)
			Alert.alert('Ошибка', 'Не удалось сохранить оценку')
		} finally {
			setRatingSubmitting(false)
		}
	}

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

		if (!result.canceled && result.assets && result.assets.length > 0) {
			setImages(prev => [...prev, result.assets[0].uri])
		}
	}

	const pickFiles = async () => {
		try {
			const result = await DocumentPicker.getDocumentAsync({
				type: '*/*',
				copyToCacheDirectory: true,
				multiple: false, // пока один за раз
			})

			console.log('Результат выбора:', result)

			// В новой версии API:
			if (!result.canceled && result.assets && result.assets.length > 0) {
				const asset = result.assets[0]
				setSelectedFiles(prev => [
					...prev,
					{
						uri: asset.uri,
						name: asset.name,
						mime: asset.mimeType,
					},
				])
			} else {
				console.log('Выбор файла отменён')
			}
		} catch (e) {
			console.error('Ошибка при DocumentPicker:', e)
		}
	}

	const uploadToCloudinary = async (imageUri, taskId) => {
		if (!imageUri) return null

		console.log('Загрузка изображения в Cloudinary...')
		try {
			const fileInfo = await FileSystem.getInfoAsync(imageUri)
			const imageSize = fileInfo.size || 0
			console.log('Размер файла:', imageSize)

			if (imageSize > 5 * 1024 * 1024) {
				Alert.alert('Ошибка', 'Файл слишком большой. Максимальный размер: 5MB')
				return null
			}

			const response = await fetch(imageUri)
			const blob = await response.blob()

			console.log('Тип blob-а:', blob.type)

			const formData = new FormData()
			formData.append('file', {
				uri: imageUri,
				type: blob.type || 'image/jpeg',
				name: `image_${Date.now()}.jpg`,
			})
			formData.append('upload_preset', 'unsigned_preset')
			formData.append('cloud_name', 'dofzhqjwv') //

			const uploadResponse = await fetch(
				'https://api.cloudinary.com/v1_1/dofzhqjwv/image/upload',
				{
					method: 'POST',
					body: formData,
				}
			)

			const result = await uploadResponse.json()
			console.log('Изображение загружено:', result.secure_url)

			if (result.secure_url) {
				return result.secure_url
			} else {
				throw new Error('Ошибка загрузки изображения')
			}
		} catch (error) {
			console.log('Ошибка загрузки на Cloudinary:', error)
			Alert.alert('Ошибка', 'Не удалось загрузить изображение')
			return null
		}
	}

	// constants — ваш unsigned upload preset и имя облака
	async function uploadFileToCloudinary(file, folder = `tasks/${taskId}`) {
		// Читаем файл как base64
		const b64 = await FileSystem.readAsStringAsync(file.uri, {
			encoding: FileSystem.EncodingType.Base64,
		})
		if (!b64) {
			throw new Error('Empty file')
		}

		// Собираем FormData с data URI
		const formData = new FormData()
		formData.append('file', `data:${file.mime};base64,${b64}`)
		formData.append('upload_preset', 'unsigned_preset')
		formData.append('folder', folder)

		const res = await fetch(
			`https://api.cloudinary.com/v1_1/dofzhqjwv/raw/upload`,
			{ method: 'POST', body: formData }
		)

		if (!res.ok) {
			const err = await res.json().catch(() => ({}))
			throw new Error(
				`Cloudinary upload failed: ${err.error?.message || res.statusText}`
			)
		}

		const json = await res.json()
		if (!json.secure_url) {
			throw new Error('Cloudinary did not return a secure_url')
		}

		return { name: file.name, url: json.secure_url }
	}

	async function uploadSelectedFilesToCloudinary(taskId, selectedFiles) {
		const uploaded = []
		for (const file of selectedFiles) {
			const result = await uploadFileToCloudinary(file, `tasks/${taskId}`)
			uploaded.push(result)
		}
		return uploaded
	}

	const openChat = () => {
		navigation.navigate('TaskChat', {
			taskId: task.id,
			recipientId:
				auth.currentUser.uid === task.employerId
					? task.employeeId
					: task.employerId,
			recipientName:
				auth.currentUser.uid === task.employerId
					? task.employeeName
					: task.employerName,
		})
	}

	const updateStatus = async newStatus => {
		try {
			setUploading(true)
			const imageUrls = []
			let proofFiles = []

			if (newStatus === TaskStatus.IN_PROGRESS) {
				if (images.length === 0) {
					Alert.alert('Требуется фото', 'Сделайте фото выполненной работы')
					return
				}
				
				for (const uri of images) {
					const url = await uploadToCloudinary(uri, taskId)
					imageUrls.push(url)
				}
			}

			// 2) Все выбранные файлы
			if (selectedFiles.length > 0) {
				proofFiles = await uploadSelectedFilesToCloudinary(
					taskId,
					selectedFiles
				)
			}

			// 3) История
			const historyEntry = {
				action: TaskAction.STATUS_CHANGED,
				status: newStatus,
				userId: auth.currentUser.uid,
				timestamp: new Date().toISOString(),
			}
			if (imageUrls) historyEntry.proofImage = imageUrls
			if (proofFiles.length) historyEntry.proofFiles = proofFiles

			// 4) Данные для updateDoc
			const updateData = {
				status: newStatus,
				history: arrayUnion(historyEntry),
			}
			if (imageUrls) {
				updateData.employeeProof = imageUrls
				updateData.completedAt = serverTimestamp()
			}
			if (proofFiles.length) {
				updateData.proofFiles = arrayUnion(...proofFiles)
			}

			// 5) Заливка в Firestore
			await updateDoc(doc(db, 'tasks', taskId), updateData)

			// 6) Чистка
			if (newStatus === TaskStatus.IN_PROGRESS) {
				Alert.alert('Успех', 'Задача завершена')
				setImages([])
			}
			setSelectedFiles([])
		} catch (error) {
			console.error('Update error:', error)
			Alert.alert('Ошибка', error.message)
		} finally {
			setUploading(false) // ← Выключаем спиннер
		}
	}

	const downloadAndOpenFile = async (url, fileName) => {
		try {
			const localUri = FileSystem.cacheDirectory + fileName
			const info = await FileSystem.getInfoAsync(localUri)
			if (!info.exists) {
				const { uri } = await FileSystem.downloadAsync(url, localUri)
				console.log('Downloaded to', uri)
			}
			await Sharing.shareAsync(localUri)
		} catch (e) {
			console.error(e)
			Alert.alert('Ошибка', 'Не удалось открыть файл')
		}
	}

	const confirmCompletion = async () => {
		try {
			const updateData = {
				status: 'completed',
				history: arrayUnion({
					action: 'employer_confirmed_completion',
					status: 'completed',
					userId: auth.currentUser.uid,
					timestamp: new Date().toISOString(),
				}),
				completedAt: serverTimestamp(),
			}

			await updateDoc(doc(db, 'tasks', task.id), updateData)
			Alert.alert('Готово', 'Вы подтвердили завершение задачи')
		} catch (error) {
			console.error('Ошибка подтверждения:', error)
			Alert.alert('Ошибка', error.message)
		}
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

	if (!task) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size='large' />
				<Text>Загрузка данных...</Text>
			</View>
		)
	}

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.contentContainer}
		>
			{uploading && (
				<View style={styles.uploadingOverlay}>
					<ActivityIndicator size='large' color='#0000ff' />
					<Text style={styles.uploadingText}>Загрузка...</Text>
				</View>
			)}

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
						{task.employerName || 'Не указано'}
					</Text>
				</View>

				<View style={styles.detailRow}>
					<Text style={styles.detailLabel}>Телефон:</Text>
					<Text style={styles.detailValue}>
						{task.employerPhone || 'Не указан'}
					</Text>
				</View>

				{task?.deadline && (
					<View style={styles.detailRow}>
						<Text style={styles.detailLabel}>Дедлайн:</Text>
						<Text style={styles.detailValue}>
							{format(task.deadline.toDate(), 'dd MMMM yyyy, HH:mm')}
						</Text>
					</View>
				)}

				{task.description && (
					<View style={styles.descriptionContainer}>
						<Text style={styles.descriptionLabel}>Описание:</Text>
						<Text style={styles.description}>{task.description}</Text>
					</View>
				)}
			</View>

			{task.employeeProof && (
				<View style={styles.imageContainer}>
					<Text style={styles.proofLabel}>Подтверждение выполнения:</Text>
					<View style={styles.proofsWrapper}>
						{Array.isArray(task.employeeProof) ? (
							// Если массив — рендерим все элементы
							task.employeeProof.map((uri, idx) => (
								<TouchableOpacity
									key={idx}
									onPress={() => {
										setActiveImageUri(uri)
										setModalVisible(true)
									}}
								>
									<Image source={{ uri }} style={styles.proofImage} />
								</TouchableOpacity>
							))
						) : (
							// Если строка — один элемент
							<TouchableOpacity
								onPress={() => {
									setActiveImageUri(task.employeeProof)
									setModalVisible(true)
								}}
							>
								<Image
									source={{ uri: task.employeeProof }}
									style={styles.proofImage}
								/>
							</TouchableOpacity>
						)}
					</View>
				</View>
			)}

			{task.proofFiles && task.proofFiles.length > 0 && (
				<View style={styles.filesContainer}>
					<Text style={styles.proofLabel}>Прикреплённые файлы:</Text>
					{task.proofFiles.map((file, idx) => (
						<TouchableOpacity
							key={idx}
							style={styles.fileRow}
							onPress={() => downloadAndOpenFile(file.url, file.name)}
						>
							<Ionicons
								name={
									/\.(pdf|docx?)$/i.test(file.name)
										? 'document-text-outline'
										: 'image-outline'
								}
								size={20}
								color='#333'
							/>
							<Text style={styles.fileName}>{file.name}</Text>
						</TouchableOpacity>
					))}
				</View>
			)}

			{auth.currentUser?.uid === task.employerId &&
				task.status === 'in_progress' && (
					<TouchableOpacity style={styles.button} onPress={confirmCompletion}>
						<Ionicons name='checkmark-circle-outline' size={20} color='#fff' />
						<Text style={styles.buttonText}>ПОДТВЕРДИТЬ ЗАВЕРШЕНИЕ</Text>
					</TouchableOpacity>
				)}

			{auth.currentUser?.uid === task.employerId &&
				task.status === 'completed' &&
				task.rating == null && (
					<View style={styles.ratingContainer}>
						<Text style={styles.proofLabel}>
							Поставьте оценку выполненной работе:
						</Text>
						<View style={styles.ratingButtons}>
							{[1, 2, 3, 4, 5].map(star => (
								<TouchableOpacity
									key={star}
									onPress={() => rateTask(star)}
									disabled={ratingSubmitting}
									style={styles.starButton}
								>
									<Text style={styles.starText}>⭐ {star}</Text>
								</TouchableOpacity>
							))}
						</View>
					</View>
				)}

			{images.length > 0 && (
				<View style={styles.previewContainer}>
					{images.map((uri, idx) => (
						<View key={idx} style={styles.imageWrapper}>
							{/* Собственно фото */}
							<Image source={{ uri }} style={styles.previewImage} />

							{/* Кнопка удаления фото */}
							<TouchableOpacity
								style={styles.removeButton}
								onPress={() =>
									setImages(prev => prev.filter((_, i) => i !== idx))
								}
							>
								<Text style={styles.removeText}>✕</Text>
							</TouchableOpacity>
						</View>
					))}
				</View>
			)}

			{auth.currentUser?.uid === task.employeeId && (
				<View style={styles.actions}>
					{task.status !== TaskStatus.BLOCKED && (
						<TouchableOpacity
							style={styles.button}
							onPress={() => updateStatus(TaskStatus.BLOCKED)}
						>
							<Ionicons name='alert-circle-outline' size={20} color='#fff' />
							<Text style={styles.buttonText}>Возникли проблемы</Text>
						</TouchableOpacity>
					)}

					<TouchableOpacity style={styles.button} onPress={pickImage}>
						<Ionicons name='camera-outline' size={20} color='#fff' />
						<Text style={styles.buttonText}>Сделать фото работы</Text>
					</TouchableOpacity>

					<TouchableOpacity style={styles.button} onPress={pickFiles}>
						<Ionicons name='document-attach-outline' size={20} color='#fff' />
						<Text style={styles.buttonText}>Выбрать файлы</Text>
					</TouchableOpacity>

					{selectedFiles.length > 0 && (
						<View style={{ marginTop: 10 }}>
							<Text style={{ fontWeight: 'bold' }}>Выбранные файлы:</Text>
							{selectedFiles.map((file, index) => (
								<View
									key={index}
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										marginTop: 8,
									}}
								>
									<Ionicons
										name={
											file.mime.startsWith('image/')
												? 'image-outline'
												: 'document-text-outline'
										}
										size={20}
										color='#333'
									/>
									<Text style={{ marginLeft: 8, flexShrink: 1 }}>
										{file.name}
									</Text>
								</View>
							))}
						</View>
					)}

					<TouchableOpacity
						style={[
							styles.button,
							(images.length === 0 || uploading) && styles.buttonDisabled,
						]}
						onPress={() => updateStatus(TaskStatus.IN_PROGRESS)}
						disabled={images.length === 0 || uploading}
					>
						<Ionicons name='checkmark-done-outline' size={20} color='#fff' />
						<Text style={styles.buttonText}>
							{uploading ? 'Отправка...' : 'Завершить задачу'}
						</Text>
					</TouchableOpacity>
				</View>
			)}

			<TouchableOpacity style={styles.button} onPress={openChat}>
				<Ionicons name='chatbubble-ellipses-outline' size={20} color='#fff' />
				<Text style={styles.buttonText}>Чат</Text>
			</TouchableOpacity>

			<Modal
				visible={modalVisible}
				transparent
				animationType='fade'
				onRequestClose={() => setModalVisible(false)} // для Android кнопки «Назад»
			>
				{/* Фон */}
				<TouchableOpacity
					style={styles.modalBackground}
					activeOpacity={1}
					onPress={() => setModalVisible(false)}
				>
					{/* Контейнер для картинки, чтобы нажатие на неё не закрывало */}
					<View style={styles.imageContainers}>
						{activeImageUri ? (
							<Image
								source={{ uri: activeImageUri }}
								style={styles.fullscreenImage}
								resizeMode='contain'
							/>
						) : (
							<Text style={styles.errorText}>
								Не удалось загрузить изображение
							</Text>
						)}
					</View>
				</TouchableOpacity>
			</Modal>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	contentContainer: {
		padding: 20,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	uploadingOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(255,255,255,0.8)',
		zIndex: 100,
	},
	uploadingText: {
		marginTop: 10,
		fontSize: 16,
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
		alignItems: 'center',
	},
	detailLabel: {
		width: 100,
		fontSize: 16,
		color: '#616161',
		fontWeight: '500',
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
	descriptionLabel: {
		fontSize: 16,
		fontWeight: '500',
		color: '#616161',
		marginBottom: 5,
	},
	description: {
		fontSize: 15,
		lineHeight: 22,
		color: '#424242',
	},
	imageContainer: {
		marginBottom: 20,
		backgroundColor: '#fff',
		borderRadius: 8,
		padding: 15,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	imageContainers: {
		width: '90%',
		height: '80%',
		// Важно: не делать здесь `flex:1` иначе фон не поймает нажатия
	},
	proofLabel: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 8,
		color: '#424242',
	},
	proofsWrapper: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginTop: 8,
	},
	proofImage: {
		width: 100,
		height: 100,
		borderRadius: 6,
		marginRight: 8,
		marginBottom: 8,
	},
	modalBackground: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.8)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	fullscreenImage: {
		width: '100%',
		height: '100%',
	},
	actions: {
		marginBottom: 20,
	},
	disabledButton: {
		opacity: 0.6,
	},
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#6200EE',
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderRadius: 8,
		margin: 4,
		minWidth: 140,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
		elevation: 4,
	},
	buttonDisabled: {
		backgroundColor: '#ccc',
	},
	buttonText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '600',
		marginLeft: 6,
	},
	ratingContainer: {
		backgroundColor: '#fff',
		padding: 16,
		borderRadius: 8,
		marginBottom: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	ratingButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 10,
	},
	starButton: {
		backgroundColor: '#FFD700',
		padding: 10,
		borderRadius: 8,
		minWidth: 50,
		alignItems: 'center',
	},
	starText: {
		fontSize: 16,
		fontWeight: 'bold',
	},
	filesContainer: {
		marginVertical: 16,
		padding: 12,
		backgroundColor: '#fff',
		borderRadius: 8,
	},
	proofLabel: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 8,
	},
	fileRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 6,
	},
	fileName: {
		marginLeft: 12,
		fontSize: 15,
		color: '#007AFF',
		textDecorationLine: 'underline',
	},
	previewContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginVertical: 10,
	},
	imageWrapper: {
		position: 'relative',
		marginRight: 8,
		marginBottom: 8,
	},
	previewImage: {
		width: 80,
		height: 80,
		borderRadius: 6,
	},
	removeButton: {
		position: 'absolute',
		top: -6,
		right: -6,
		backgroundColor: '#f00',
		borderRadius: 12,
		width: 24,
		height: 24,
		justifyContent: 'center',
		alignItems: 'center',
	},
	removeText: {
		color: '#fff',
		fontWeight: 'bold',
	},
	actions: {
		marginVertical: 20,
	},
})