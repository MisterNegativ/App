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
	const [selectedPriority, setSelectedPriority] = useState(null)
	const [selectedStatus, setSelectedStatus] = useState('Все')

	const statusLabels = {
		open: 'Открыта',
		in_progress: 'В работе',
		blocked: 'Проблема',
		completed: 'Завершено', 
	}

	const priorityLabels = {
		low: 'Низкий',
		medium: 'Средний',
		high: 'Высокий',
	}

	const priorities = [
		{ label: 'Все', value: null },
		{ label: 'Высокий', value: 'high' },
		{ label: 'Средний', value: 'medium' },
		{ label: 'Низкий', value: 'low' },
	]

	const getPriorityColor = priority => {
		switch (priority) {
			case 'high':
				return '#d32f2f' // красный
			case 'medium':
				return '#f57c00' // оранжевый
			case 'low':
			default:
				return '#388e3c' // зелёный
		}
	}

	const getBorderColorByDeadline = (deadline, status) => {
		if (status === TaskStatus.COMPLETED) {
			return '#388E3C' 
		}

		if (!deadline) return '#007AFF' 

		const now = new Date()
		const diffMs = deadline.toDate() - now
		const diffHours = diffMs / (1000 * 60 * 60)

		if (diffHours <= 1) {
			return '#D32F2F' 
		} else if (diffHours <= 24) {
			return '#FF8F00'
		} else {
			return '#007AFF' 
		}
	}

	const statuses = [
		{ value: 'Все', label: 'Все', icon: 'apps' },
		{ value: 'open', label: 'Открыта', icon: 'folder-open-outline' },
		{ value: 'in_progress', label: 'В работе', icon: 'time-outline' },
		{ value: 'blocked', label: 'Проблема', icon: 'alert-circle-outline' },
		{ value: 'completed', label: 'Завершено', icon: 'checkmark-done-outline' },
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
		})

		return unsubscribe
	}, [])

	const filteredTasks = tasks.filter(task => {
		const statusMatch =
			selectedStatus === 'Все' || task.status === selectedStatus
		const priorityMatch =
			!selectedPriority || task.priority === selectedPriority
		return statusMatch && priorityMatch
	})

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

						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							style={styles.filterContainer}
						>
							{priorities.map(priority => (
								<TouchableOpacity
									key={priority.value}
									style={[
										styles.filterButton,
										selectedPriority === priority.value && styles.activeFilterButton,
									]}
									onPress={() =>
										setSelectedPriority(
											selectedPriority === priority.value ? null : priority.value
										)
									}
								>
									<Text
										style={[
											styles.filterButtonText,
											selectedPriority === priority.value &&
												styles.activeFilterButtonText,
										]}
									>
										{priority.label}
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
							<Ionicons name='person-outline' size={16} color='#555' />
							<Text style={styles.taskText}>{item.employerName}</Text>
						</View>
						<View style={styles.taskInfoRow}>
							<Ionicons name='time-outline' size={16} color='#555' />
							<Text style={styles.taskText}>
								{item.deadline.toDate().toLocaleString()}
							</Text>
						</View>
						<View style={styles.taskInfoRow}>
							<Ionicons
								name='flame-outline'
								size={16}
								color={getPriorityColor(item.priority)}
							/>
							<Text
								style={[
									styles.taskText,
									{
									color: getPriorityColor(item.priority),
									fontWeight: '600',
									},
									]}
							>
								Приоритет: {priorityLabels[item.priority]}
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
		flexDirection: 'row',  
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
