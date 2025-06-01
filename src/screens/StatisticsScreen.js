import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, Dimensions, StyleSheet } from 'react-native'
import { collection, getDocs } from 'firebase/firestore'
import { LineChart } from 'react-native-chart-kit'
import { db } from '../../firebaseConfig'

const PRIMARY = '#4A90E2'
const BACKGROUND = '#F5F7FA'
const CARD_BG = '#FFFFFF'
const TEXT_PRIMARY = '#333333'
const TEXT_SECONDARY = '#777777'
const ALERT = '#E94F37'
const BORDER = '#E0E0E0'

const StatisticsScreen = () => {
	const [employeeStats, setEmployeeStats] = useState({})
	const [overdueCount, setOverdueCount] = useState(0)
	const [monthlyStats, setMonthlyStats] = useState({})
	const [overduePerEmployee, setOverduePerEmployee] = useState({})
    const [lateCompletedStats, setLateCompletedStats] = useState({})


	useEffect(() => {
		fetchStatistics()
	}, [])

	const fetchStatistics = async () => {
		const snapshot = await getDocs(collection(db, 'tasks'))
		const now = new Date()

		const stats = {}
		const monthly = {}
		const overdueStats = {}
		let overdue = 0

        const lateCompletedStats = {}


		snapshot.forEach(doc => {
			const task = doc.data()

			if (task.status === 'completed' && task.employeeId) {
				const name = task.employeeName || 'Неизвестный'
				stats[name] = (stats[name] || 0) + 1

				const completedDate = task.completedAt?.toDate?.()
				const deadline = task.deadline?.toDate?.()

				if (completedDate && deadline && completedDate > deadline) {
					lateCompletedStats[name] = (lateCompletedStats[name] || 0) + 1
				}

				if (completedDate) {
					const key = `${completedDate.getFullYear()}-${completedDate.getMonth() + 1}`
					monthly[key] = (monthly[key] || 0) + 1
				}
			}



			const deadline = task.deadline?.toDate?.()
			if (deadline && task.status !== 'completed' && deadline < now) {
				overdue++
				const name = task.employeeName || 'Неизвестный'
				overdueStats[name] = (overdueStats[name] || 0) + 1
			}
		})

		setEmployeeStats(stats)
		setMonthlyStats(monthly)
		setOverdueCount(overdue)
		setOverduePerEmployee(overdueStats)
        setLateCompletedStats(lateCompletedStats)

	}

	const chartLabels = Object.keys(monthlyStats).sort()
	const chartData = chartLabels.map(label => monthlyStats[label])

	return (
		<ScrollView style={styles.container}>
			<Text style={styles.header}>Статистика</Text>
			<View style={styles.card}>
				<Text style={styles.sectionTitle}>Выполнено по сотрудникам</Text>
				<View style={styles.divider} />
				{Object.entries(employeeStats).map(([name, count]) => (
					<Text key={name} style={styles.statItem}>
						{name}: <Text style={styles.bold}>{count}</Text> задач
					</Text>
				))}
			</View>

			<View style={styles.card}>
				<Text style={styles.sectionTitle}>Выполнено с опозданием</Text>
				<View style={styles.divider} />
				{Object.entries(lateCompletedStats).length === 0 ? (
					<Text style={styles.empty}>Нет данных</Text>
				) : (
					Object.entries(lateCompletedStats).map(([name, count]) => (
						<Text key={name} style={[styles.statItem, styles.alert]}>
							{name}: <Text style={styles.bold}>{count}</Text> задач после
							дедлайна
						</Text>
					))
				)}
			</View>

			<View style={styles.card}>
				<Text style={styles.sectionTitle}>Просроченные задачи</Text>
				<View style={styles.divider} />
				<Text style={styles.statItem}>
					Всего: <Text style={[styles.bold, styles.alert]}>{overdueCount}</Text>
				</Text>
				{Object.entries(overduePerEmployee).map(([name, count]) => (
					<Text key={name} style={[styles.statItem, styles.alert]}>
						{name}: {count} просрочено
					</Text>
				))}
			</View>

			<View style={styles.card}>
				<Text style={styles.sectionTitle}>Выполнено по месяцам</Text>
				<View style={styles.divider} />
				{chartLabels.length > 0 ? (
					<LineChart
						data={{ labels: chartLabels, datasets: [{ data: chartData }] }}
						width={Dimensions.get('window').width - 64}
						height={240}
						yAxisLabel=''
						chartConfig={{
							backgroundGradientFrom: CARD_BG,
							backgroundGradientTo: CARD_BG,
							decimalPlaces: 0,
							color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
							labelColor: () => TEXT_SECONDARY,
							propsForDots: { r: '6', strokeWidth: '2', stroke: PRIMARY },
						}}
						style={styles.chart}
					/>
				) : (
					<Text style={styles.empty}>Нет данных для графика</Text>
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
        marginTop: 40
	},
	header: {
		fontSize: 28,
		fontWeight: '700',
		color: PRIMARY,
		textAlign: 'center',
		marginBottom: 24,
	},
	card: {
		backgroundColor: CARD_BG,
		borderRadius: 12,
		padding: 16,
		marginBottom: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
		borderWidth: 1,
		borderColor: BORDER,
	},
	sectionTitle: {
		fontSize: 20,
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
		marginVertical: 6,
	},
	bold: {
		fontWeight: '700',
		color: TEXT_PRIMARY,
	},
	alert: {
		color: ALERT,
	},
	empty: {
		fontSize: 16,
		color: TEXT_SECONDARY,
		marginTop: 10,
		textAlign: 'center',
	},
	chart: {
		borderRadius: 12,
		marginVertical: 8,
	},
})

export default StatisticsScreen
