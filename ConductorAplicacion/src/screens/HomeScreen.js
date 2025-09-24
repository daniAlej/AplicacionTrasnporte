import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';

export default function HomeScreen({ route }) {
  const [rutaActiva, setRutaActiva] = useState(false);
  const { conductor } = route.params;

  const iniciarRuta = () => {
    setRutaActiva(true);
    Alert.alert('Ruta iniciada', 'Se empezará a compartir ubicación (simulado)');
  };

  const detenerRuta = () => {
    setRutaActiva(false);
    Alert.alert('Ruta detenida', 'Se dejó de compartir ubicación');
  };

  return (
    <View style={{ flex:1, justifyContent:'center', padding:20 }}>
      <Text style={{ fontSize:18, marginBottom:20 }}>
        Bienvenido {conductor?.nombre || 'Conductor'}
      </Text>
      {!rutaActiva ? (
        <Button title="Iniciar ruta" onPress={iniciarRuta} />
      ) : (
        <Button title="Detener ruta" onPress={detenerRuta} />
      )}
    </View>
  );
}
