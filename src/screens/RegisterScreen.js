import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView
} from "react-native";
import { RadioButton } from "react-native-paper";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

export default function RegisterScreen({ navigation }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("employee");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
		if (!firstName || !lastName || !phone || !email || !password) {
			Alert.alert('Ошибка', 'Пожалуйста, заполните все поля')
			return
		}

		if (!/^\+?\d{10,15}$/.test(phone)) {
			Alert.alert('Ошибка', 'Введите корректный номер телефона')
			return
		}

		if (!/^\S+@\S+\.\S+$/.test(email)) {
			Alert.alert('Ошибка', 'Введите корректный email')
			return
		}

		if (password.length < 6) {
			Alert.alert('Ошибка', 'Пароль должен содержать минимум 6 символов')
			return
		}

		setLoading(true)
		try {
			const userCredential = await createUserWithEmailAndPassword(
				auth,
				email,
				password
			)

			await updateProfile(userCredential.user, {
				displayName: `${firstName} ${lastName}`,
			})

			await setDoc(doc(db, 'users', userCredential.user.uid), {
				firstName,
				lastName,
				phone,
				email,
				userType, 
				createdAt: new Date().toISOString(),
			})

			navigation.replace(
				userType === 'employer' ? 'EmployerDashboard' : 'EmployeeDashboard'
			)
		} catch (error) {
			let errorMessage = 'Ошибка регистрации'
			switch (error.code) {
				case 'auth/email-already-in-use':
					errorMessage = 'Этот email уже используется'
					break
				case 'auth/invalid-email':
					errorMessage = 'Некорректный email'
					break
				case 'auth/weak-password':
					errorMessage = 'Пароль слишком слабый'
					break
				default:
					errorMessage = error.message
			}
			Alert.alert('Ошибка', errorMessage)
		} finally {
			setLoading(false)
		}
	};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Регистрация</Text>

      <View style={styles.radioGroup}>
        <Text style={styles.radioTitle}>Выберите тип аккаунта:</Text>
        <View style={styles.radioOption}>
          <RadioButton
            value="employee"
            status={userType === "employee" ? "checked" : "unchecked"}
            onPress={() => setUserType("employee")}
          />
          <Text style={styles.radioLabel}>Сотрудник</Text>
        </View>
        <View style={styles.radioOption}>
          <RadioButton
            value="employer"
            status={userType === "employer" ? "checked" : "unchecked"}
            onPress={() => setUserType("employer")}
          />
          <Text style={styles.radioLabel}>Работодатель</Text>
        </View>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Имя"
        value={firstName}
        onChangeText={setFirstName}
      />

      <TextInput
        style={styles.input}
        placeholder="Фамилия"
        value={lastName}
        onChangeText={setLastName}
      />

      <TextInput
        style={styles.input}
        placeholder="Телефон"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Пароль"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Загрузка..." : "Зарегистрироваться"}
        </Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="small" color="#0000ff" style={styles.loader} />}

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.linkText}>Уже есть аккаунт? Войдите</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  radioGroup: {
    marginBottom: 20,
  },
  radioTitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  radioLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  input: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  button: {
    height: 50,
    borderRadius: 5,
    backgroundColor: "#28a745",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  linkText: {
    color: "#007bff",
    textAlign: "center",
    marginTop: 10,
  },
  loader: {
    marginVertical: 10,
  }
});