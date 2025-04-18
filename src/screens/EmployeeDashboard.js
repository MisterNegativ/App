import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

export default function EmployeeDashboard({ navigation }) {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'tasks'),
      where('status', 'in', ['open', 'in_progress', 'blocked'])
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(tasksData);
    });

    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Панель сотрудника</Text>
      
      <FlatList
        data={tasks}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.taskCard}
            onPress={() => navigation.navigate('TaskDetails', { taskId: item.id })}
          >
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text>Статус: {item.status}</Text>
            <Text>От: {item.employerPhone}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, marginTop:50 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  taskCard: { padding: 15, marginBottom: 10, backgroundColor: '#f9f9f9', borderRadius: 5 },
  taskTitle: { fontWeight: 'bold' }
});