import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
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
import ResourcesScreen from './src/screens/ResourcesScreen';

const Stack = createNativeStackNavigator();

// Redirige inmediatamente hacia la pantalla real sin quedarse atorado en MainTabs
function MainTabsRedirect({ navigation, route }) {
  useEffect(() => {
    const target = route?.params?.screen || 'InicioTab';

    if (target === 'ContactosTab' || target === 'Contacts') {
      navigation.replace('ContactosTab');
    } else if (target === 'AccompaniTab' || target === 'Escort') {
      navigation.replace('AccompaniTab');
    } else if (
      target === 'HistorialTab' ||
      target === 'RecursosTab' ||
      target === 'MapaDeApoyo' ||
      target === 'Resources'
    ) {
      navigation.replace('HistorialTab');
    } else {
      navigation.replace('InicioTab');
    }
  }, [navigation, route?.params?.screen]);

  return null;
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
        <Stack.Navigator 
          initialRouteName="InicioTab"
          screenOptions={{ headerShown: false }}
        >
          {/* PANTALLAS PRINCIPALES DE LA BARRA INFERIOR */}
          <Stack.Screen name="InicioTab" options={{ animation: 'none' }}>
            {(props) => (
              <HomeScreen 
                {...props} 
                user={user} 
                setUser={setUser} 
                onLogout={handleLogout} 
              />
            )}
          </Stack.Screen>

          <Stack.Screen 
            name="ContactosTab" 
            component={ContactsScreen} 
            options={{ animation: 'none' }} 
          />

          <Stack.Screen 
            name="AccompaniTab" 
            component={AccompaniScreen} 
            options={{ animation: 'none' }} 
          />

          <Stack.Screen 
            name="HistorialTab" 
            component={ResourcesScreen} 
            options={{ animation: 'none' }} 
          />

          <Stack.Screen 
            name="RecursosTab" 
            component={ResourcesScreen} 
            options={{ animation: 'none' }} 
          />

          {/* REDIRECTOR LIMPIO PARA CUALQUIER LLAMADO A MainTabs */}
          <Stack.Screen 
            name="MainTabs" 
            component={MainTabsRedirect} 
            options={{ animation: 'none' }} 
          />

          {/* PANTALLAS SECUNDARIAS / DETALLE */}
          <Stack.Screen name="MyDevice" component={MyDeviceScreen} />
          <Stack.Screen name="Bracelet" component={MyDeviceScreen} />

          <Stack.Screen name="Telemetry" component={TelemetryScreen} />
          <Stack.Screen name="Sensors" component={TelemetryScreen} />
          <Stack.Screen name="Sensores" component={TelemetryScreen} />

          <Stack.Screen name="AlertDetail" component={AlertDetailScreen} />
          <Stack.Screen name="UltimaAlerta" component={AlertDetailScreen} />
          <Stack.Screen name="LastAlert" component={AlertDetailScreen} />

          <Stack.Screen name="Contacts" component={ContactsScreen} />
          <Stack.Screen name="Contactos" component={ContactsScreen} />

          <Stack.Screen name="Accompani" component={AccompaniScreen} />
          <Stack.Screen name="Escort" component={AccompaniScreen} />

          <Stack.Screen name="ActiveAlert" component={ActiveAlertScreen} />
          <Stack.Screen name="AlertActive" component={ActiveAlertScreen} />

          <Stack.Screen name="Resources" component={ResourcesScreen} />
          <Stack.Screen name="Recursos" component={ResourcesScreen} />
          <Stack.Screen name="MapaDeApoyo" component={ResourcesScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}