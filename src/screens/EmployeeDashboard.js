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
import { TaskStatus } from '../../models'

export default function EmployeeDashboard({ navigation }) {
	const [tasks, setTasks] = useState([])
	const [filteredTasks, setFilteredTasks] = useState([])
	const [selectedStatus, setSelectedStatus] = useState('Все')

	const statusLabels = {
		open: 'Открыта',
		in_progress: 'В работе',
		blocked: 'Проблема',
<<<<<<< HEAD
		completed: 'Завершено', // ← добавлено
	}

	// Передаём теперь и статус
	const getBorderColorByDeadline = (deadline, status) => {
		// Если задача завершена — сразу зелёный
		if (status === TaskStatus.COMPLETED) {
			return '#388E3C' // зелёный
		}

		if (!deadline) return '#007AFF' // синий по умолчанию
=======
		completed: 'Завершено', 
	}

	const getBorderColorByDeadline = (deadline, status) => {
		if (status === TaskStatus.COMPLETED) {
			return '#388E3C' 
		}

		if (!deadline) return '#007AFF' 
>>>>>>> d06e9d4 (Bugs fixes)

		const now = new Date()
		const diffMs = deadline.toDate() - now
		const diffHours = diffMs / (1000 * 60 * 60)

		if (diffHours <= 1) {
<<<<<<< HEAD
			return '#D32F2F' // красный
		} else if (diffHours <= 24) {
			return '#FF8F00' // оранжевый
		} else {
			return '#007AFF' // синий
=======
			return '#D32F2F' 
		} else if (diffHours <= 24) {
			return '#FF8F00'
		} else {
			return '#007AFF' 
>>>>>>> d06e9d4 (Bugs fixes)
		}
	}

	const statuses = [
		{ value: 'Все', label: 'Все', icon: 'apps' },
		{ value: 'open', label: 'Открыта', icon: 'folder-open-outline' },
		{ value: 'in_progress', label: 'В работе', icon: 'time-outline' },
		{ value: 'blocked', label: 'Проблема', icon: 'alert-circle-outline' },
<<<<<<< HEAD
		{ value: 'completed', label: 'Завершено', icon: 'checkmark-done-outline' }, // ← добавлено
=======
		{ value: 'completed', label: 'Завершено', icon: 'checkmark-done-outline' },
>>>>>>> d06e9d4 (Bugs fixes)
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
<<<<<<< HEAD
					// Внутри renderItem:
=======
>>>>>>> d06e9d4 (Bugs fixes)
					<TouchableOpacity
						style={[
							styles.taskCard,
							{ borderLeftColor: getBorderColorByDeadline(item.deadline, item.status) },
						]}
						onPress={() =>
							navigation.navigate('TaskDetails', { taskId: item.id })
						}
					>
						{/* Верхняя линия: заголовок и оценка справа */}
						<View style={styles.cardHeader}>
							<Text style={styles.taskTitle}>{item.title}</Text>
							{item.rating != null && (
								<View style={styles.ratingBadge}>
									<Ionicons name='star' size={16} color='#FFD700' />
									<Text style={styles.ratingText}>{item.rating}</Text>
								</View>
							)}
						</View>

						{/* Строка с иконками */}
						<View style={styles.taskInfoRow}>
							<Ionicons name='clipboard-outline' size={16} color='#555' />
							<Text style={styles.taskText}>{statusLabels[item.status]}</Text>
						</View>
						<View style={styles.taskInfoRow}>
							<Ionicons name='call-outline' size={16} color='#555' />
							<Text style={styles.taskText}>{item.employerPhone}</Text>
						</View>
						<View style={styles.taskInfoRow}>
							<Ionicons name='time-outline' size={16} color='#555' />
							<Text style={styles.taskText}>
								{item.deadline.toDate().toLocaleString()}
							</Text>
						</View>
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
	},
	cardHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	taskTitle: {
		fontSize: 16,
		fontWeight: '800',
		color: '#333',
		flex: 1,
		marginRight: 8,
	},
	ratingBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFF9E6',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
	},
	ratingText: {
		marginLeft: 4,
		fontSize: 14,
		fontWeight: '600',
		color: '#555',
	},
	taskInfoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 4,
	},
	taskText: {
		fontSize: 14,
		color: '#555',
		marginLeft: 6,
	},

	filterContainer: { flexDirection: 'row', marginBottom: 20 },
	filterButton: {
<<<<<<< HEAD
		flexDirection: 'row', // <--- добавлено
=======
		flexDirection: 'row',  
>>>>>>> d06e9d4 (Bugs fixes)
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
