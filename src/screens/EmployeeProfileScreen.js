import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import Icon from 'react-native-vector-icons/FontAwesome'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { auth, db } from '../../firebaseConfig'

const PRIMARY = '#4A90E2'
const BACKGROUND = '#F5F7FA'
const CARD_BG = '#FFFFFF'
const TEXT_PRIMARY = '#333333'
const TEXT_SECONDARY = '#777777'
const BORDER = '#E0E0E0'

const EmployeeProfileScreen = () => {
	const user = auth.currentUser?.uid
	const [userData, setUserData] = useState(null)
	const [completedCount, setCompletedCount] = useState(0)
	const [latestTasks, setLatestTasks] = useState([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchData = async () => {
			console.log('Загрузка данных...')
			await fetchUserData()
			await fetchTaskStats()
			setLoading(false)
			console.log('Загрузка завершена')
		}
		fetchData()
	}, [])

	const fetchUserData = async () => {
		try {
			console.log('Запрос данных пользователя...')
			const usersSnapshot = await getDocs(
				query(collection(db, 'users'), where('uid', '==', user))
			)
			if (usersSnapshot.empty) {
				console.log('Пользователь не найден')
				return
			}
			usersSnapshot.forEach(doc => setUserData(doc.data()))
			console.log('Данные пользователя получены')
		} catch (error) {
			console.error('Ошибка при получении данных пользователя:', error)
		}
	}

	const fetchTaskStats = async () => {
		try {
			console.log('Запрос статистики задач...')
			const taskSnapshot = await getDocs(
				query(collection(db, 'tasks'), where('employeeId', '==', user))
			)

			const tasks = []
			let completed = 0

			taskSnapshot.forEach(doc => {
				const task = doc.data()
				tasks.push(task)
				if (task.status === 'completed') {
					completed++
				}
			})

			tasks.sort((a, b) => {
				const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt)
				const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt)
				return dateB - dateA
			})

			setCompletedCount(completed)
			setLatestTasks(tasks.slice(0, 5))
			console.log('Задачи получены')
		} catch (error) {
			console.error('Ошибка при получении задач:', error)
		}
	}

	if (loading) {
		return <Text style={styles.loading}>Загрузка...</Text>
	}

	if (!userData) {
		return <Text style={styles.loading}>Пользователь не найден</Text>
	}

	return (
		<ScrollView style={styles.container}>
			<View style={styles.avatarContainer}>
				<Icon name='user-circle' size={100} color='#ccc' />
			</View>
			<Text style={styles.name}>
				{userData.firstName} {userData.lastName}
			</Text>
			<Text style={styles.info}>Email: {userData.email}</Text>
			<Text style={styles.info}>Телефон: {userData.phone}</Text>
			<Text style={styles.info}>Тип: {userData.userType}</Text>

			<View style={styles.card}>
				<Text style={styles.sectionTitle}>Статистика</Text>
				<View style={styles.divider} />
				<Text style={styles.statItem}>Выполнено задач: {completedCount}</Text>
				<Text style={styles.statItem}>
					Опыт: ⭐ {Math.floor(completedCount / 5)}
				</Text>
			</View>

			<View style={styles.card}>
				<Text style={styles.sectionTitle}>Последние задачи</Text>
				<View style={styles.divider} />
				{latestTasks.length === 0 ? (
					<Text style={styles.empty}>Нет задач</Text>
				) : (
					latestTasks.map((task, index) => (
						<Text key={index} style={styles.statItem}>
							{task.title || 'Без названия'} - {task.status}
						</Text>
					))
				)}
			</View>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: BACKGROUND,
		padding: 16,
	},
	avatarContainer: {
		alignItems: 'center',
		marginTop: 24,
	},
	name: {
		fontSize: 24,
		fontWeight: '600',
		color: TEXT_PRIMARY,
		textAlign: 'center',
		marginTop: 12,
	},
	info: {
		fontSize: 16,
		color: TEXT_SECONDARY,
		textAlign: 'center',
		marginTop: 4,
	},
	card: {
		backgroundColor: CARD_BG,
		borderRadius: 12,
		padding: 16,
		marginTop: 24,
		borderWidth: 1,
		borderColor: BORDER,
		elevation: 2,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: TEXT_PRIMARY,
	},
	divider: {
		height: 1,
		backgroundColor: BORDER,
		marginVertical: 12,
	},
	statItem: {
		fontSize: 16,
		color: TEXT_PRIMARY,
		marginVertical: 4,
	},
	empty: {
		fontSize: 16,
		color: TEXT_SECONDARY,
		textAlign: 'center',
		marginTop: 8,
	},
	loading: {
		marginTop: 50,
		textAlign: 'center',
		color: TEXT_SECONDARY,
		fontSize: 18,
	},
})

export default EmployeeProfileScreen
