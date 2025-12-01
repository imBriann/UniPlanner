/**
 * App.js - Punto de entrada de la aplicación
 * Sistema completo de gestión académica UniPlanner
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Context
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegistroScreen from './src/screens/RegistroScreen';
import HomeScreen from './src/screens/HomeScreen';
import TareasScreen from './src/screens/TareasScreen';
import CalendarioScreen from './src/screens/CalendarioScreen';
import MateriasScreen from './src/screens/MateriasScreen';
import PerfilScreen from './src/screens/PerfilScreen';
import SemaforoScreen from './src/screens/SemaforoScreen';
import SeleccionMateriasScreen from './src/screens/SeleccionMateriasScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Navegador de Tabs (cuando el usuario está autenticado)
 */
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Inicio':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Tareas':
              iconName = focused ? 'checkbox' : 'checkbox-outline';
              break;
            case 'Calendario':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Materias':
              iconName = focused ? 'book' : 'book-outline';
              break;
            case 'Semaforo':
              iconName = focused ? 'pulse' : 'pulse-outline';
              break;
            case 'Perfil':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#4F46E5',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Inicio" 
        component={HomeScreen}
        options={{
          title: 'Inicio',
        }}
      />
      <Tab.Screen 
        name="Tareas" 
        component={TareasScreen}
        options={{
          title: 'Mis Tareas',
        }}
      />
      <Tab.Screen 
        name="Calendario" 
        component={CalendarioScreen}
        options={{
          title: 'Calendario',
        }}
      />
      <Tab.Screen 
        name="Materias" 
        component={MateriasScreen}
        options={{
          title: 'Mis Materias',
        }}
      />
      <Tab.Screen 
        name="Semaforo" 
        component={SemaforoScreen}
        options={{
          title: 'Semáforo',
        }}
      />
      <Tab.Screen 
        name="Perfil" 
        component={PerfilScreen}
        options={{
          title: 'Mi Perfil',
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Navegador principal que decide qué mostrar
 */
function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#F9FAFB' 
      }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // Usuario autenticado - mostrar tabs principales
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          // Usuario no autenticado - mostrar login/registro
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen 
              name="RegistroScreen"
              component={RegistroScreen} 
              options={{
                headerShown: true,
                title: 'Crear Cuenta',
                headerStyle: {
                  backgroundColor: '#4F46E5',
                },
                headerTintColor: 'white',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
            <Stack.Screen 
              name="SeleccionMaterias"
              component={SeleccionMateriasScreen} 
              options={{
                headerShown: true,
                title: 'Seleccionar Materias',
                headerStyle: {
                  backgroundColor: '#4F46E5',
                },
                headerTintColor: 'white',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
                headerLeft: () => null, // Evitar que vuelvan atrás
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/**
 * Componente raíz de la aplicación
 */
export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}