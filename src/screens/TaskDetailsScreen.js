import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { doc, onSnapshot, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { TaskStatus, TaskAction } from '../../models';

export default function TaskDetailsScreen({ route }) {
  const { taskId } = route.params;
  const [task, setTask] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'tasks', taskId), (doc) => {
      setTask({ id: doc.id, ...doc.data() });
    });
    return unsubscribe;
  }, [taskId]);

  const updateStatus = async (newStatus) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status: newStatus,
        history: arrayUnion({
          action: TaskAction.STATUS_CHANGED,
          status: newStatus,
          userId: auth.currentUser.uid,
          timestamp: serverTimestamp()
        })
      });
    } catch (error) {
      Alert.alert('Ошибка', error.message);
    }
  };

  if (!task) return <View><Text>Загрузка...</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{task.title}</Text>
      <Text>{task.description}</Text>
      <Text>Статус: {task.status}</Text>
      <Text>Создатель: {task.employerPhone}</Text>
      
      {auth.currentUser.uid === task.employeeId && (
        <View>
          <Button 
            title="Возникли проблемы" 
            onPress={() => updateStatus(TaskStatus.BLOCKED)} 
          />
          <Button 
            title="Завершить задачу" 
            onPress={() => updateStatus(TaskStatus.COMPLETED)} 
          />
        </View>
      )}

      <Button 
        title="Чат" 
        onPress={() => navigation.navigate('TaskChat', { taskId })} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold' }
});