import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import HomeScreen from '../screens/HomeScreen'
import EmployerDashboard from '../screens/EmployerDashboard'
import EmployeeDashboard from '../screens/EmployeeDashboard'
import CreateTaskScreen from '../screens/CreateTaskScreen'
import TaskDetailsScreen from '../screens/TaskDetailsScreen'
import ProfileScreen from '../screens/ProfileScreen' 
import TaskChatScreen from '../screens/TaskChatScreen'
import { colors, navStyles, typography } from '../styles';
import StatisticsScreen from '../screens/StatisticsScreen'
import EmployeeProfileScreen from '../screens/EmployeeProfileScreen'
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen'



const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function EmployerTabs() {
	return (
		<Tab.Navigator
			screenOptions={({ route }) => ({
				tabBarIcon: ({ focused, color, size }) => {
					let iconName

					if (route.name === 'Dashboard') {
						iconName = focused ? 'home' : 'home-outline'
					} else if (route.name === 'Tasks') {
						iconName = focused ? 'list' : 'list-outline'
					} else if (route.name === 'Profile') {
						iconName = focused ? 'person' : 'person-outline'
					} else if (route.name === 'Statistics') {
						iconName = focused ? 'bar-chart' : 'bar-chart-outline'
					}

					return <Ionicons name={iconName} size={size} color={color} />
				},
				tabBarActiveTintColor: 'tomato',
				tabBarInactiveTintColor: 'gray',
				headerShown: false,
			})}
		>
			<Tab.Screen name='Dashboard' component={EmployerDashboard} />
			<Tab.Screen name='Tasks' component={CreateTaskScreen} />
			<Tab.Screen name='Statistics' component={StatisticsScreen} />
			<Tab.Screen name='Profile' component={ProfileScreen} />
		</Tab.Navigator>
	)
}


function EmployeeTabs() {
	return (
		<Tab.Navigator
			screenOptions={({ route }) => ({
				tabBarIcon: ({ focused, color, size }) => {
					let iconName

					if (route.name === 'Dashboard') {
						iconName = focused ? 'home' : 'home-outline'
					} else if (route.name === 'Profile') {
						iconName = focused ? 'person' : 'person-outline'
					}

					return <Ionicons name={iconName} size={size} color={color} />
				},
				tabBarActiveTintColor: 'tomato',
				tabBarInactiveTintColor: 'gray',
				headerShown: false,
			})}
		>
			<Tab.Screen name='Dashboard' component={EmployeeDashboard} />
			<Tab.Screen name='Profile' component={ProfileScreen} />
		</Tab.Navigator>
	)
}

export default function AppNavigation() {
	return (
		<NavigationContainer>
			<Stack.Navigator
				initialRouteName='Home'
				screenOptions={{
					headerShown: false,
					headerStyle: navStyles.header,
					headerTitleStyle: navStyles.headerTitle,
					headerTintColor: colors.primary,
					headerBackTitleVisible: false,
					contentStyle: { backgroundColor: colors.white },
				}}
			>
				<Stack.Screen name='Home' component={HomeScreen} />
				<Stack.Screen name='Login' component={LoginScreen} />
				<Stack.Screen name='ChangePassword' component={ChangePasswordScreen} />
				<Stack.Screen name='Register' component={RegisterScreen} />
				<Stack.Screen name='EmployerDashboard' component={EmployerTabs} />
				<Stack.Screen name='EmployeeDashboard' component={EmployeeTabs} />
				<Stack.Screen name='CreateTask' component={CreateTaskScreen} />
				<Stack.Screen name='TaskDetails' component={TaskDetailsScreen} />
				{/* <Stack.Screen name="Chat" component={ChatScreen} options={({ route }) => ({ title: route.params.recipientName || 'Чат',headerShown: true })}/> */}
				<Stack.Screen
					name='TaskChat'
					component={TaskChatScreen}
					options={({ route }) => ({
						title: `Чат по задаче #${route.params.taskId.substring(0, 6)}`,
						headerShown: true,
					})}
				/>
			</Stack.Navigator>
		</NavigationContainer>
	)
}
