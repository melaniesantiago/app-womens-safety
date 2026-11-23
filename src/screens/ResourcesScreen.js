import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Linking, 
  Alert,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';

// Número de WhatsApp de Carol (Cámbialo por el número real a 10 dígitos con lada 521)
const CAROL_WHATSAPP_NUMBER = '5217380000000';

// Centros de apoyo reales con coordenadas exactas en Hidalgo
const REGIONAL_CENTERS = [
  {
    id: '1',
    municipality: 'Mixquiahuala',
    name: 'Seguridad Pública y Tránsito Municipal',
    address: 'Zona Centro, Mixquiahuala de Juárez, Hgo.',
    latitude: 20.2294,
    longitude: -99.2136,
    instruction: 'Avanza hacia Zona Centro rumbo a Comandancia Municipal',
    icon: 'shield-checkmark'
  },
  {
    id: '2',
    municipality: 'Mixquiahuala',
    name: 'Instancia Municipal de la Mujer',
    address: 'Palacio Municipal, Centro, Mixquiahuala, Hgo.',
    latitude: 20.2305,
    longitude: -99.2145,
    instruction: 'Dirígete al Jardín Principal / Palacio Municipal',
    icon: 'business'
  },
  {
    id: '3',
    municipality: 'Progreso de Obregón',
    name: 'Seguridad Pública y Atención Ciudadana',
    address: 'Centro, Progreso de Obregón, Hgo.',
    latitude: 20.2483,
    longitude: -99.1897,
    instruction: 'Toma la carretera hacia el centro de Progreso de Obregón',
    icon: 'shield'
  },
  {
    id: '4',
    municipality: 'Tlahuelilpan',
    name: 'Centro de Salud y Atención Integral',
    address: 'Av. Sergio Butrón Casas, Tlahuelilpan, Hgo.',
    latitude: 20.1331,
    longitude: -99.2333,
    instruction: 'Continúa por Av. Sergio Butrón Casas hacia el módulo',
    icon: 'medkit'
  },
  {
    id: '5',
    municipality: 'Actopan',
    name: 'Centro de Justicia para Mujeres (Región)',
    address: 'Zona Centro, Actopan, Hgo.',
    latitude: 20.2683,
    longitude: -98.9436,
    instruction: 'Sigue la carretera regional Mixquiahuala - Actopan',
    icon: 'ribbon'
  },
  {
    id: '6',
    municipality: 'Ixmiquilpan',
    name: 'Módulo Regional de Atención y Seguridad',
    address: 'Centro, Ixmiquilpan, Hgo.',
    latitude: 20.4836,
    longitude: -99.2169,
    instruction: 'Avanza por carretera federal hacia Ixmiquilpan Centro',
    icon: 'heart'
  }
];

