import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Importación de pantallas del proyecto
import HomeScreen from './src/screens/HomeScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MyDeviceScreen from './src/screens/MyDeviceScreen';
import TelemetryScreen from './src/screens/TelemetryScreen';
import AlertDetailScreen from './src/screens/AlertDetailScreen';
import AccompaniScreen from './src/screens/AccompaniScreen';
import ActiveAlertScreen from './src/screens/ActiveAlertScreen';

// Carga segura de ResourcesScreen (evita el crash si el archivo aún no existe)
let ResourcesScreen;
try {
  ResourcesScreen = require('./src/screens/ResourcesScreen').default;
} catch (e) {
  ResourcesScreen = AlertDetailScreen; // Fallback temporal para no congelar la app
}

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Navegador por pestañas principales
function TabNavigator({ user, setUser, handleLogout }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tab.Screen name="InicioTab">
        {(props) => (
          <HomeScreen 
            {...props} 
            user={user} 
            setUser={setUser} 
            onLogout={handleLogout} 
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="ContactosTab" component={ContactsScreen} />
      <Tab.Screen name="Contactos" component={ContactsScreen} />

      <Tab.Screen name="AccompaniTab" component={AccompaniScreen} />
      <Tab.Screen name="MapaDeApoyo" component={AccompaniScreen} />
      <Tab.Screen name="Escort" component={AccompaniScreen} />

      <Tab.Screen name="HistorialTab" component={ResourcesScreen} />
      <Tab.Screen name="RecursosTab" component={ResourcesScreen} />
      <Tab.Screen name="ResourcesTab" component={ResourcesScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [screenState, setScreenState] = useState('login');
  
  const [user, setUser] = useState({
    name: '',
    email: '',
    avatarIcon: 'person'
  });

  const handleRegisterSuccess = (registeredData) => {
    if (registeredData) {
      setUser({
        name: registeredData.name || 'Usuaria',
        email: registeredData.email || '',
        avatarIcon: 'person'
      });
    }
    setScreenState('login');
  };

  const handleLogin = (loginData) => {
    setUser(prev => {
      const email = loginData?.email || prev.email || 'usuaria@correo.com';
      let name = prev.name;
      
      if (!name) {
        const emailUser = email.split('@')[0];
        name = emailUser.charAt(0).toUpperCase() + emailUser.slice(1);
      }

      return {
        name: name,
        email: email,
        avatarIcon: prev.avatarIcon || 'person'
      };
    });
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setScreenState('login');
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaProvider>
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

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          
          {/* Tabs Principales */}
          <Stack.Screen name="MainTabs">
            {(props) => (
              <TabNavigator 
                {...props} 
                user={user} 
                setUser={setUser} 
                handleLogout={handleLogout} 
              />
            )}
          </Stack.Screen>

          {/* FRAME 2: PULSERA 3D */}
          <Stack.Screen name="MyDevice" component={MyDeviceScreen} />
          <Stack.Screen name="Bracelet" component={MyDeviceScreen} />

          {/* FRAME 3: SENSORES Y TELEMETRÍA (TODOS LOS ALIAS RECUPERADOS) */}
          <Stack.Screen name="Telemetry" component={TelemetryScreen} />
          <Stack.Screen name="Sensors" component={TelemetryScreen} />
          <Stack.Screen name="Sensores" component={TelemetryScreen} />

          {/* FRAME 4: HISTORIAL / EVIDENCIA PDF (TODOS LOS ALIAS RECUPERADOS) */}
          <Stack.Screen name="AlertDetail" component={AlertDetailScreen} />
          <Stack.Screen name="UltimaAlerta" component={AlertDetailScreen} />
          <Stack.Screen name="LastAlert" component={AlertDetailScreen} />
          <Stack.Screen name="Historial" component={AlertDetailScreen} />
          <Stack.Screen name="AlertHistory" component={AlertDetailScreen} />

          {/* FRAME 5: RED DE CONFIANZA / CONTACTOS */}
          <Stack.Screen name="Contacts" component={ContactsScreen} />
          <Stack.Screen name="Contactos" component={ContactsScreen} />
          <Stack.Screen name="RedDeConfianza" component={ContactsScreen} />

          {/* FRAME 6: ACOMPÁÑAME (TODOS LOS ALIAS RECUPERADOS) */}
          <Stack.Screen name="Accompani" component={AccompaniScreen} />
          <Stack.Screen name="MapaDeApoyo" component={AccompaniScreen} />
          <Stack.Screen name="Escort" component={AccompaniScreen} />

          {/* FRAME 7: ALERTA EN CURSO / PIN DE COACCIÓN */}
          <Stack.Screen name="ActiveAlert" component={ActiveAlertScreen} />
          <Stack.Screen name="AlertaEnCurso" component={ActiveAlertScreen} />

          {/* FRAME RECURSOS */}
          <Stack.Screen name="Resources" component={ResourcesScreen} />
          <Stack.Screen name="Recursos" component={ResourcesScreen} />

        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}