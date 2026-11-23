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

// 👇 PON AQUÍ DIRECTAMENTE LOS 10 DÍGITOS DEL NÚMERO REAL DE CAROL (Ej: '7721234567')
const CAROL_WHATSAPP_NUMBER = '+52 1 773 680 8258';

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

  // =========================================================================
  // MOTOR AVANZADO DEL ASISTENTE WOMENSAFETY (IA CONTEXTUAL + ACCIONES)
  // =========================================================================
  const [botInput, setBotInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState([
    '🚨 Me siento en peligro ahora',
    '📍 Centros de apoyo en Hidalgo',
    '🚶‍♀️ Voy caminando sola de noche',
    '⚖️ Orientación legal y Ley Olimpia',
    '💬 Hablar con Carol por WhatsApp',
  ]);
  const scrollViewRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'bot',
      riskLevel: 'normal',
      title: 'Asistente Virtual WomenSafety 💜',
      text: 'Hola, soy tu guía inteligente de seguridad y orientación en la región (Mixquiahuala, Progreso, Tlahuelilpan, Actopan e Ixmiquilpan).\n\nPuedo ayudarte con protocolos de emergencia, ubicarte en el mapa hacia un punto seguro, explicarte tus derechos o conectarte directo con Carol.',
      actions: [
        { label: '🗺️ Abrir Mapa Regional', type: 'map' },
        { label: '💬 Chat con Carol', type: 'carol' },
      ],
      time: 'Ahora',
    },
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

  // 2. Calcular ruta real siguiendo las calles (OSRM)
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

  useEffect(() => {
    if (isMapModalVisible && realGpsCoords && selectedCenter) {
      setIsSimulatingWalk(false);
      setSimStepIndex(0);
      setDisplayCoords(realGpsCoords);
      fetchStreetRoute(realGpsCoords, selectedCenter);
    }
  }, [selectedCenter, realGpsCoords, isMapModalVisible]);

  // 3. Simulación de avance calle por calle
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

  // 4. Actualizar el mapa
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

  const handleStartLiveNavigation = () => {
    setIsNavigatingLive(true);
    setSimStepIndex(0);
    setIsSimulatingWalk(true);
  };

  const handleArrivedSafely = () => {
    setIsNavigatingLive(false);
    setIsSimulatingWalk(false);
    Alert.alert(
      'Llegada Confirmada 💜',
      `Has llegado a ${selectedCenter.name}. Tu red de confianza ha sido notificada de que estás en un lugar seguro.`
    );
  };

  const handleCallPhone = (number, label) => {
    Linking.openURL(`tel:${number}`).catch(() => {
      Alert.alert('Error', `No se pudo realizar la llamada a ${label}.`);
    });
  };

  // Abre DIRECTAMENTE el chat de WhatsApp de Carol sin pedir número a la usuaria
  const handleOpenCarolWhatsApp = async () => {
    let clean = CAROL_WHATSAPP_NUMBER.replace(/[^0-9]/g, '');
    if (clean.length === 10) {
      clean = `52${clean}`;
    }

    const message = encodeURIComponent(
      'Hola Carol, te contacto desde la app WomenSafety. Necesito orientación y apoyo.'
    );
    const whatsappAppUrl = `whatsapp://send?phone=${clean}&text=${message}`;
    const webFallbackUrl = `https://api.whatsapp.com/send?phone=${clean}&text=${message}`;

    try {
      const supported = await Linking.canOpenURL(whatsappAppUrl);
      if (supported) {
        await Linking.openURL(whatsappAppUrl);
      } else {
        await Linking.openURL(webFallbackUrl);
      }
    } catch (error) {
      Alert.alert('WhatsApp no disponible', 'Asegúrate de tener WhatsApp instalado en tu teléfono.');
    }
  };

  // Ejecuta acciones directas desde las burbujas del chatbot
  const handleBotAction = (action) => {
    if (action.type === 'call911') {
      handleCallPhone('911', 'Emergencias 911');
    } else if (action.type === 'map') {
      if (action.centerIndex !== undefined && REGIONAL_CENTERS[action.centerIndex]) {
        setSelectedCenter(REGIONAL_CENTERS[action.centerIndex]);
      }
      setIsBotModalVisible(false);
      setTimeout(() => setIsMapModalVisible(true), 250);
    } else if (action.type === 'carol') {
      setIsBotModalVisible(false);
      setTimeout(() => handleOpenCarolWhatsApp(), 250);
    } else if (action.type === 'accompani') {
      setIsBotModalVisible(false);
      setTimeout(() => navigation?.navigate('AccompaniTab'), 250);
    }
  };

  // Analizador contextual de intención, municipio y nivel de urgencia
  const buildIntelligentResponse = (rawText) => {
    const text = rawText
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // 1. ALERTA ROJA: PELIGRO INMEDIATO
    if (
      text.includes('peligro') ||
      text.includes('siguen') ||
      text.includes('persiguen') ||
      text.includes('golpe') ||
      text.includes('amenaza') ||
      text.includes('emergencia') ||
      text.includes('auxilio') ||
      text.includes('miedo') ||
      text.includes('acoso')
    ) {
      return {
        riskLevel: 'high',
        title: '🚨 PROTOCOLO DE RESPUESTA INMEDIATA',
        text:
          'Actúa ahora siguiendo estos 3 pasos:\n\n' +
          '1. Busca luz y presencia pública: Entra a una tienda abierta, farmacia o dirígete hacia Seguridad Pública / Palacio Municipal.\n' +
          '2. No te detengas en callejones ni uses audífonos.\n' +
          '3. Usa los botones de abajo para llamar al 911 o trazar tu ruta GPS inmediata al punto seguro más cercano.',
        actions: [
          { label: '📞 Llamar al 911 Ahora', type: 'call911' },
          { label: '📍 Ruta al Centro Seguro', type: 'map' },
          { label: '💬 Avisar a Carol', type: 'carol' },
        ],
        nextChips: [
          '📍 ¿Cuál es el punto seguro en Mixquiahuala?',
          '🛡️ ¿Cómo activo mi alerta SOS?',
          '💬 Hablar con Carol por WhatsApp',
        ],
      };
    }

    // 2. BÚSQUEDA POR MUNICIPIO ESPECÍFICO DE HIDALGO
    if (text.includes('mixquiahuala')) {
      return {
        riskLevel: 'normal',
        title: '📍 Puntos Seguros en Mixquiahuala',
        text:
          'En Mixquiahuala de Juárez cuentas con dos puntos institucionales principales:\n\n' +
          '• Seguridad Pública y Tránsito Municipal (Zona Centro).\n' +
          '• Instancia Municipal de la Mujer (Palacio Municipal, Centro).\n\n' +
          'Toca abajo para abrir el mapa con navegación calle por calle hacia Mixquiahuala.',
        actions: [
          { label: '🗺️ Ir a Seguridad Pública Mixquiahuala', type: 'map', centerIndex: 0 },
          { label: '🏛️ Ir a Instancia de la Mujer', type: 'map', centerIndex: 1 },
        ],
        nextChips: [
          '📍 Ver centros en Progreso o Tlahuelilpan',
          '🚶‍♀️ Iniciar trayecto seguro',
          '💬 Hablar con Carol',
        ],
      };
    }

    if (text.includes('progreso')) {
      return {
        riskLevel: 'normal',
        title: '📍 Punto Seguro en Progreso de Obregón',
        text:
          'En Progreso de Obregón puedes acudir a Seguridad Pública y Atención Ciudadana (Zona Centro). El mapa trazará tu ruta en tiempo real.',
        actions: [{ label: '🗺️ Trazar Ruta a Progreso', type: 'map', centerIndex: 2 }],
        nextChips: ['📍 Ver todos los municipios', '🚶‍♀️ Activar Acompáñame'],
      };
    }

    if (text.includes('tlahuelilpan')) {
      return {
        riskLevel: 'normal',
        title: '📍 Punto Seguro en Tlahuelilpan',
        text:
          'En Tlahuelilpan cuentas con el Centro de Salud y Atención Integral sobre Av. Sergio Butrón Casas.',
        actions: [{ label: '🗺️ Trazar Ruta a Tlahuelilpan', type: 'map', centerIndex: 3 }],
        nextChips: ['📍 Ver todos los municipios', '⚖️ Orientación legal'],
      };
    }

    if (text.includes('actopan') || text.includes('ixmiquilpan')) {
      const isActopan = text.includes('actopan');
      return {
        riskLevel: 'normal',
        title: isActopan
          ? '📍 Centro de Justicia para Mujeres (Actopan)'
          : '📍 Módulo Regional de Atención (Ixmiquilpan)',
        text: isActopan
          ? 'El Centro de Justicia para Mujeres en Zona Centro, Actopan, brinda atención integral jurídica, psicológica y médica especializada.'
          : 'En Ixmiquilpan Centro cuentas con el Módulo Regional de Atención y Seguridad sobre carretera federal.',
        actions: [
          {
            label: isActopan ? '🗺️ Trazar Ruta a Actopan' : '🗺️ Trazar Ruta a Ixmiquilpan',
            type: 'map',
            centerIndex: isActopan ? 4 : 5,
          },
        ],
        nextChips: ['⚖️ ¿Qué servicios son gratuitos?', '💬 Hablar con Carol'],
      };
    }

    // 3. TRAYECTO / CAMINAR SOLA / ACOMPÁÑAME
    if (
      text.includes('camino') ||
      text.includes('caminando') ||
      text.includes('sola') ||
      text.includes('noche') ||
      text.includes('ruta') ||
      text.includes('acompaname') ||
      text.includes('trayecto')
    ) {
      return {
        riskLevel: 'warning',
        title: '🛡️ Protocolo de Trayecto Seguro',
        text:
          'Para trasladarte acompañada en todo momento:\n\n' +
          '1. Entra al módulo "Acompáñame" y selecciona tu destino y tiempo estimado.\n' +
          '2. Mantén tu pulsera conectada para monitoreo continuo.\n' +
          '3. Si el temporizador llega a cero y no confirmas tu llegada, WomenSafety notificará automáticamente a tu Red de Confianza.',
        actions: [
          { label: '🧭 Abrir Módulo Acompáñame', type: 'accompani' },
          { label: '🗺️ Ver Puntos Seguros Cercanos', type: 'map' },
        ],
        nextChips: [
          '🚨 ¿Qué pasa si no respondo a tiempo?',
          '💬 Compartir ubicación con Carol',
        ],
      };
    }

    // 4. ORIENTACIÓN LEGAL, LEY OLIMPIA Y DERECHOS
    if (
      text.includes('legal') ||
      text.includes('ley') ||
      text.includes('olimpia') ||
      text.includes('denuncia') ||
      text.includes('digital') ||
      text.includes('fotos') ||
      text.includes('violencia') ||
      text.includes('derecho') ||
      text.includes('psicolog')
    ) {
      return {
        riskLevel: 'normal',
        title: '⚖️ Orientación Jurídica y Derechos',
        text:
          'Tienes derecho a atención gratuita, confidencial y sin revictimización:\n\n' +
          '• Órdenes de Protección: Puedes solicitar medidas inmediatas de alejamiento ante el Ministerio Público o Instancia Municipal.\n' +
          '• Violencia Digital (Ley Olimpia): Difundir contenido íntimo sin consentimiento es un delito. Guarda capturas de pantalla, enlaces y fechas como evidencia.\n' +
          '• Apoyo Psicológico y Jurídico: Disponible en los Centros de Atención Regional y canalización directa con Carol.',
        actions: [
          { label: '🗺️ Centros de Atención Regional', type: 'map' },
          { label: '💬 Orientación con Carol', type: 'carol' },
        ],
        nextChips: [
          '📍 ¿Dónde denunciar en la región?',
          '🚨 Me siento en peligro ahora',
        ],
      };
    }

    // 5. CONTACTO CON CAROL / WHATSAPP
    if (
      text.includes('carol') ||
      text.includes('whatsapp') ||
      text.includes('persona') ||
      text.includes('hablar') ||
      text.includes('orientacion')
    ) {
      return {
        riskLevel: 'normal',
        title: '💬 Canal Directo con Carol',
        text:
          'Puedes iniciar una conversación directa por WhatsApp con Carol para recibir orientación personalizada y acompañamiento.',
        actions: [{ label: '💬 Abrir Chat de WhatsApp con Carol', type: 'carol' }],
        nextChips: [
          '📍 Centros de apoyo en Hidalgo',
          '⚖️ Orientación legal y Ley Olimpia',
        ],
      };
    }

    // 6. RESPUESTA GENERAL INTELIGENTE
    return {
      riskLevel: 'normal',
      title: 'Estoy aquí para apoyarte 💜',
      text:
        'Puedo asistirte de forma inmediata en cualquiera de estas áreas:\n\n' +
        '• Emergencias y protocolos de acción rápida.\n' +
        '• Navegación GPS paso a paso hacia centros en Mixquiahuala, Progreso, Tlahuelilpan, Actopan e Ixmiquilpan.\n' +
        '• Orientación sobre violencia familiar, digital (Ley Olimpia) y órdenes de protección.\n\n' +
        'Selecciona una opción rápida abajo o escríbeme lo que necesitas.',
      actions: [
        { label: '🗺️ Mapa Regional', type: 'map' },
        { label: '💬 WhatsApp Carol', type: 'carol' },
      ],
      nextChips: [
        '🚨 Me siento en peligro ahora',
        '📍 Centros en Mixquiahuala',
        '⚖️ Orientación legal y Ley Olimpia',
      ],
    };
  };

  const handleSendBotMessage = (customPromptText) => {
    const textToSend = typeof customPromptText === 'string' ? customPromptText : botInput;
    if (!textToSend.trim()) return;

    const cleanUserText = textToSend.trim();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'user',
        text: cleanUserText,
        time: nowTime,
      },
    ]);

    if (typeof customPromptText !== 'string') {
      setBotInput('');
    }
    setIsBotTyping(true);

    setTimeout(() => {
      const smartReply = buildIntelligentResponse(cleanUserText);
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          riskLevel: smartReply.riskLevel,
          title: smartReply.title,
          text: smartReply.text,
          actions: smartReply.actions || [],
          time: replyTime,
        },
      ]);

      if (smartReply.nextChips) {
        setQuickReplies(smartReply.nextChips);
      }
      setIsBotTyping(false);
    }, 650);
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

        {/* WHATSAPP DIRECTO CON CAROL + CHATBOT */}
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
            <Text style={styles.gridTitle}>Asistente WomenSafety</Text>
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

          <View style={[styles.mapWrapper, isNavigatingLive && { height: 320 }]}>
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: googleStyleMapHtml }}
              userAgent="WomenSafetyMixquiahualaApp/1.0 (Expo)"
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
      {/* MODAL 2: CHATBOT INTELIGENTE COMPLETO (ASISTENTE WOMENSAFETY)         */}
      {/* ===================================================================== */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={isBotModalVisible}
        onRequestClose={() => setIsBotModalVisible(false)}
      >
        <SafeAreaView style={styles.chatContainer}>
          {/* Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setIsBotModalVisible(false)} style={{ marginRight: 12 }}>
              <Ionicons name="arrow-back" size={24} color="#0F172A" />
            </TouchableOpacity>
            <View style={styles.botAvatar}>
              <Ionicons name="sparkles" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.chatHeaderName}>Asistente WomenSafety</Text>
              <Text style={styles.chatHeaderStatus}>
                {isBotTyping ? 'Analizando consulta...' : '● En línea · Orientación Inteligente 24/7'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleCallPhone('911', 'Emergencias 911')}
              style={styles.sosHeaderBadge}
            >
              <Text style={styles.sosHeaderBadgeText}>SOS 911</Text>
            </TouchableOpacity>
          </View>

          {/* Chips dinámicos */}
          <View style={styles.quickPromptsRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {quickReplies.map((prompt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickChip}
                  onPress={() => handleSendBotMessage(prompt)}
                >
                  <Text style={styles.quickChipText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Lista de mensajes */}
          <ScrollView
            ref={scrollViewRef}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            style={styles.messagesList}
            contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          >
            {messages.map((msg) => {
              const isHighRisk = msg.riskLevel === 'high';
              const isWarning = msg.riskLevel === 'warning';

              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageBubble,
                    msg.sender === 'user' ? styles.userBubble : styles.botBubble,
                    msg.sender === 'bot' && isHighRisk && styles.botHighRiskBubble,
                    msg.sender === 'bot' && isWarning && styles.botWarningBubble,
                  ]}
                >
                  {msg.sender === 'bot' && msg.title ? (
                    <Text
                      style={[
                        styles.botMsgTitle,
                        isHighRisk && { color: '#C5221F' },
                        isWarning && { color: '#B45309' },
                      ]}
                    >
                      {msg.title}
                    </Text>
                  ) : null}

                  <Text
                    style={[
                      styles.messageText,
                      msg.sender === 'user' ? styles.userMessageText : styles.botMessageText,
                    ]}
                  >
                    {msg.text}
                  </Text>

                  {/* Botones interactivos dentro del mensaje del bot */}
                  {msg.sender === 'bot' && msg.actions && msg.actions.length > 0 && (
                    <View style={styles.botActionsList}>
                      {msg.actions.map((act, index) => (
                        <TouchableOpacity
                          key={index}
                          activeOpacity={0.8}
                          onPress={() => handleBotAction(act)}
                          style={[
                            styles.botActionBtn,
                            act.type === 'call911' && { backgroundColor: '#C5221F' },
                            act.type === 'carol' && { backgroundColor: '#15803D' },
                          ]}
                        >
                          <Text style={styles.botActionBtnText}>{act.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <Text
                    style={[
                      styles.messageTime,
                      msg.sender === 'user' ? { color: '#F3E8F0' } : { color: '#94A3B8' },
                    ]}
                  >
                    {msg.time}
                  </Text>
                </View>
              );
            })}

            {isBotTyping && (
              <View style={[styles.messageBubble, styles.botBubble, { paddingVertical: 10 }]}>
                <Text style={styles.typingIndicatorText}>
                  Asistente WomenSafety está escribiendo...
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Barra de escritura */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.chatInputBar}>
              <TextInput
                style={styles.chatTextInput}
                placeholder="Escribe tu duda, municipio o situación..."
                placeholderTextColor="#94A3B8"
                value={botInput}
                onChangeText={setBotInput}
                onSubmitEditing={() => handleSendBotMessage()}
              />
              <TouchableOpacity style={styles.chatSendBtn} onPress={() => handleSendBotMessage()}>
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ===================================================================== */}
      {/* TAB BAR INFERIOR LIMPIA                                               */}
      {/* ===================================================================== */}
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
  title: { fontSize: 28, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4, marginBottom: 20 },

  btn911: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#C5221F',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },
  leftRow: { flexDirection: 'row', alignItems: 'center' },
  btn911Text: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  badge24h: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  sectionHeader: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 12, marginBottom: 12 },

  wideFeatureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gridContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F3E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 10,
  },
  gridTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  gridSub: { fontSize: 12, color: '#64748B', lineHeight: 16 },

  fullModalContainer: { flex: 1, backgroundColor: '#F9F8F6' },
  mapModalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFFFFF' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 12, color: '#64748B', marginTop: 2 },

  filterScroll: { maxHeight: 48, paddingHorizontal: 20, marginVertical: 10 },
  filterChip: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  filterChipActive: { backgroundColor: '#521841', borderColor: '#521841' },
  filterChipText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  filterChipTextActive: { color: '#FFFFFF' },

  gmapsTurnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D7A68',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 16,
    padding: 14,
  },
  turnIconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  turnDistanceText: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  turnInstructionText: { fontSize: 13, color: '#E6F4EA', fontWeight: '600', marginTop: 2 },

  mapWrapper: { height: 240, marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#CBD5E1', marginBottom: 12 },
  routeLoaderBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  routeLoaderText: { fontSize: 12, fontWeight: '700', color: '#1A73E8', marginLeft: 6 },

  liveNavCard: { backgroundColor: '#FFFFFF', marginHorizontal: 20, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  liveNavCardActive: { borderColor: '#1A73E8', borderWidth: 1.5 },
  liveNavHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E6F4EA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  greenDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#0D7A68', marginRight: 6 },
  liveBadgeText: { fontSize: 10, fontWeight: '800', color: '#0D7A68' },
  distanceBadge: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  selectedCenterName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  selectedCenterAddress: { fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 12 },

  startRouteBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#521841', borderRadius: 14, paddingVertical: 13 },
  startRouteBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  activeRouteActions: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelRouteBtn: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginRight: 8 },
  cancelRouteBtnText: { color: '#475569', fontSize: 14, fontWeight: '700' },
  arrivedBtn: { flex: 2, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D7A68', borderRadius: 14, paddingVertical: 12 },
  arrivedBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  centerListItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  centerListItemSelected: { borderColor: '#521841', borderWidth: 1.5, backgroundColor: '#FDF8FB' },
  centerIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F3E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  munTag: { fontSize: 11, fontWeight: '800', color: '#521841', textTransform: 'uppercase' },
  centerName: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  centerAddress: { fontSize: 12, color: '#64748B', marginTop: 2 },

  chatContainer: { flex: 1, backgroundColor: '#F9F8F6' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  botAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#521841', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  chatHeaderName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  chatHeaderStatus: { fontSize: 12, color: '#0D7A68', fontWeight: '600' },
  sosHeaderBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  sosHeaderBadgeText: { color: '#C5221F', fontWeight: '800', fontSize: 12 },
  quickPromptsRow: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  quickChip: { backgroundColor: '#F3E8F0', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, marginRight: 8 },
  quickChipText: { fontSize: 12, fontWeight: '700', color: '#521841' },
  messagesList: { flex: 1 },
  messageBubble: { maxWidth: '84%', borderRadius: 18, padding: 14, marginBottom: 10 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#521841' },
  botBubble: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  botHighRiskBubble: { borderColor: '#C5221F', borderWidth: 1.5, backgroundColor: '#FEF2F2' },
  botWarningBubble: { borderColor: '#D97706', borderWidth: 1.5, backgroundColor: '#FFFBEB' },
  botMsgTitle: { fontSize: 13, fontWeight: '900', color: '#521841', marginBottom: 6 },
  messageText: { fontSize: 14, lineHeight: 20 },
  userMessageText: { color: '#FFFFFF' },
  botMessageText: { color: '#0F172A' },
  botActionsList: { marginTop: 10, gap: 8 },
  botActionBtn: { backgroundColor: '#521841', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center' },
  botActionBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  typingIndicatorText: { fontSize: 13, color: '#64748B', fontStyle: 'italic' },
  messageTime: { fontSize: 10, marginTop: 6, alignSelf: 'flex-end' },
  chatInputBar: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  chatTextInput: { flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#0F172A', marginRight: 10 },
  chatSendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#521841', justifyContent: 'center', alignItems: 'center' },

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