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
import { ca } from "date-fns/locale";

export default function CreateTaskScreen({ navigation }) {
  const [task, setTask] = useState({ ...TaskStructure });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [showEmployeeList, setShowEmployeeList] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)

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
				deadline: serverTimestamp(), // Здесь должна быть ваша дата
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
		padding: 20,
		marginTop: 20,
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
})