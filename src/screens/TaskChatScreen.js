import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator,
  Keyboard,
  Animated,
  Dimensions,
  Image,
  Alert
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
  const translateY = useRef(new Animated.Value(0)).current;

  const chatId = `task_${taskId}`;

  // Запрашиваем разрешения при монтировании компонента
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Для отправки фото нужны разрешения');
      }
    })();

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

  // Подписываемся на сообщения чата
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

  // Выбор фото из галереи или камеры
  const pickImage = async (source) => {
    let result;
    
    if (source === 'camera') {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
    }

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Загрузка фото в Storage
  const uploadImage = async () => {
    if (!image) return null;

    setUploading(true);
    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const filename = `chat_${Date.now()}.jpg`;
      const storageRef = ref(storage, `task-chats/${chatId}/${filename}`);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Ошибка загрузки фото:", error);
      Alert.alert('Ошибка', 'Не удалось загрузить фото');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Отправка сообщения
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
        ...(imageUrl && { imageUrl }),
        isSystem: false
      });

      setText('');
      setImage(null);
      Keyboard.dismiss();
    } catch (error) {
      console.error("Ошибка отправки:", error);
      Alert.alert('Ошибка', 'Не удалось отправить сообщение');
    }
  };

  // Рендер сообщения
  const renderMessage = ({ item }) => {
    const isCurrentUser = item.senderId === auth.currentUser.uid;
    
    if (item.isSystem) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      );
    }

    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        {item.imageUrl && (
          <TouchableOpacity onPress={() => navigation.navigate('ImageFullScreen', { uri: item.imageUrl })}>
            <Image 
              source={{ uri: item.imageUrl }} 
              style={styles.messageImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
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
          { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 100 : 100 }
        ]}
        keyboardDismissMode="interactive"
      />
      
      {/* Меню выбора источника фото */}
      {image && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: image }} style={styles.previewImage} />
          <TouchableOpacity 
            style={styles.removeImageButton} 
            onPress={() => setImage(null)}
          >
            <Text style={styles.removeImageText}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      <Animated.View 
        style={[
          styles.inputContainer,
          { transform: [{ translateY }] }
        ]}
      >
        <View style={styles.mediaButtons}>
          <TouchableOpacity 
            style={styles.mediaButton} 
            onPress={() => pickImage('library')}
          >
            <Text style={styles.mediaButtonText}>📁</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.mediaButton} 
            onPress={() => pickImage('camera')}
          >
            <Text style={styles.mediaButtonText}>📷</Text>
          </TouchableOpacity>
        </View>
        
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Введите сообщение..."
          multiline
          blurOnSubmit={false}
          onSubmitEditing={sendMessage}
        />
        
        <TouchableOpacity 
          style={[
            styles.sendButton,
            (!text.trim() && !image) && styles.sendButtonDisabled
          ]} 
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
  systemMessageContainer: {
    alignSelf: 'center',
    backgroundColor: '#f0f0f0',
    padding: 5,
    borderRadius: 5,
    marginVertical: 5,
  },
  systemMessageText: {
    color: '#666',
    fontSize: 12,
  },
  messageText: {
    fontSize: 16,
  },
  messageImage: {
    width: 250,
    height: 250,
    borderRadius: 10,
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
  mediaButtons: {
    flexDirection: 'row',
  },
  mediaButton: {
    padding: 8,
  },
  mediaButtonText: {
    fontSize: 20,
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
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  imagePreviewContainer: {
    position: 'absolute',
    bottom: 60,
    left: 10,
    zIndex: 10,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#ff4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 22,
  },
});