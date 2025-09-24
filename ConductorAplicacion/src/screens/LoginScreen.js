import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import api from '../api/client';

export default function LoginScreen({ navigation }) {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');

  const handleLogin = async () => {
    try {
      const { data } = await api.post('/auth/login', { correo, contrasena });

      if (data.success) {
        navigation.replace('Home', { conductor: data.conductor });
      } else {
        Alert.alert('Error', 'Credenciales incorrectas');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    }
  };

  return (
    <View style={{ flex:1, justifyContent:'center', padding:20 }}>
      <Text style={{ fontSize:25, fontWeight:'650', color:'red' }}>Conductor</Text>
      <Text style={{ fontSize:22, fontWeight:'600' }}>Iniciar sesión</Text>
      <TextInput
        placeholder="Correo"
        autoCapitalize="none"
        value={correo}
        onChangeText={setCorreo}
        style={{ borderWidth:1, marginVertical:10, padding:10, borderRadius:8 }}
      />
      <TextInput
        placeholder="Contraseña"
        secureTextEntry
        value={contrasena}
        onChangeText={setContrasena}
        style={{ borderWidth:1, marginVertical:10, padding:10, borderRadius:8 }}
      />
      <Button title="Entrar" onPress={handleLogin} />
    </View>
  );
}
