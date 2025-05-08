import React, { useEffect, useState } from "react";
import { View, TextInput, Button, Alert, ScrollView, StyleSheet, TouchableOpacity, Text } from "react-native";
import {
	doc,
	setDoc,
	getDoc,
	serverTimestamp,
	collection,
	query,
	where,
	getDocs,
} from 'firebase/firestore'
import { db, auth, storage } from "../../firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { TaskStatus, TaskAction, TaskStructure } from "../../models";
import theme from "../constants/theme"
import { Timestamp } from 'firebase/firestore'
import { ca } from "date-fns/locale";
import DateTimePickerModal from 'react-native-modal-datetime-picker'

export default function CreateTaskScreen({ navigation }) {
  const [task, setTask] = useState({ ...TaskStructure });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [showEmployeeList, setShowEmployeeList] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [deadline, setDeadline] = useState(new Date())

	const [isDatePickerVisible, setDatePickerVisibility] = useState(false)

	const showDatePicker = () => setDatePickerVisibility(true)
	const hideDatePicker = () => setDatePickerVisibility(false)

	const handleConfirm = date => {
		setDeadline(date) // deadline — твоя дата задачи
		hideDatePicker()
	}



  useEffect(()=> {
    const fetchEmployees = async () => {
      try {
        const q = query(collection(db, "users"), where("userType", "==", "employee"));
        const querySnapshot = await getDocs(q);
        const employeesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEmployees(employeesList);
      } catch (error){
        console.error("Ошибка загрузки сотрудников:", error)
      }
    };
    fetchEmployees();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const uploadImage = async (uri) => { 
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = uri.substring(uri.lastIndexOf("/") + 1);
    const storageRef = ref(storage, `task-images/${filename}`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const scheduleDeadlineNotification = async (deadline, title) => {
		const now = new Date()
		const deadlineDate = new Date(deadline)

		const oneHourBefore = new Date(deadlineDate.getTime() - 60 * 60 * 1000) // 1 час
		const oneDayBefore = new Date(deadlineDate.getTime() - 24 * 60 * 60 * 1000) // 1 день

		if (oneDayBefore > now) {
			await Notifications.scheduleNotificationAsync({
				content: {
					title: 'Напоминание!',
					body: `Завтра дедлайн задачи: ${title}`,
				},
				trigger: oneDayBefore,
			})
		}

		if (oneHourBefore > now) {
			await Notifications.scheduleNotificationAsync({
				content: {
					title: 'Скоро дедлайн!',
					body: `Через 1 час задача "${title}" должна быть выполнена`,
				},
				trigger: oneHourBefore,
			})
		}
	}


  const handleSubmit = async () => {
    if (!task.title || !task.description) {
      Alert.alert("Ошибка", "Заполните название и описание");
      return;
    }

    setLoading(true);
    try {
			// 1. Получаем данные пользователя из Firestore
			const userDocRef = doc(db, 'users', auth.currentUser.uid)
			const userDocSnap = await getDoc(userDocRef)

			if (!userDocSnap.exists()) {
				throw new Error('Профиль пользователя не найден')
			}

			const userData = userDocSnap.data()
			const userPhone = userData.phone || 'Нет номера'
			// Загружаем изображения если есть
			let imageUrls = []
			for (const img of images) {
				const url = await uploadImage(img)
				imageUrls.push(url)
			}

			const taskData = {
				...task,
				startDate: serverTimestamp(),
				deadline: Timestamp.fromDate(deadline),
				status: TaskStatus.OPEN,
				employerId: auth.currentUser.uid,
				employeeId: selectedEmployee?.id || null,
				employeeName: selectedEmployee
					? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
					: null,
				createdAt: serverTimestamp(),
				images: imageUrls,
				history: [
					{
						action: TaskAction.CREATED,
						userId: auth.currentUser.uid,
						timestamp: new Date().toISOString(), // Используем ISO строку
					},
				],
				employerPhone: userPhone, // Используем номер из профиля пользователя
				employerName:
					auth.currentUser.displayName ||
					`${userData.firstName} ${userData.lastName}`,
			}

			await setDoc(doc(db, 'tasks', Date.now().toString()), taskData)
			await scheduleDeadlineNotification(deadline, task.title)
			Alert.alert('Успех', 'Задача создана')
			navigation.goBack()
		} catch (error) {
      Alert.alert("Ошибка", error.message);
    } finally {
      setLoading(false);
    }
  };



  return (
		<ScrollView contentContainerStyle={{ padding: 20, marginTop: 100 }}>
			<TextInput
				style={styles.input}
				placeholder='Название задачи'
				value={task.title}
				onChangeText={text => setTask({ ...task, title: text })}
			/>
			<TextInput
				placeholder='Описание'
				multiline
				value={task.description}
				onChangeText={text => setTask({ ...task, description: text })}
			/>
			<TouchableOpacity
				style={styles.employeeSelector}
				onPress={() => setShowEmployeeList(!showEmployeeList)}
			>
				<Text>
					{selectedEmployee
						? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
						: 'Выберите сотрудника'}
				</Text>
			</TouchableOpacity>
			{showEmployeeList && (
				<View style={styles.employeeList}>
					{employees.map(employee => (
						<TouchableOpacity
							key={employee.id}
							style={styles.employeeItem}
							onPress={() => {
								setSelectedEmployee(employee)
								setShowEmployeeList(false)
							}}
						>
							<Text>{`${employee.firstName} ${employee.lastName}`}</Text>
						</TouchableOpacity>
					))}
				</View>
			)}
			<TouchableOpacity onPress={showDatePicker}>
				<Text>Выбрать дедлайн: {deadline.toLocaleString()}</Text>
			</TouchableOpacity>

			<DateTimePickerModal
				isVisible={isDatePickerVisible}
				mode='datetime'
				onConfirm={handleConfirm}
				onCancel={hideDatePicker}
				themeVariant='light'
			/>

			<Button title='Добавить фото' onPress={pickImage} />
			<Button
				title='Создать задачу'
				onPress={handleSubmit}
				disabled={loading}
			/>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	container: {
	  flex: 1,
	  padding: theme.spacing.md,
	  backgroundColor: theme.colors.background,
	},
	scrollContainer: {
	  paddingBottom: theme.spacing.xl,
	},
	input: {
	  height: 50,
	  borderColor: theme.colors.gray,
	  borderWidth: 1,
	  borderRadius: theme.radius.md,
	  paddingHorizontal: theme.spacing.md,
	  marginBottom: theme.spacing.md,
	  backgroundColor: theme.colors.white,
	  fontSize: theme.text.body.fontSize,
	},
	descriptionInput: {
	  height: 120,
	  textAlignVertical: 'top',
	  paddingTop: theme.spacing.sm,
	},
	employeeSelector: {
	  borderWidth: 1,
	  borderColor: theme.colors.gray,
	  borderRadius: theme.radius.md,
	  padding: theme.spacing.md,
	  marginBottom: theme.spacing.md,
	  backgroundColor: theme.colors.white,
	},
	employeeList: {
	  marginBottom: theme.spacing.md,
	  borderWidth: 1,
	  borderColor: theme.colors.lightGray,
	  borderRadius: theme.radius.md,
	  maxHeight: 200,
	},
	employeeItem: {
	  padding: theme.spacing.md,
	  borderBottomWidth: 1,
	  borderBottomColor: theme.colors.lightGray,
	},
	imagePreview: {
	  flexDirection: 'row',
	  flexWrap: 'wrap',
	  marginBottom: theme.spacing.md,
	},
	imageContainer: {
	  width: 100,
	  height: 100,
	  marginRight: theme.spacing.sm,
	  marginBottom: theme.spacing.sm,
	  borderRadius: theme.radius.sm,
	  overflow: 'hidden',
	},
	image: {
	  width: '100%',
	  height: '100%',
	},
	button: {
	  backgroundColor: theme.colors.primary,
	  padding: theme.spacing.md,
	  borderRadius: theme.radius.md,
	  alignItems: 'center',
	  marginBottom: theme.spacing.sm,
	},
	buttonText: {
	  color: theme.colors.white,
	  fontWeight: 'bold',
	},
	removeImageButton: {
	  position: 'absolute',
	  top: 5,
	  right: 5,
	  backgroundColor: theme.colors.danger,
	  width: 24,
	  height: 24,
	  borderRadius: 12,
	  justifyContent: 'center',
	  alignItems: 'center',
	},
	input: {
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 5,
		padding: 10,
		marginBottom: 15,
	},
	employeeSelector: {
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 5,
		padding: 15,
		marginBottom: 15,
	},
	employeeList: {
		marginBottom: 15,
		borderWidth: 1,
		borderColor: '#eee',
		borderRadius: 5,
	},
	employeeItem: {
		padding: 15,
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
	},
	imagePreview: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginBottom: 15,
	},
	imageContainer: {
		width: 100,
		height: 100,
		marginRight: 10,
		marginBottom: 10,
	},
	image: {
		width: '100%',
		height: '100%',
		resizeMode: 'cover',
	},

});