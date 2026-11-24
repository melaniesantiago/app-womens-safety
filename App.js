import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SplashAnimationScreen from './src/screens/SplashAnimationScreen';
import SecurityLinkScreen from './src/screens/SecurityLinkScreen';
import HomeScreen from './src/screens/HomeScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MyDeviceScreen from './src/screens/MyDeviceScreen';
import TelemetryScreen from './src/screens/TelemetryScreen';
import AlertDetailScreen from './src/screens/AlertDetailScreen';
import AccompaniScreen from './src/screens/AccompaniScreen';
import ActiveAlertScreen from './src/screens/ActiveAlertScreen';
import ResourcesScreen from './src/screens/ResourcesScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ user, setUser, onLogout, contacts, setContacts }) {
  return (
    <Tab.Navigator
      initialRouteName="InicioTab"
      tabBar={() => null}
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    >
      <Tab.Screen name="InicioTab">
        {(props) => (
          <HomeScreen
            {...props}
            user={user}
            setUser={setUser}
            onLogout={onLogout}
            contacts={contacts}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="ContactosTab">
        {(props) => (
          <ContactsScreen
            {...props}
            contacts={contacts}
            setContacts={setContacts}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="AccompaniTab">
        {(props) => (
          <AccompaniScreen
            {...props}
            contacts={contacts}
            user={user}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="HistorialTab" component={ResourcesScreen} />
      <Tab.Screen name="RecursosTab" component={ResourcesScreen} />
      <Tab.Screen name="MapaDeApoyo" component={ResourcesScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [screenState, setScreenState] = useState('login');

  const [user, setUser] = useState({
    name: '',
    email: '',
    avatarIcon: 'person',
    pin: '1234',
  });

  // Red de confianza vacía por defecto (persiste al cambiar entre pestañas)
  const [contacts, setContacts] = useState([]);

  const handleRegisterSuccess = (registeredData) => {
    if (registeredData) {
      setUser({
        name: registeredData.name || 'Usuaria',
        email: registeredData.email || '',
        avatarIcon: 'person',
        pin: registeredData.pin || '1234',
      });
      setContacts([]);
    }
    setScreenState('login');
  };

  const handleLogin = (loginData) => {
    setUser((prev) => {
      const email = loginData?.email || prev.email || 'usuaria@correo.com';
      let name = loginData?.name || prev.name;

      if (!name) {
        const emailUser = email.split('@')[0];
        name = emailUser.charAt(0).toUpperCase() + emailUser.slice(1);
      }

      return {
        name: name,
        email: email,
        avatarIcon: prev.avatarIcon || 'person',
        pin: loginData?.pin || prev.pin || '1234',
      };
    });
    setIsLinking(true);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsLinking(false);
    setScreenState('login');
  };

  // 1. Pantalla animada inicial
  if (showSplash) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SplashAnimationScreen onFinish={() => setShowSplash(false)} />
      </SafeAreaProvider>
    );
  }

  // 2. Flujo de Login y Registro
  if (!isLoggedIn) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        {screenState === 'login' ? (
          <LoginScreen
            onLogin={handleLogin}
            onNavigateToRegister={() => setScreenState('register')}
          />
        ) : (
          <RegisterScreen
            onRegisterSuccess={handleRegisterSuccess}
            onNavigateToLogin={() => setScreenState('login')}
          />
        )}
      </SafeAreaProvider>
    );
  }

  // 3. Pantalla puente de sincronización animada tras iniciar sesión
  if (isLinking) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SecurityLinkScreen
          user={user}
          onComplete={() => setIsLinking(false)}
        />
      </SafeAreaProvider>
    );
  }

  // 4. Aplicación principal con todas tus rutas
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="MainTabs"
          screenOptions={{ headerShown: false, animation: 'fade' }}
        >
          <Stack.Screen name="MainTabs">
            {(props) => (
              <MainTabs
                {...props}
                user={user}
                setUser={setUser}
                onLogout={handleLogout}
                contacts={contacts}
                setContacts={setContacts}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="MyDevice" component={MyDeviceScreen} />
          <Stack.Screen name="Bracelet" component={MyDeviceScreen} />

          <Stack.Screen name="Telemetry" component={TelemetryScreen} />
          <Stack.Screen name="Sensors" component={TelemetryScreen} />
          <Stack.Screen name="Sensores" component={TelemetryScreen} />

          <Stack.Screen name="AlertDetail" component={AlertDetailScreen} />
          <Stack.Screen name="UltimaAlerta" component={AlertDetailScreen} />
          <Stack.Screen name="LastAlert" component={AlertDetailScreen} />

          <Stack.Screen name="Contacts">
            {(props) => (
              <ContactsScreen
                {...props}
                contacts={contacts}
                setContacts={setContacts}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Accompani">
            {(props) => (
              <AccompaniScreen
                {...props}
                contacts={contacts}
                user={user}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Escort">
            {(props) => (
              <AccompaniScreen
                {...props}
                contacts={contacts}
                user={user}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="ActiveAlert">
            {(props) => (
              <ActiveAlertScreen
                {...props}
                user={user}
                contacts={contacts}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="AlertActive">
            {(props) => (
              <ActiveAlertScreen
                {...props}
                user={user}
                contacts={contacts}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Resources" component={ResourcesScreen} />
          <Stack.Screen name="Recursos" component={ResourcesScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}