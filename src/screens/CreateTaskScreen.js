import React, { useState } from "react";
import { View, TextInput, Button, Alert, ScrollView, StyleSheet } from "react-native";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth, storage } from "../../firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { TaskStatus, TaskAction, TaskStructure } from "../../models";

export default function CreateTaskScreen({ navigation }) {
  const [task, setTask] = useState({ ...TaskStructure });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const uploadImage = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = uri.substring(uri.lastIndexOf("/") + 1);
    const storageRef = ref(storage, `task-images/${filename}`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async () => {
    if (!task.title || !task.description) {
      Alert.alert("Ошибка", "Заполните название и описание");
      return;
    }

    setLoading(true);
    try {
      // Загружаем изображения если есть
      let imageUrls = [];
      for (const img of images) {
        const url = await uploadImage(img);
        imageUrls.push(url);
      }

      const taskData = {
        ...task,
        startDate: serverTimestamp(),
        deadline: serverTimestamp(), // Здесь должна быть ваша дата
        status: TaskStatus.OPEN,
        employerId: auth.currentUser.uid,
        employeeId: null,
        createdAt: serverTimestamp(),
        images: imageUrls,
        history: [
          {
            action: TaskAction.CREATED,
            userId: auth.currentUser.uid,
            timestamp: new Date().toISOString(), // Используем ISO строку
          },
        ],
        employerPhone: auth.currentUser.phoneNumber || "Нет номера",
      };

      await setDoc(doc(db, "tasks", Date.now().toString()), taskData);
      Alert.alert("Успех", "Задача создана");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Ошибка", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, marginTop: 100 }}>
      <TextInput
        style={styles.input}
        placeholder="Название задачи"
        value={task.title}
        onChangeText={(text) => setTask({ ...task, title: text })}
      />
      <TextInput
        placeholder="Описание"
        multiline
        value={task.description}
        onChangeText={(text) => setTask({ ...task, description: text })}
      />
      <Button title="Добавить фото" onPress={pickImage} />
      <Button
        title="Создать задачу"
        onPress={handleSubmit}
        disabled={loading}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({

});