export default function ResourcesScreen() {
  const navigation = useNavigation();
  const webViewRef = useRef(null);

  // Modales
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [isBotModalVisible, setIsBotModalVisible] = useState(false);

  // Estados de Mapa GPS Real y Ruta por Calles
  const [realGpsCoords, setRealGpsCoords] = useState(null);
  const [displayCoords, setDisplayCoords] = useState(null);
  const [selectedCenter, setSelectedCenter] = useState(REGIONAL_CENTERS[0]);
  const [selectedMunicipality, setSelectedMunicipality] = useState('Todos');
  const [isNavigatingLive, setIsNavigatingLive] = useState(false);
  const [isSimulatingWalk, setIsSimulatingWalk] = useState(false);
  const [simStepIndex, setSimStepIndex] = useState(0);

  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [totalDistanceMeters, setTotalDistanceMeters] = useState(0);
  const [routeInfo, setRouteInfo] = useState({ distance: '', duration: '' });
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Chatbot
  const [botInput, setBotInput] = useState('');
  const [botHistoryIndex, setBotHistoryIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'bot',
      text: 'Hola, soy tu Asistente SafeWave 💜. Estoy aquí las 24 horas para orientarte sobre rutas seguras en la región, qué hacer en una situación de riesgo o conectarte con ayuda. ¿Cómo te sientes o en qué te apoyo hoy?',
      time: 'Ahora'
    }
  ]);

  // 1. Rastreo GPS físico en tiempo real
  useEffect(() => {
    let locationSubscription = null;

    async function startLiveGpsTracking() {
      if (!isMapModalVisible) return;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const fallback = { latitude: 20.2265, longitude: -99.2110 };
        setRealGpsCoords(fallback);
        setDisplayCoords(fallback);
        return;
      }

      const initialLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      const initialCoords = {
        latitude: initialLoc.coords.latitude,
        longitude: initialLoc.coords.longitude
      };
      setRealGpsCoords(initialCoords);
      setDisplayCoords(initialCoords);

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 2
        },
        (newLoc) => {
          const updated = {
            latitude: newLoc.coords.latitude,
            longitude: newLoc.coords.longitude
          };
          setRealGpsCoords(updated);
          if (!isSimulatingWalk) {
            setDisplayCoords(updated);
          }
        }
      );
    }

    startLiveGpsTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isMapModalVisible, isSimulatingWalk]);

  // 2. Calcular ruta real siguiendo las calles (OSRM) cada vez que cambies de instancia
  const fetchStreetRoute = async (origin, destination) => {
    if (!origin || !destination) return;
    setIsCalculatingRoute(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/foot/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const points = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        setRouteCoordinates(points);
        setTotalDistanceMeters(route.distance);

        const distKm = route.distance >= 1000
          ? `${(route.distance / 1000).toFixed(1)} km`
          : `${Math.round(route.distance)} m`;
        const mins = Math.max(1, Math.round(route.duration / 60));

        setRouteInfo({
          distance: distKm,
          duration: `${mins} min`
        });
      }
    } catch (error) {
      setRouteCoordinates([
        [origin.latitude, origin.longitude],
        [destination.latitude, destination.longitude]
      ]);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // Recalcular ruta inmediatamente al tocar otra instancia
  useEffect(() => {
    if (isMapModalVisible && realGpsCoords && selectedCenter) {
      setIsSimulatingWalk(false);
      setSimStepIndex(0);
      setDisplayCoords(realGpsCoords);
      fetchStreetRoute(realGpsCoords, selectedCenter);
    }
  }, [selectedCenter, realGpsCoords, isMapModalVisible]);

  // 3. Simulación de avance calle por calle para demostración en vivo
  useEffect(() => {
    let simTimer = null;
    if (isNavigatingLive && isSimulatingWalk && routeCoordinates.length > 1) {
      simTimer = setInterval(() => {
        setSimStepIndex((prev) => {
          const stepIncrement = Math.max(1, Math.floor(routeCoordinates.length / 25));
          const nextIdx = prev + stepIncrement;

          if (nextIdx >= routeCoordinates.length - 1) {
            const finalPoint = routeCoordinates[routeCoordinates.length - 1];
            setDisplayCoords({ latitude: finalPoint[0], longitude: finalPoint[1] });
            setRouteInfo({ distance: '0 m (Llegaste)', duration: '0 min' });
            setIsSimulatingWalk(false);
            clearInterval(simTimer);
            return routeCoordinates.length - 1;
          }

          const currentPoint = routeCoordinates[nextIdx];
          setDisplayCoords({ latitude: currentPoint[0], longitude: currentPoint[1] });

          const ratioRemaining = 1 - nextIdx / (routeCoordinates.length - 1);
          const remMeters = Math.round(totalDistanceMeters * ratioRemaining);
          const remDistText = remMeters >= 1000
            ? `${(remMeters / 1000).toFixed(1)} km`
            : `${remMeters} m`;
          const remMins = Math.max(1, Math.round(remMeters / 80));

          setRouteInfo({
            distance: remDistText,
            duration: `${remMins} min`
          });

          return nextIdx;
        });
      }, 900);
    }
    return () => {
      if (simTimer) clearInterval(simTimer);
    };
  }, [isNavigatingLive, isSimulatingWalk, routeCoordinates, totalDistanceMeters]);

  // 4. Actualizar el mapa sin trabarse al cambiar de destino
  useEffect(() => {
    if (webViewRef.current && displayCoords && isMapModalVisible) {
      const payload = JSON.stringify({
        userCoords: displayCoords,
        selectedCenter,
        routeCoordinates,
        isNavigatingLive
      });
      webViewRef.current.injectJavaScript(`
        if (window.updateMapData) {
          window.updateMapData(${payload});
        }
        true;
      `);
    }
  }, [displayCoords, selectedCenter, routeCoordinates, isNavigatingLive, isMapModalVisible]);

  // HTML con mosaicos gratuitos de OpenStreetMap (sin marca de agua de API KEY)
  const googleStyleMapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #F2EFE9; }
        .gmaps-user-puck {
          width: 22px; height: 22px;
          background: #1A73E8;
          border: 3.5px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 0 0 6px rgba(26, 115, 232, 0.25), 0 3px 8px rgba(0,0,0,0.35);
        }
        .gmaps-dest-pin {
          width: 26px; height: 26px;
          background: #EA4335;
          border: 3px solid #FFFFFF;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 3px 8px rgba(0,0,0,0.4);
        }
        .gmaps-dest-pin::after {
          content: '';
          width: 8px; height: 8px;
          background: #FFFFFF;
          border-radius: 50%;
          position: absolute;
          top: 6px; left: 6px;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([20.2294, -99.2136], 15);
        
        // Mosaicos públicos gratuitos sin API Key
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(map);

        var userIcon = L.divIcon({ className: 'gmaps-user-puck', iconSize: [22, 22], iconAnchor: [11, 11] });
        var destIcon = L.divIcon({ className: 'gmaps-dest-pin', iconSize: [26, 26], iconAnchor: [13, 26] });

        var userMarker = null;
        var destMarker = null;
        var routeBorder = null;
        var routeInner = null;
        var lastDestId = null;

        window.updateMapData = function(data) {
          var u = data.userCoords;
          var d = data.selectedCenter;
          var pts = data.routeCoordinates;
          var navLive = data.isNavigatingLive;

          if (u) {
            if (!userMarker) {
              userMarker = L.marker([u.latitude, u.longitude], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
            } else {
              userMarker.setLatLng([u.latitude, u.longitude]);
            }
          }

          if (d) {
            if (!destMarker) {
              destMarker = L.marker([d.latitude, d.longitude], { icon: destIcon, zIndexOffset: 900 }).addTo(map);
            } else {
              destMarker.setLatLng([d.latitude, d.longitude]);
            }
          }

          if (pts && pts.length > 0) {
            if (routeBorder) map.removeLayer(routeBorder);
            if (routeInner) map.removeLayer(routeInner);

            routeBorder = L.polyline(pts, {
              color: '#174EA6',
              weight: 9,
              opacity: 0.9
            }).addTo(map);

            routeInner = L.polyline(pts, {
              color: '#4285F4',
              weight: 5,
              opacity: 1
            }).addTo(map);

            if (navLive && u) {
              map.flyTo([u.latitude, u.longitude], 17, { duration: 0.8 });
            } else if (lastDestId !== d.id) {
              lastDestId = d.id;
              map.flyToBounds(routeInner.getBounds(), { padding: [45, 45], duration: 0.9 });
            }
          }
        };
      </script>
    </body>
    </html>
  `;

  // Iniciar seguimiento activo
  const handleStartLiveNavigation = () => {
    setIsNavigatingLive(true);
    setSimStepIndex(0);
    setIsSimulatingWalk(true);
  };

  // Finalizar llegada segura
  const handleArrivedSafely = () => {
    setIsNavigatingLive(false);
    setIsSimulatingWalk(false);
    Alert.alert(
      'Llegada Confirmada 💜',
      `Has llegado a ${selectedCenter.name}. Tu red de confianza ha sido notificada de que estás en un lugar seguro.`
    );
  };

  // Llamadas telefónicas
  const handleCallPhone = (number, label) => {
    Linking.openURL(`tel:${number}`).catch(() => {
      Alert.alert('Error', `No se pudo realizar la llamada a ${label}.`);
    });
  };

  // WhatsApp directo a Carol
  const handleOpenCarolWhatsApp = () => {
    const message = encodeURIComponent(
      'Hola Carol, te contacto desde la app SafeWave. Necesito orientación y apoyo.'
    );
    const url = `https://wa.me/${CAROL_WHATSAPP_NUMBER}?text=${message}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp no disponible', 'Asegúrate de tener WhatsApp instalado en tu teléfono.');
    });
  };

  // Chatbot Inteligente
  const generateSmartBotReply = (userText, turnIndex) => {
    const text = userText.toLowerCase();
    if (text.includes('peligro') || text.includes('siguen') || text.includes('ayuda') || text.includes('miedo') || text.includes('emergencia')) {
      return '🚨 Si sientes peligro inmediato:\n1. Dirígete a un lugar iluminado y con gente (como Seguridad Pública o Presidencia).\n2. Presiona el botón rojo de Seguridad Pública Mixquiahuala (738 725 0000) o el 911.\n3. Activa tu alerta desde la pantalla de Inicio.';
    }
    if (text.includes('donde') || text.includes('centro') || text.includes('ir') || text.includes('lugar') || text.includes('mapa') || text.includes('cerca')) {
      return '📍 En nuestra región cuentas con puntos seguros en Mixquiahuala, Progreso de Obregón, Tlahuelilpan, Actopan e Ixmiquilpan. Abre "Mapa regional de centros" y presiona "Iniciar navegación" para que el mapa siga tus pasos en tiempo real.';
    }
    if (text.includes('camino') || text.includes('casa') || text.includes('sola') || text.includes('noche') || text.includes('ruta')) {
      return '🛡️ Para trasladarte más segura, activa la pestaña "Acompáñame" en el menú inferior. Si no confirmas que llegaste a tiempo, la app alertará a tu red de confianza.';
    }
    if (text.includes('carol') || text.includes('persona') || text.includes('hablar') || text.includes('whatsapp')) {
      return '💬 Toca la tarjeta "Chat de orientación" en Recursos para abrir directamente el WhatsApp de Carol.';
    }
    const progressiveReplies = [
      'Te escucho con atención. Cuéntame un poco más sobre lo que ocurre para orientarte mejor.',
      '¿Te encuentras actualmente en un lugar seguro o deseas que tracemos la ruta en el mapa hacia el módulo más cercano?',
      'Recuerda que tienes derecho a recibir atención gratuita y confidencial en los centros de Mixquiahuala y toda la región.',
      'Sigo aquí contigo. Si necesitas ayuda inmediata, utiliza el botón de Seguridad Pública o el 911 en esta misma pantalla.'
    ];
    return progressiveReplies[turnIndex % progressiveReplies.length];
  };

  const handleSendBotMessage = () => {
    if (!botInput.trim()) return;
    const currentText = botInput.trim();
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: currentText, time: 'Ahora' }]);
    setBotInput('');

    setTimeout(() => {
      const replyText = generateSmartBotReply(currentText, botHistoryIndex);
      setBotHistoryIndex(prev => prev + 1);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'bot', text: replyText, time: 'Ahora' }]);
    }, 500);
  };

  const filteredCenters =
    selectedMunicipality === 'Todos'
      ? REGIONAL_CENTERS
      : REGIONAL_CENTERS.filter(c => c.municipality === selectedMunicipality);

  const goToTab = (tabName) => {
    navigation?.navigate(tabName);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Recursos</Text>
        <Text style={styles.subtitle}>Apoyo inmediato, mapa regional y orientación en Hidalgo.</Text>

        {/* BOTÓN EMERGENCIA 911 */}
        <TouchableOpacity 
          style={styles.btn911} 
          activeOpacity={0.8}
          onPress={() => handleCallPhone('911', 'Emergencias 911')}
        >
          <View style={styles.leftRow}>
            <Ionicons name="call" size={22} color="#FFFFFF" style={{ marginRight: 12 }} />
            <Text style={styles.btn911Text}>Emergencias 911</Text>
          </View>
          <Text style={styles.badge24h}>24 h</Text>
        </TouchableOpacity>

        {/* SEGURIDAD PÚBLICA DE MIXQUIAHUALA HIDALGO */}
        <TouchableOpacity 
          style={styles.contactCard}
          activeOpacity={0.8}
          onPress={() => handleCallPhone('7387250000', 'Seguridad Pública Mixquiahuala')}
        >
          <View style={styles.phoneIconBg}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#521841" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactTitle}>Seguridad Pública Mixquiahuala</Text>
            <Text style={styles.contactSub}>738 725 0000 · Policía Municipal Hidalgo</Text>
          </View>
          <Ionicons name="call" size={20} color="#521841" />
        </TouchableOpacity>

        {/* LÍNEA DE APOYO */}
        <TouchableOpacity 
          style={styles.contactCard}
          activeOpacity={0.8}
          onPress={() => handleCallPhone('8009112000', 'Línea Nacional de Apoyo')}
        >
          <View style={styles.phoneIconBg}>
            <Ionicons name="call-outline" size={22} color="#521841" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactTitle}>Línea de apoyo a la mujer</Text>
            <Text style={styles.contactSub}>800 911 2000 · Atención confidencial 24/7</Text>
          </View>
          <Ionicons name="call" size={20} color="#521841" />
        </TouchableOpacity>

        <Text style={styles.sectionHeader}>Ubicación y Orientación</Text>

        {/* TARJETA MAPA REGIONAL */}
        <TouchableOpacity 
          style={styles.wideFeatureCard} 
          activeOpacity={0.8}
          onPress={() => setIsMapModalVisible(true)}
        >
          <View style={styles.iconBox}>
            <Ionicons name="map" size={24} color="#521841" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.gridTitle}>Mapa regional de centros</Text>
            <Text style={styles.gridSub}>
              Navegación GPS paso a paso en tiempo real hacia puntos seguros en Hidalgo.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>

        {/* WHATSAPP CON CAROL + CHATBOT */}
        <View style={styles.gridContainer}>
          <TouchableOpacity 
            style={styles.gridCard} 
            activeOpacity={0.8}
            onPress={handleOpenCarolWhatsApp}
          >
            <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="logo-whatsapp" size={24} color="#15803D" />
            </View>
            <Text style={styles.gridTitle}>Chat de orientación</Text>
            <Text style={styles.gridSub}>Ir directo al WhatsApp de Carol</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridCard} 
            activeOpacity={0.8}
            onPress={() => setIsBotModalVisible(true)}
          >
            <View style={styles.iconBox}>
              <Ionicons name="sparkles" size={24} color="#521841" />
            </View>
            <Text style={styles.gridTitle}>Asistente SafeWave</Text>
            <Text style={styles.gridSub}>Chatbot de ayuda inmediata 24/7</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ===================================================================== */}
      {/* MODAL 1: MAPA CON SEGUIMIENTO EN TIEMPO REAL                          */}
      {/* ===================================================================== */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={isMapModalVisible}
        onRequestClose={() => {
          setIsNavigatingLive(false);
          setIsSimulatingWalk(false);
          setIsMapModalVisible(false);
        }}
      >
        <SafeAreaView style={styles.fullModalContainer}>
          <View style={styles.mapModalHeader}>
            <TouchableOpacity 
              onPress={() => {
                setIsNavigatingLive(false);
                setIsSimulatingWalk(false);
                setIsMapModalVisible(false);
              }} 
              style={{ marginRight: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color="#0F172A" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Navegación GPS Regional</Text>
              <Text style={styles.modalSub}>
                {isNavigatingLive ? '🔵 Siguiendo tu recorrido calle por calle' : 'Selecciona un destino en Hidalgo'}
              </Text>
            </View>
          </View>

          {!isNavigatingLive && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {['Todos', 'Mixquiahuala', 'Progreso de Obregón', 'Tlahuelilpan', 'Actopan', 'Ixmiquilpan'].map(
                (mun) => (
                  <TouchableOpacity
                    key={mun}
                    style={[styles.filterChip, selectedMunicipality === mun && styles.filterChipActive]}
                    onPress={() => setSelectedMunicipality(mun)}
                  >
                    <Text style={[styles.filterChipText, selectedMunicipality === mun && styles.filterChipTextActive]}>
                      {mun}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
          )}

          {/* BANNER VERDE TURN-BY-TURN AL INICIAR RUTA */}
          {isNavigatingLive && (
            <View style={styles.gmapsTurnBanner}>
              <View style={styles.turnIconBox}>
                <Ionicons name="arrow-up" size={26} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.turnDistanceText}>{routeInfo.distance}</Text>
                <Text style={styles.turnInstructionText}>{selectedCenter.instruction}</Text>
              </View>
            </View>
          )}

          {/* MAPA SIN MARCA DE AGUA CON CALLES REALES */}
          <View style={[styles.mapWrapper, isNavigatingLive && { height: 320 }]}>
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: googleStyleMapHtml }}
              userAgent="SafeWaveMixquiahualaApp/1.0 (Expo)"
              style={{ flex: 1 }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              onLoadEnd={() => {
                if (displayCoords && webViewRef.current) {
                  const payload = JSON.stringify({
                    userCoords: displayCoords,
                    selectedCenter,
                    routeCoordinates,
                    isNavigatingLive
                  });
                  webViewRef.current.injectJavaScript(`
                    if (window.updateMapData) { window.updateMapData(${payload}); }
                    true;
                  `);
                }
              }}
            />

            {isCalculatingRoute && (
              <View style={styles.routeLoaderBadge}>
                <ActivityIndicator size="small" color="#1A73E8" />
                <Text style={styles.routeLoaderText}>Trazando ruta...</Text>
              </View>
            )}
          </View>

          {/* TARJETA INFERIOR DE NAVEGACIÓN ACTIVA */}
          <View style={[styles.liveNavCard, isNavigatingLive && styles.liveNavCardActive]}>
            <View style={styles.liveNavHeader}>
              <View style={[styles.liveBadge, isNavigatingLive && { backgroundColor: '#E8F0FE' }]}>
                <View style={[styles.greenDot, isNavigatingLive && { backgroundColor: '#1A73E8' }]} />
                <Text style={[styles.liveBadgeText, isNavigatingLive && { color: '#1A73E8' }]}>
                  {isNavigatingLive ? 'NAVEGACIÓN EN VIVO ACTIVA' : 'RUTA CALCULADA'}
                </Text>
              </View>
              {routeInfo.distance ? (
                <Text style={styles.distanceBadge}>
                  {routeInfo.distance} · {routeInfo.duration}
                </Text>
              ) : null}
            </View>

            <Text style={styles.selectedCenterName}>{selectedCenter.name}</Text>
            <Text style={styles.selectedCenterAddress}>{selectedCenter.address}</Text>

            {!isNavigatingLive ? (
              <TouchableOpacity
                style={styles.startRouteBtn}
                activeOpacity={0.85}
                onPress={handleStartLiveNavigation}
              >
                <Ionicons name="navigate" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.startRouteBtnText}>Iniciar navegación en tiempo real</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.activeRouteActions}>
                <TouchableOpacity
                  style={styles.cancelRouteBtn}
                  onPress={() => {
                    setIsNavigatingLive(false);
                    setIsSimulatingWalk(false);
                    if (realGpsCoords) setDisplayCoords(realGpsCoords);
                  }}
                >
                  <Text style={styles.cancelRouteBtnText}>Salir</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.arrivedBtn}
                  onPress={handleArrivedSafely}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.arrivedBtnText}>Ya llegué segura</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* LISTA DE CENTROS DE LA REGIÓN */}
          {!isNavigatingLive && (
            <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
              {filteredCenters.map((center) => {
                const isSelected = selectedCenter.id === center.id;
                return (
                  <TouchableOpacity
                    key={center.id}
                    style={[styles.centerListItem, isSelected && styles.centerListItemSelected]}
                    onPress={() => setSelectedCenter(center)}
                  >
                    <View style={styles.centerIconBox}>
                      <Ionicons name={center.icon} size={20} color="#521841" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.munTag}>{center.municipality}</Text>
                      <Text style={styles.centerName}>{center.name}</Text>
                      <Text style={styles.centerAddress}>{center.address}</Text>
                    </View>
                    <Ionicons name="navigate-circle-outline" size={24} color="#1A73E8" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 2: CHATBOT INTELIGENTE COMPLETO (ASISTENTE SAFEWAVE)            */}
      {/* ===================================================================== */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={isBotModalVisible}
        onRequestClose={() => setIsBotModalVisible(false)}
      >
        <SafeAreaView style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setIsBotModalVisible(false)} style={{ marginRight: 12 }}>
              <Ionicons name="arrow-back" size={24} color="#0F172A" />
            </TouchableOpacity>
            <View style={styles.botAvatar}>
              <Ionicons name="sparkles" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.chatHeaderName}>Asistente SafeWave</Text>
              <Text style={styles.chatHeaderStatus}>Orientación automática 24/7</Text>
            </View>
          </View>

          <View style={styles.quickPromptsRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                '¿A dónde puedo acudir en la región?',
                'Voy caminando sola y tengo miedo',
                'Quiero hablar con Carol'
              ].map((prompt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickChip}
                  onPress={() => setBotInput(prompt)}
                >
                  <Text style={styles.quickChipText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView
            ref={scrollViewRef}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            style={styles.messagesList}
            contentContainerStyle={{ padding: 16 }}
          >
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageBubble,
                  msg.sender === 'user' ? styles.userBubble : styles.botBubble
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.sender === 'user' ? styles.userMessageText : styles.botMessageText
                  ]}
                >
                  {msg.text}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    msg.sender === 'user' ? { color: '#F3E8F0' } : { color: '#94A3B8' }
                  ]}
                >
                  {msg.time}
                </Text>
              </View>
            ))}
          </ScrollView>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.chatInputBar}>
              <TextInput
                style={styles.chatTextInput}
                placeholder="Escribe tu consulta aquí..."
                placeholderTextColor="#94A3B8"
                value={botInput}
                onChangeText={setBotInput}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendBotMessage}>
                <Ionicons name="send" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* BARRA INFERIOR DE NAVEGACIÓN */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => goToTab('InicioTab')}>
          <Ionicons name="home-outline" size={24} color="#9E8697" />
          <Text style={styles.navText}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => goToTab('ContactosTab')}>
          <Ionicons name="people-outline" size={24} color="#9E8697" />
          <Text style={styles.navText}>Contactos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => goToTab('AccompaniTab')}>
          <Ionicons name="location-outline" size={24} color="#9E8697" />
          <Text style={styles.navText}>Acompáñame</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={1}>
          <Ionicons name="bookmark" size={24} color="#521841" />
          <Text style={[styles.navText, styles.navTextActive]}>Recursos</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F8F6' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 },
  title: { fontSize: 30, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4, marginBottom: 20, fontWeight: '500' },

  btn911: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#B91C1C',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 12,
  },
  leftRow: { flexDirection: 'row', alignItems: 'center' },
  btn911Text: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  badge24h: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', opacity: 0.9 },

  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  phoneIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F3E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  contactSub: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '600' },

  sectionHeader: { fontSize: 14, fontWeight: '800', color: '#475569', marginTop: 8, marginBottom: 12 },

  wideFeatureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  gridContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#F3E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 8,
  },
  gridTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  gridSub: { fontSize: 12, color: '#64748B', fontWeight: '500', lineHeight: 16 },

  // Modal Mapa
  fullModalContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  modalSub: { fontSize: 12, color: '#1A73E8', fontWeight: '700' },

  gmapsTurnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D652D',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 18,
    padding: 14,
    elevation: 4,
  },
  turnIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  turnDistanceText: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  turnInstructionText: { fontSize: 13, fontWeight: '600', color: '#E6F4EA', marginTop: 2 },

  filterScroll: { maxHeight: 48, paddingHorizontal: 16, paddingVertical: 8 },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: { backgroundColor: '#521841', borderColor: '#521841' },
  filterChipText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  filterChipTextActive: { color: '#FFFFFF' },

  mapWrapper: {
    height: 240,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    position: 'relative',
  },
  routeLoaderBadge: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 3,
  },
  routeLoaderText: { fontSize: 11, fontWeight: '700', color: '#1A73E8', marginLeft: 6 },

  liveNavCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#521841',
  },
  liveNavCardActive: { borderColor: '#1A73E8', backgroundColor: '#F8FAFF' },
  liveNavHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E8F0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  greenDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#0D7A68', marginRight: 5 },
  liveBadgeText: { fontSize: 10, fontWeight: '800', color: '#0D7A68' },
  distanceBadge: { fontSize: 14, fontWeight: '900', color: '#1A73E8' },
  selectedCenterName: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  selectedCenterAddress: { fontSize: 12, color: '#64748B', marginTop: 2 },

  startRouteBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A73E8',
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 12,
  },
  startRouteBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },

  activeRouteActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  cancelRouteBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelRouteBtnText: { color: '#64748B', fontWeight: '800', fontSize: 14 },
  arrivedBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#0D7A68',
    borderRadius: 14,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  arrivedBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },

  centerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  centerListItemSelected: { borderColor: '#1A73E8', backgroundColor: '#F0F6FF' },
  centerIconBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F3E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  munTag: { fontSize: 10, fontWeight: '800', color: '#521841', textTransform: 'uppercase' },
  centerName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  centerAddress: { fontSize: 11, color: '#64748B' },

  // Chatbot
  chatContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  botAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#521841',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatHeaderName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  chatHeaderStatus: { fontSize: 12, color: '#0D7A68', fontWeight: '600' },
  quickPromptsRow: { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  quickChip: { backgroundColor: '#F3E8F0', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, marginRight: 8 },
  quickChipText: { fontSize: 12, color: '#521841', fontWeight: '700' },
  messagesList: { flex: 1 },
  messageBubble: { maxWidth: '84%', borderRadius: 18, padding: 14, marginBottom: 12 },
  botBubble: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderBottomLeftRadius: 4 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#521841', borderBottomRightRadius: 4 },
  messageText: { fontSize: 14, lineHeight: 20 },
  botMessageText: { color: '#1E293B' },
  userMessageText: { color: '#FFFFFF' },
  messageTime: { fontSize: 10, marginTop: 6, alignSelf: 'flex-end' },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginRight: 10,
  },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#521841', justifyContent: 'center', alignItems: 'center' },

  // Bottom Nav
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 68,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: 4,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  navText: { fontSize: 11, color: '#9E8697', marginTop: 4, fontWeight: '500', textAlign: 'center' },
  navTextActive: { color: '#521841', fontWeight: '700' },
});