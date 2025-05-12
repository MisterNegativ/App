import React, { useState, useEffect } from 'react';
import {View,Text,StyleSheet,Button,Alert,Image,TouchableOpacity,ActivityIndicator,ScrollView} from 'react-native';
import {doc,onSnapshot,updateDoc,arrayUnion,serverTimestamp,} from 'firebase/firestore';
import { db, auth, storage } from '../../firebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TaskStatus, TaskAction } from '../../models';
import * as FileSystem from 'expo-file-system';


export default function TaskDetailsScreen({ route, navigation }) {
  const { taskId } = route.params;
  const [task, setTask] = useState(null);
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false)

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'tasks', taskId), doc => {
      if (doc.exists()) {
        const data = doc.data();
        setTask({
          id: doc.id,
          ...data,
          formattedCreatedAt: data.createdAt
            ? format(data.createdAt.toDate(), 'HH:mm', { locale: ru })
            : '--:--',
        });
      }
    });
    return unsubscribe;
  }, [taskId]);

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
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Требуется разрешение', 'Необходим доступ к камере');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

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

  const openChat = () => {
    navigation.navigate('TaskChat', { 
      taskId: task.id,
      recipientId: auth.currentUser.uid === task.employerId ? task.employeeId : task.employerId,
      recipientName: auth.currentUser.uid === task.employerId 
        ? task.employeeName 
        : task.employerName
    });
  };

  const updateStatus = async newStatus => {
		try {
			let imageUrl = null

			if (newStatus === TaskStatus.IN_PROGRESS) {
				if (!image) {
					Alert.alert('Требуется фото', 'Сделайте фото выполненной работы')
					return
				}

				imageUrl = await uploadToCloudinary(image, taskId)
				if (!imageUrl) return
			}

			const historyEntry = {
				action: TaskAction.STATUS_CHANGED,
				status: newStatus,
				userId: auth.currentUser.uid,
				timestamp: new Date().toISOString(),
			}

			if (imageUrl) {
				historyEntry.proofImage = imageUrl
			}

			const updateData = {
				status: newStatus,
				history: arrayUnion(historyEntry),
			}

			if (newStatus === TaskStatus.IN_PROGRESS) {
				updateData.completedAt = serverTimestamp()  
				updateData.employeeProof = imageUrl
			}

			await updateDoc(doc(db, 'tasks', taskId), updateData)

			if (newStatus === TaskStatus.IN_PROGRESS) {
				Alert.alert('Успех', 'Задача завершена')
				setImage(null)
			}
		} catch (error) {
			console.error('Update error:', error)
			Alert.alert('Ошибка', error.message)
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
        return 'Открыта';
      case 'in_progress':
        return 'В работе';
      case 'blocked':
        return 'Проблема';
      case 'completed':
        return 'Завершена';
      default:
        return status;
    }
  };

  if (!task) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Загрузка данных...</Text>
      </View>
    );
  }

  return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.contentContainer}
		>
			{uploading && (
				<View style={styles.uploadingOverlay}>
					<ActivityIndicator size='large' color='#0000ff' />
					<Text style={styles.uploadingText}>Загрузка фото...</Text>
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
					<Image source={{ uri: task.employeeProof }} style={styles.image} />
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

			{image && (
				<View style={styles.imageContainer}>
					<Text style={styles.proofLabel}>Новое фото:</Text>
					<Image source={{ uri: image }} style={styles.image} />
					<Button
						title='Удалить фото'
						onPress={() => setImage(null)}
						color='#ff4444'
					/>
				</View>
			)}

			{auth.currentUser?.uid === task.employeeId &&
				task.status != TaskStatus.IN_PROGRESS && (
					<View style={styles.actions}>
						{task.status !== TaskStatus.BLOCKED && (
							<TouchableOpacity style={styles.button} onPress={()=>updateStatus(TaskStatus.BLOCKED)}>
								<Ionicons name='alert-circle-outline' size={20} color='#fff' />
								<Text style={styles.buttonText}>Возникли проблемы</Text>
							</TouchableOpacity>
						)}

						<TouchableOpacity style={styles.button} onPress={pickImage}>
							<Ionicons name='camera-outline' size={20} color='#fff' />
							<Text style={styles.buttonText}>Сделать фото работы</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={[
								styles.button,
								(!image || uploading) && styles.buttonDisabled,
							]}
							onPress={() => updateStatus(TaskStatus.IN_PROGRESS)}
							disabled={!image || uploading}
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
	proofLabel: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 8,
		color: '#424242',
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
})