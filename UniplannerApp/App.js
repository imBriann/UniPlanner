/**
 * App.js - Navegación Completa con Todas las Pantallas
 */

import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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

// Nuevas Screens
import NotificacionesScreen from './src/screens/NotificacionesScreen';
import EstadisticasScreen from './src/screens/EstadisticasScreen';
import LogrosScreen from './src/screens/LogrosScreen';
import PlanEstudioScreen from './src/screens/PlanEstudioScreen';
import ConfiguracionScreen from './src/screens/ConfiguracionScreen';
import { colors, fonts } from './src/theme/tokens';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.nav,
    text: colors.ink,
    border: colors.border,
    notification: colors.accent,
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: { fontFamily: fonts.regular, fontWeight: '400' },
    medium: { fontFamily: fonts.medium, fontWeight: '500' },
    bold: { fontFamily: fonts.semibold, fontWeight: '600' },
    heavy: { fontFamily: fonts.bold, fontWeight: '700' },
  },
};

/**
 * Navegador de Tabs Principal
 */
function MainTabs() {
  return (
    <Tab.Navigator
      detachInactiveScreens={false}
      lazy={false}
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
            case 'Perfil':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkSubtle,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 70,
          paddingBottom: 12,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: fonts.medium,
        },
        headerStyle: {
          backgroundColor: colors.nav,
        },
        headerTintColor: colors.ink,
        headerTitleStyle: {
          fontFamily: fonts.semibold,
        },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen 
        name="Inicio" 
        component={HomeScreen}
        options={{
          headerShown: false,
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
 * Navegador principal
 */
function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: colors.background 
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
        {user ? (
          // Usuario autenticado - Stack con tabs principales y pantallas adicionales
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            
            {/* Pantallas adicionales (modales/stack) */}
            <Stack.Screen 
              name="Notificaciones" 
              component={NotificacionesScreen}
              options={{
                headerShown: true,
                title: 'Notificaciones',
                headerStyle: { backgroundColor: colors.nav },
                headerTintColor: colors.ink,
                headerTitleStyle: { fontFamily: fonts.semibold },
                headerShadowVisible: false,
                presentation: 'modal',
              }}
            />
            
            <Stack.Screen 
              name="Estadisticas" 
              component={EstadisticasScreen}
              options={{
                headerShown: true,
                title: 'Estadísticas',
                headerStyle: { backgroundColor: colors.nav },
                headerTintColor: colors.ink,
                headerTitleStyle: { fontFamily: fonts.semibold },
                headerShadowVisible: false,
              }}
            />
            
            <Stack.Screen 
              name="Logros" 
              component={LogrosScreen}
              options={{
                headerShown: true,
                title: 'Logros y Nivel',
                headerStyle: { backgroundColor: colors.nav },
                headerTintColor: colors.ink,
                headerTitleStyle: { fontFamily: fonts.semibold },
                headerShadowVisible: false,
              }}
            />
            
            <Stack.Screen 
              name="PlanEstudio" 
              component={PlanEstudioScreen}
              options={{
                headerShown: true,
                title: 'Plan de Estudio',
                headerStyle: { backgroundColor: colors.nav },
                headerTintColor: colors.ink,
                headerTitleStyle: { fontFamily: fonts.semibold },
                headerShadowVisible: false,
              }}
            />
            
            <Stack.Screen 
              name="Semaforo" 
              component={SemaforoScreen}
              options={{
                headerShown: true,
                title: 'Semáforo Estudiante',
                headerStyle: { backgroundColor: colors.nav },
                headerTintColor: colors.ink,
                headerTitleStyle: { fontFamily: fonts.semibold },
                headerShadowVisible: false,
              }}
            />

            <Stack.Screen 
              name="Configuracion" 
              component={ConfiguracionScreen}
              options={{
                headerShown: true,
                title: 'Configuracion',
                headerStyle: { backgroundColor: colors.nav },
                headerTintColor: colors.ink,
                headerTitleStyle: { fontFamily: fonts.semibold },
                headerShadowVisible: false,
              }}
            />
          </>
        ) : (
          // Usuario no autenticado
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen 
              name="RegistroScreen"
              component={RegistroScreen} 
              options={{
                headerShown: true,
                title: 'Crear Cuenta',
                headerStyle: { backgroundColor: colors.nav },
                headerTintColor: colors.ink,
                headerTitleStyle: { fontFamily: fonts.semibold },
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen 
              name="SeleccionMaterias"
              component={SeleccionMateriasScreen} 
              options={{
                headerShown: true,
                title: 'Seleccionar Materias',
                headerStyle: { backgroundColor: colors.nav },
                headerTintColor: colors.ink,
                headerTitleStyle: { fontFamily: fonts.semibold },
                headerShadowVisible: false,
                headerLeft: () => null,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/**
 * Componente raíz
 */
export default function App() {
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
