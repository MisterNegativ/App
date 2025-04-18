import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native'; // Добавляем этот импорт

export default function HomeScreen() {
    const [userData, setUserData] = useState(null);
    const navigation = useNavigation(); // Получаем объект навигации
  
    useEffect(() => {
      const fetchUserData = async () => {
        if (auth.currentUser) {
          const docRef = doc(db, 'users', auth.currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        }
      };
  
      fetchUserData();
    }, []);

    const userTypeLabel = userData?.userType === 'employer' ? 'Работодатель' : 'Сотрудник';

    const handleLogout = async () => {
      try {
        await signOut(auth);
        // Перенаправляем на экран входа после выхода
        navigation.navigate('Login');
      } catch (error) {
        console.error("Ошибка выхода:", error);
        Alert.alert("Ошибка", "Не удалось выйти из системы");
      }
    };

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Добро пожаловать!</Text>
        <Text style={styles.userInfo}>
          {auth.currentUser?.displayName || "Пользователь"}
        </Text>
        <Text style={styles.userType}>Тип аккаунта: {userTypeLabel}</Text>
        <Button title="Выйти" onPress={handleLogout} />
      </View>
    );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  userInfo: {
    fontSize: 18,
    marginBottom: 10,
  },
  userType: {
    fontSize: 16,
    marginBottom: 20,
    color: "#555",
  },
});
