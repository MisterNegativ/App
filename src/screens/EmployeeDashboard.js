import React, { useEffect, useState } from 'react'
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
} from 'react-native'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db, auth } from '../../firebaseConfig'
import Ionicons from 'react-native-vector-icons/Ionicons'

export default function EmployeeDashboard({ navigation }) {
	const [tasks, setTasks] = useState([])
	const [filteredTasks, setFilteredTasks] = useState([])
	const [selectedStatus, setSelectedStatus] = useState('Все')

const statusLabels = {
	open: 'Открыта',
	in_progress: 'В работе',
	blocked: 'Проблема',
	completed: 'Завершено', // ← добавлено
}

const statuses = [
	{ value: 'Все', label: 'Все', icon: 'apps' },
	{ value: 'open', label: 'Открыта', icon: 'folder-open-outline' },
	{ value: 'in_progress', label: 'В работе', icon: 'time-outline' },
	{ value: 'blocked', label: 'Проблема', icon: 'alert-circle-outline' },
	{ value: 'completed', label: 'Завершено', icon: 'checkmark-done-outline' }, // ← добавлено
]



useEffect(() => {
	const user = auth.currentUser
	if (!user) return

const q = query(
	collection(db, 'tasks'),
	where('status', 'in', ['open', 'in_progress', 'blocked', 'completed']),
	where('employeeId', '==', user.uid)
)


	const unsubscribe = onSnapshot(q, snapshot => {
		const tasksData = snapshot.docs.map(doc => ({
			id: doc.id,
			...doc.data(),
		}))
		setTasks(tasksData)
		setFilteredTasks(tasksData)
	})

	return unsubscribe
}, [])


	useEffect(() => {
		if (selectedStatus === 'Все') {
			setFilteredTasks(tasks)
		} else {
			setFilteredTasks(tasks.filter(task => task.status === selectedStatus))
		}
	}, [selectedStatus, tasks])

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Панель сотрудника</Text>

			{/* Фильтры */}
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				style={styles.filterContainer}
			>
				{statuses.map(status => (
					<TouchableOpacity
						key={status.value}
						style={[
							styles.filterButton,
							selectedStatus === status.value && styles.activeFilterButton,
						]}
						onPress={() => setSelectedStatus(status.value)}
					>
						<Ionicons
							name={status.icon}
							size={16}
							color={selectedStatus === status.value ? '#fff' : '#333'}
							style={{ marginRight: 6 }}
						/>
						<Text
							style={[
								styles.filterButtonText,
								selectedStatus === status.value &&
									styles.activeFilterButtonText,
							]}
						>
							{status.label}
						</Text>
					</TouchableOpacity>
				))}
			</ScrollView>

			{/* Список задач */}
			<FlatList
				data={filteredTasks}
				ListEmptyComponent={<Text>Задачи не найдены</Text>}
				renderItem={({ item }) => (
					<TouchableOpacity
						style={styles.taskCard}
						onPress={() =>
							navigation.navigate('TaskDetails', { taskId: item.id })
						}
					>
						<Text style={styles.taskTitle}>{item.title}</Text>
						<Text>Статус: {statusLabels[item.status]}</Text>
						<Text>От: {item.employerPhone}</Text>
					</TouchableOpacity>
				)}
				keyExtractor={item => item.id}
				contentContainerStyle={{ paddingBottom: 100 }}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: { padding: 20, marginTop: 50 },
	title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
	taskCard: {
		padding: 16,
		marginBottom: 12,
		backgroundColor: '#fff',
		borderRadius: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
		borderLeftWidth: 5,
		borderLeftColor: '#007AFF',
	},

	taskTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 6,
		color: '#333',
	},
	taskText: {
		fontSize: 14,
		color: '#555',
		marginBottom: 2,
	},
	filterContainer: { flexDirection: 'row', marginBottom: 20 },
	filterButton: {
		flexDirection: 'row', // <--- добавлено
		alignItems: 'center',
		paddingVertical: 10,
		paddingHorizontal: 15,
		marginRight: 10,
		backgroundColor: '#eee',
		borderRadius: 20,
	},
	activeFilterButton: { backgroundColor: '#007AFF' },
	filterButtonText: { color: '#333', fontWeight: '600', paddingVertical: 5 },
	activeFilterButtonText: { color: '#fff' },
})
