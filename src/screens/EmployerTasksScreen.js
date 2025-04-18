import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { TaskStatus, TaskAction } from '../../models';

export default function EmployerTasksScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'tasks'),
      where('employerId', '==', auth.currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setTasks(tasksData);
    });

    return unsubscribe;
  }, []);

  const getStatusText = (status) => {
    switch(status) {
      case TaskStatus.OPEN: return 'Открыта';
      case TaskStatus.IN_PROGRESS: return 'В работе';
      case TaskStatus.BLOCKED: return 'Проблемы';
      case TaskStatus.COMPLETED: return 'Завершена';
      default: return status;
    }
  };

  const renderTask = ({ item }) => (
    <TouchableOpacity 
      style={styles.taskCard}
      onPress={() => navigation.navigate('TaskDetails', { taskId: item.id })}
    >
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text>Статус: {getStatusText(item.status)}</Text>
      {item.employeeId && <Text>Исполнитель: {item.employeeId}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={item => item.id}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('CreateTask')}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  taskCard: { padding: 15, borderBottomWidth: 1 },
  taskTitle: { fontWeight: 'bold' },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: 'blue',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center'
  },
  addButtonText: { color: 'white', fontSize: 24 }
});