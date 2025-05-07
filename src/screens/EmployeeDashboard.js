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

export default function EmployeeDashboard({ navigation }) {
	const [tasks, setTasks] = useState([])
	const [filteredTasks, setFilteredTasks] = useState([])
	const [selectedStatus, setSelectedStatus] = useState('Все')

	const statusLabels = {
		open: 'Открыта',
		in_progress: 'В работе',
		blocked: 'Проблема',
	}

	const statuses = [
		{ value: 'Все', label: 'Все' },
		{ value: 'open', label: 'Открыта' },
		{ value: 'in_progress', label: 'В работе' },
		{ value: 'blocked', label: 'Проблема' },
	]

useEffect(() => {
	const user = auth.currentUser
	if (!user) return

	const q = query(
		collection(db, 'tasks'),
		where('status', 'in', ['open', 'in_progress', 'blocked']),
		where('employeeId', '==', user.uid) // <-- фильтрация по UID сотрудника
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
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: { padding: 20, marginTop: 50 },
	title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
	taskCard: {
		padding: 15,
		marginBottom: 10,
		backgroundColor: '#f9f9f9',
		borderRadius: 5,
	},
	taskTitle: { fontWeight: 'bold' },
	filterContainer: { flexDirection: 'row', marginBottom: 20 },
	filterButton: {
		paddingVertical: 10,
		paddingHorizontal: 15,
		marginRight: 10,
		backgroundColor: '#eee',
		borderRadius: 20,
	},
	activeFilterButton: { backgroundColor: '#007AFF' },
	filterButtonText: { color: '#333', fontWeight: '600', paddingVertical: 5
},
	activeFilterButtonText: { color: '#fff' },
})
