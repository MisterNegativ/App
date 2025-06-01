import React, { useEffect, useState } from "react";
import { View, Image, Alert, ScrollView, StyleSheet, Text } from "react-native";
import { Provider as PaperProvider, DefaultTheme, TextInput, Button, Card, Avatar, List } from 'react-native-paper';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db, auth, storage } from "../../firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { TaskStatus, TaskAction, TaskStructure } from "../../models";
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import * as Notifications from 'expo-notifications'
import { Picker } from "@react-native-picker/picker";


const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3B82F6',    
    accent: '#60A5FA',     
    background: '#F2F2F2',
    surface: '#FFFFFF',
    placeholder: '#6B7280', 
    text: '#111827',      
  },
};

export default function CreateTaskScreen({ navigation }) {
  const [task, setTask] = useState({ ...TaskStructure });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [showEmployeeList, setShowEmployeeList] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deadline, setDeadline] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirm = date => {
    setDeadline(date);
    hideDatePicker();
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const q = query(collection(db, "users"), where("userType", "==", "employee"));
        const querySnapshot = await getDocs(q);
        const employeesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEmployees(employeesList);
      } catch (error) {
        console.error("Ошибка загрузки сотрудников:", error);
      }
    };
    fetchEmployees();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 1 });
    if (!result.canceled) setImages(prev => [...prev, result.assets[0].uri]);
  };

  const uploadImage = async uri => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = uri.substring(uri.lastIndexOf('/') + 1);
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
    const newTaskId = Date.now().toString();
    try {
      const userDocSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (!userDocSnap.exists()) throw new Error('Профиль пользователя не найден');
      const userData = userDocSnap.data();
      const imageUrls = await Promise.all(images.map(uri => uploadImage(uri)));
      const taskData = {
				...task,
				startDate: serverTimestamp(),
				deadline: deadline,
				status: TaskStatus.OPEN,
				priority: task.priority || 'medium', // low, medium, high
				employerId: auth.currentUser.uid,
				employeeId: selectedEmployee?.id,
				employeeName: selectedEmployee
					? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
					: null,
				createdAt: serverTimestamp(),
				images: imageUrls,
				history: [
					{
						action: TaskAction.CREATED,
						userId: auth.currentUser.uid,
						timestamp: new Date().toISOString(),
					},
				],
				employerPhone: userData.phone || 'Нет номера',
				employerName:
					auth.currentUser.displayName ||
					`${userData.firstName} ${userData.lastName}`,
			}
      await setDoc(doc(db, 'tasks', Date.now().toString()), taskData);
      await Notifications.scheduleNotificationAsync({
				content: {
					title: 'Напоминание по задаче',
					body: `Скоро дедлайн: ${task.title}`,
					data: { taskId: newTaskId },
				},
				trigger: deadline, // здесь deadline — ваш JS Date
			})
      Alert.alert('Успех', 'Задача создана');
      navigation.goBack();
    } catch (error) {
      Alert.alert("Ошибка", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
		<PaperProvider theme={theme}>
			<Text style={styles.title}>Создать задачу</Text>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				style={styles.container}
			>
				<Card style={styles.card}>
					<Card.Content>
						<TextInput
							label='Название задачи'
							mode='outlined'
							value={task.title}
							onChangeText={text => setTask({ ...task, title: text })}
							style={styles.input}
						/>
						<TextInput
							label='Описание'
							mode='outlined'
							value={task.description}
							multiline
							onChangeText={text => setTask({ ...task, description: text })}
							style={[styles.input, styles.descriptionInput]}
						/>
						<Text style={styles.label}>Приоритет</Text>
						<View style={styles.selectBox}>
							<Picker
								selectedValue={task.priority}
								onValueChange={value => setTask({ ...task, priority: value })}
							>
								<Picker.Item label='Низкий' value='low' />
								<Picker.Item label='Средний' value='medium' />
								<Picker.Item label='Высокий' value='high' />
							</Picker>
						</View>
						<List.Section>
							<List.Accordion
								title={
									selectedEmployee
										? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
										: 'Выберите сотрудника'
								}
								left={props => (
									<Avatar.Icon
										{...props}
										icon='account'
										color={theme.colors.background}
									/>
								)}
								onPress={() => setShowEmployeeList(val => !val)}
								style={styles.accordion}
							>
								{employees.map(emp => (
									<List.Item
										key={emp.id}
										title={`${emp.firstName} ${emp.lastName}`}
										onPress={() => {
											setSelectedEmployee(emp)
											setShowEmployeeList(false)
										}}
										titleStyle={{ color: theme.colors.text }}
									/>
								))}
							</List.Accordion>
						</List.Section>
						<Button
							icon='calendar'
							mode='contained'
							onPress={showDatePicker}
							style={styles.button}
						>
							{deadline.toLocaleString()}
						</Button>
						<DateTimePickerModal
							isVisible={isDatePickerVisible}
							mode='datetime'
							onConfirm={handleConfirm}
							onCancel={hideDatePicker}
							themeVariant='light'
						/>
						<Button
							icon='image'
							mode='contained'
							onPress={pickImage}
							style={styles.button}
						>
							Добавить фото
						</Button>
						<View style={styles.imagePreview}>
							{images.map((uri, idx) => (
								<View key={idx} style={styles.imageContainer}>
									<Image source={{ uri }} style={styles.image} />
									<Button
										icon='close'
										compact
										mode='contained'
										onPress={() =>
											setImages(images.filter((_, i) => i !== idx))
										}
										style={styles.removeButton}
										color={theme.colors.accent}
									/>
								</View>
							))}
						</View>
						<Button
							mode='contained'
							onPress={handleSubmit}
							loading={loading}
							style={styles.submitButton}
						>
							Создать задачу
						</Button>
					</Card.Content>
				</Card>
			</ScrollView>
		</PaperProvider>
	)
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: theme.colors.background },
	title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 70, marginLeft:20 },

	scrollContent: { padding: 20, paddingBottom: 40 },
	card: {
		borderRadius: 16,
		elevation: 4,
		backgroundColor: theme.colors.surface,
		padding: 10,
	},
	input: { marginBottom: 16, backgroundColor: theme.colors.surface, },
	descriptionInput: { height: 100 },
	accordion: { backgroundColor: '#F3F4F6', marginBottom: 16 },
	button: { marginVertical: 8, borderRadius: 8 },
	imagePreview: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 16 },
	imageContainer: { position: 'relative', marginRight: 8, marginBottom: 8 },
	image: { width: 100, height: 100, borderRadius: 12 },
	removeButton: {
		position: 'absolute',
		top: 4,
		right: 4,
		width: 24,
		height: 24,
		borderRadius: 12,
	},
	submitButton: { marginTop: 16, borderRadius: 8 },
})
