import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export default function HomeScreen({ navigation }) {
  useEffect(() => {
    const checkUserAndRedirect = async () => {
      try {
        const user = auth.currentUser;
        
        if (!user) {
          navigation.replace('Login');
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          navigation.replace(
            userData.userType === 'employer' 
              ? 'EmployerDashboard' 
              : 'EmployeeDashboard'
          );
        } else {
          navigation.replace('Login');
        }
      } catch (error) {
        console.error("Error checking user:", error);
        navigation.replace('Login');
      }
    };

    checkUserAndRedirect();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}