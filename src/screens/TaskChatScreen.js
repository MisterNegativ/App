import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Animated,
  Dimensions
} from 'react-native';
import { db, auth, storage } from '../../firebaseConfig';
import { 
  collection, 
  doc, 
  setDoc, 
  serverTimestamp, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const { height } = Dimensions.get('window');

export default function TaskChatScreen({ route }) {
  const { taskId } = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef();
  const textInputRef = useRef();
  const translateY = useRef(new Animated.Value(0)).current;

  const chatId = `task_${taskId}`;

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      Animated.timing(translateY, {
        toValue: -e.endCoordinates.height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setKeyboardHeight(0);
      });
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        formattedTime: doc.data().timestamp?.toDate()?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }));
      setMessages(msgs);
      scrollToBottom();
    });

    return unsubscribe;
  }, [taskId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Необходимо разрешение для доступа к галерее');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      textInputRef.current.focus();
    }
  };

  const uploadImage = async () => {
    if (!image) return null;

    setUploading(true);
    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const filename = image.substring(image.lastIndexOf('/') + 1);
      const storageRef = ref(storage, `chat-images/${chatId}/${filename}`);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Ошибка загрузки изображения:", error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    if (!text.trim() && !image) return;

    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      let imageUrl = null;

      if (image) {
        imageUrl = await uploadImage();
        if (!imageUrl) return;
      }

      await setDoc(doc(messagesRef), {
        text: text.trim(),
        senderId: auth.currentUser.uid,
        timestamp: serverTimestamp(),
        taskId,
        ...(imageUrl && { imageUrl })
      });

      setText('');
      setImage(null);
      Keyboard.dismiss();
    } catch (error) {
      console.error("Ошибка отправки сообщения:", error);
    }
  };

  const renderMessage = ({ item }) => {
    const isCurrentUser = item.senderId === auth.currentUser.uid;
    
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        {item.imageUrl && (
          <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.messageImage}
            resizeMode="contain"
          />
        )}
        {item.text && <Text style={styles.messageText}>{item.text}</Text>}
        <Text style={styles.timeText}>{item.formattedTime}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
        contentContainerStyle={[
          styles.messagesList,
          { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 70 : 70 }
        ]}
        keyboardDismissMode="interactive"
      />
      
      <Animated.View 
        style={[
          styles.inputContainer,
          { transform: [{ translateY }] }
        ]}
      >
        <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
          <Text style={styles.attachButtonText}>📎</Text>
        </TouchableOpacity>
        
        <TextInput
          ref={textInputRef}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Введите сообщение..."
          multiline
          blurOnSubmit={false}
          onSubmitEditing={sendMessage}
        />
        
        <TouchableOpacity 
          style={styles.sendButton} 
          onPress={sendMessage}
          disabled={uploading || (!text.trim() && !image)}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>➤</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesList: {
    padding: 10,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#dcf8c6',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  messageText: {
    fontSize: 16,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 5,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#fff',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 10,
    maxHeight: 100,
    backgroundColor: '#fff',
  },
  attachButton: {
    padding: 10,
  },
  attachButtonText: {
    fontSize: 20,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 1,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
  },
});