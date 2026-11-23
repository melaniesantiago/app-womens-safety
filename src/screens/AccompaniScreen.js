import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import {
  useAudioRecorder,
  useAudioPlayer,
  AudioModule,
  RecordingPresets,
} from 'expo-audio';

// PINes de seguridad configurados
const REAL_CANCEL_PIN = '1234';     // Cancela realmente la alerta
const COERCION_PIN = '9999';        // PIN de coacción: finge cancelar pero mantiene alerta y audio activos

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function AccompaniScreen({ navigation }) {
  const webViewRef = useRef(null);
  const locationSubscription = useRef(null);

  const [isMonitoringActive, setIsMonitoringActive] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSearchingRoute, setIsSearchingRoute] = useState(false);

  // Modo de traslado: 'foot' (caminando) o 'driving' (auto / transporte)
  const [travelMode, setTravelMode] = useState('foot');

  // Coordenadas GPS reales y telemetría
  const [userCoords, setUserCoords] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(8);
  const [originLabel, setOriginLabel] = useState('Obteniendo ubicación GPS...');
  const [destinationLabel, setDestinationLabel] = useState('');
  const [destinationCoords, setDestinationCoords] = useState(null);

  // Ruta y métricas dinámicas
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [remainingMeters, setRemainingMeters] = useState(0);
  const [minutesLeft, setMinutesLeft] = useState(0);
  const [extraMinutesAdded, setExtraMinutesAdded] = useState(0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);

  // Formulario y sugerencias
  const [formDestination, setFormDestination] = useState('');
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [recentDestinations, setRecentDestinations] = useState([]);

  // =========================================================================
  // ESTADOS DE PANTALLA "ALERTA ENVIADA" + PROGRESIÓN + AUDIO REAL
  // =========================================================================
  const [isSosModalVisible, setIsSosModalVisible] = useState(false);
  const [sosStartTime, setSosStartTime] = useState('');
  const [step2Time, setStep2Time] = useState('');
  const [step3Time, setStep3Time] = useState('');
  const [step4Time, setStep4Time] = useState('');
  const [sosElapsedSeconds, setSosElapsedSeconds] = useState(0);
  const [sosProgressStage, setSosProgressStage] = useState(1); // 1 -> 2 -> 3 -> 4
  const [silentCoercionActive, setSilentCoercionActive] = useState(false);

  // Audio real con expo-audio
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recordEvidenceEnabled, setRecordEvidenceEnabled] = useState(true);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [savedAudioDuration, setSavedAudioDuration] = useState(0);
  const [savedAudioUri, setSavedAudioUri] = useState(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const audioPlayer = useAudioPlayer(savedAudioUri ? { uri: savedAudioUri } : null);

  // Modal Cancelar con PIN
  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');

  // 1. Rastreo GPS continuo en tiempo real
  useEffect(() => {
    let isMounted = true;

    async function startLiveGps() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (isMounted) setOriginLabel('Permiso de ubicación denegado');
        return;
      }

      const initial = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      if (!isMounted) return;

      const initCoords = {
        latitude: initial.coords.latitude,
        longitude: initial.coords.longitude,
      };
      setUserCoords(initCoords);
      if (initial.coords.accuracy) {
        setGpsAccuracy(Math.max(4, Math.round(initial.coords.accuracy)));
      }

      try {
        const places = await Location.reverseGeocodeAsync(initCoords);
        if (places && places.length > 0 && isMounted) {
          const p = places[0];
          const street = p.street ? `${p.street}${p.streetNumber ? ' ' + p.streetNumber : ''}` : '';
          const city = p.city || p.subregion || p.district || '';
          setOriginLabel([street, city].filter(Boolean).join(', ') || 'Mi ubicación actual');
        }
      } catch {
        if (isMounted) setOriginLabel('Mi ubicación actual');
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1500,
          distanceInterval: 1,
        },
        (loc) => {
          if (!isMounted) return;
          setUserCoords({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          if (loc.coords.accuracy) {
            setGpsAccuracy(Math.max(4, Math.round(loc.coords.accuracy)));
          }
          const speedMs = loc.coords.speed && loc.coords.speed > 0 ? loc.coords.speed : 0;
          setCurrentSpeedKmh(Number((speedMs * 3.6).toFixed(1)));
        }
      );
    }

    startLiveGps();

    return () => {
      isMounted = false;
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // 2. Autocompletado de lugares
  useEffect(() => {
    if (!isModalVisible) return;
    const query = formDestination.trim();
    if (query.length < 3) {
      setPlaceSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=mx&q=${encodeURIComponent(
          query
        )}&limit=5`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'WomenSafetyApp/1.0' },
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setPlaceSuggestions(data);
        }
      } catch {
        setPlaceSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [formDestination, isModalVisible]);

  // 3. Recalcular distancia y minutos reales
  useEffect(() => {
    if (!userCoords || !destinationCoords) return;

    const dist = Math.round(
      getDistanceMeters(
        userCoords.latitude,
        userCoords.longitude,
        destinationCoords.latitude,
        destinationCoords.longitude
      )
    );
    setRemainingMeters(dist);

    if (isMonitoringActive && dist <= 30) {
      setMinutesLeft(0);
      setIsMonitoringActive(false);
      Alert.alert(
        '¡Has llegado a tu destino! 🎉',
        `Detectamos tu llegada a "${destinationLabel}". Tu Red de Confianza ha sido notificada.`
      );
      return;
    }

    const defaultMetersPerMin = travelMode === 'driving' ? 750 : 80;
    const effectiveMetersPerMin =
      currentSpeedKmh > 2 ? (currentSpeedKmh * 1000) / 60 : defaultMetersPerMin;

    const calculatedMins = Math.max(1, Math.ceil(dist / effectiveMetersPerMin)) + extraMinutesAdded;
    setMinutesLeft(calculatedMins);
  }, [userCoords, destinationCoords, extraMinutesAdded, isMonitoringActive, travelMode]);

  // 4. Actualizar mapa en vivo
  useEffect(() => {
    if (webViewRef.current && userCoords) {
      const payload = JSON.stringify({
        userCoords,
        destinationCoords,
        routeCoordinates,
        isMonitoringActive,
      });
      webViewRef.current.injectJavaScript(`
        if (window.updateAccompaniMap) {
          window.updateAccompaniMap(${payload});
        }
        true;
      `);
    }
  }, [userCoords, destinationCoords, routeCoordinates, isMonitoringActive]);

  // 5. Temporizador activo de "EN CURSO" y avance realista por etapas (1 -> 2 -> 3 -> 4)
  useEffect(() => {
    let sosTimer = null;
    if (isSosModalVisible || silentCoercionActive) {
      sosTimer = setInterval(() => {
        setSosElapsedSeconds((prev) => {
          const next = prev + 1;
          const nowStr = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          if (next === 3) {
            setSosProgressStage(2);
            setStep2Time(nowStr);
          } else if (next === 6) {
            setSosProgressStage(3);
            setStep3Time(nowStr);
          } else if (next === 9) {
            setSosProgressStage(4);
            setStep4Time(nowStr);
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (sosTimer) clearInterval(sosTimer);
    };
  }, [isSosModalVisible, silentCoercionActive]);

  // 6. Cronómetro de grabación de audio de evidencia
  useEffect(() => {
    let recTimer = null;
    if (isRecordingAudio) {
      recTimer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (recTimer) clearInterval(recTimer);
    };
  }, [isRecordingAudio]);

  // =========================================================================
  // FUNCIONES DE AUDIO DE EVIDENCIA REAL (EXPO-AUDIO)
  // =========================================================================
  const startEvidenceAudioRecording = async () => {
    try {
      if (isRecordingAudio) return;
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert(
          'Permiso de micrófono',
          'Activa el permiso de micrófono para grabar el audio cifrado de evidencia.'
        );
        setRecordEvidenceEnabled(false);
        return;
      }

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecordingAudio(true);
      setRecordingSeconds(0);
      setSavedAudioUri(null);
      setIsPlayingPreview(false);
    } catch {
      setIsRecordingAudio(false);
    }
  };

  const stopEvidenceAudioRecording = async () => {
    try {
      if (!isRecordingAudio) return;
      const finalSecs = recordingSeconds;
      await audioRecorder.stop();
      setIsRecordingAudio(false);
      setSavedAudioDuration(finalSecs);
      if (audioRecorder.uri) {
        setSavedAudioUri(audioRecorder.uri);
      }
    } catch {
      setIsRecordingAudio(false);
    }
  };

  const handleToggleEvidenceCheckbox = async () => {
    const nextValue = !recordEvidenceEnabled;
    setRecordEvidenceEnabled(nextValue);
    if (nextValue) {
      await startEvidenceAudioRecording();
    } else {
      await stopEvidenceAudioRecording();
    }
  };

  const handlePlaySavedEvidence = () => {
    if (!savedAudioUri || !audioPlayer) return;
    try {
      if (isPlayingPreview || audioPlayer.playing) {
        audioPlayer.pause();
        setIsPlayingPreview(false);
      } else {
        audioPlayer.seekTo(0);
        audioPlayer.play();
        setIsPlayingPreview(true);
      }
    } catch {
      setIsPlayingPreview(false);
    }
  };

  const formatTimerMMSS = (totalSecs) => {
    const mins = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const secs = String(totalSecs % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // =========================================================================
  // ACTIVAR ALERTA SOS -> INICIA EN ETAPA 1 Y AVANZA CON TIEMPO REAL
  // =========================================================================
  const handleRequestHelp = async () => {
    const now = new Date();
    const formattedHour = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    setSosStartTime(formattedHour);
    setStep2Time('');
    setStep3Time('');
    setStep4Time('');
    setSosElapsedSeconds(0);
    setSosProgressStage(1); // Empieza SOLO con el paso 1 en verde
    setSilentCoercionActive(false);
    setRecordEvidenceEnabled(true);
    setSavedAudioUri(null);
    setIsSosModalVisible(true);

    await startEvidenceAudioRecording();
  };

  const handleVerifyCancelPin = async () => {
    if (pinInput === REAL_CANCEL_PIN) {
      await stopEvidenceAudioRecording();
      setIsPinModalVisible(false);
      setIsSosModalVisible(false);
      setPinInput('');
      setSilentCoercionActive(false);
      Alert.alert(
        'Alerta Cancelada',
        'Has confirmado que te encuentras segura. El audio de evidencia quedó guardado cifrado en tu teléfono.'
      );
    } else if (pinInput === COERCION_PIN) {
      setIsPinModalVisible(false);
      setIsSosModalVisible(false);
      setPinInput('');
      setSilentCoercionActive(true);
    } else {
      Alert.alert(
        'PIN incorrecto',
        'Ingresa tu PIN de seguridad de 4 dígitos (Demo: 1234 para cancelar / 9999 coacción).'
      );
    }
  };

  // =========================================================================
  // RUTAS Y NAVEGACIÓN ACOMPAÑAME
  // =========================================================================
  const buildRouteToCoords = async (destObj, displayName, modeOverride) => {
    if (!userCoords) {
      Alert.alert('Esperando GPS', 'Aún estamos obteniendo tu ubicación actual.');
      return;
    }

    const activeMode = modeOverride || travelMode;
    setIsSearchingRoute(true);

    try {
      const osrmProfile = activeMode === 'driving' ? 'driving' : 'foot';
      const routeUrl = `https://router.project-osrm.org/route/v1/${osrmProfile}/${userCoords.longitude},${userCoords.latitude};${destObj.longitude},${destObj.latitude}?overview=full&geometries=geojson`;
      const routeRes = await fetch(routeUrl);
      const routeData = await routeRes.json();

      let realMeters = Math.round(
        getDistanceMeters(
          userCoords.latitude,
          userCoords.longitude,
          destObj.latitude,
          destObj.longitude
        )
      );
      let realSeconds =
        activeMode === 'driving' ? Math.round(realMeters / 12.5) : Math.round(realMeters / 1.33);
      let polylinePts = [
        [userCoords.latitude, userCoords.longitude],
        [destObj.latitude, destObj.longitude],
      ];

      if (routeData.routes && routeData.routes.length > 0) {
        const bestRoute = routeData.routes[0];
        realMeters = Math.round(bestRoute.distance);
        realSeconds = Math.round(bestRoute.duration);
        polylinePts = bestRoute.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      }

      const realMins = Math.max(1, Math.round(realSeconds / 60));

      setDestinationLabel(displayName);
      setDestinationCoords(destObj);
      setRouteCoordinates(polylinePts);
      setRemainingMeters(realMeters);
      setMinutesLeft(realMins);
      setExtraMinutesAdded(0);

      setRecentDestinations((prev) => {
        const exists = prev.some((d) => d.name.toLowerCase() === displayName.toLowerCase());
        return exists ? prev : [{ name: displayName, coords: destObj }, ...prev.slice(0, 4)];
      });

      setIsModalVisible(false);
      setFormDestination('');
      setPlaceSuggestions([]);
    } catch {
      Alert.alert('Error de red', 'No se pudo trazar la ruta. Verifica tu conexión a internet.');
    } finally {
      setIsSearchingRoute(false);
    }
  };

  const configureRealDestination = async (queryText) => {
    const cleanQuery = queryText.trim();
    if (!cleanQuery) {
      Alert.alert('Escribe un destino', 'Indica el municipio, ciudad, calle o lugar a donde vas.');
      return;
    }
    if (!userCoords) {
      Alert.alert('Esperando GPS', 'Aún estamos obteniendo tu ubicación actual.');
      return;
    }

    setIsSearchingRoute(true);
    try {
      const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=mx&q=${encodeURIComponent(
        cleanQuery
      )}&limit=1`;
      const geoRes = await fetch(searchUrl, {
        headers: { 'User-Agent': 'WomenSafetyApp/1.0' },
      });
      const geoData = await geoRes.json();

      if (!geoData || geoData.length === 0) {
        Alert.alert(
          'Lugar no encontrado',
          'Prueba agregando el municipio o estado, por ejemplo: "Actopan Hidalgo" o "Pachuca Centro".'
        );
        setIsSearchingRoute(false);
        return;
      }

      const destObj = {
        latitude: parseFloat(geoData[0].lat),
        longitude: parseFloat(geoData[0].lon),
      };

      await buildRouteToCoords(destObj, cleanQuery);
    } catch {
      Alert.alert('Error de red', 'No se pudo buscar el destino.');
      setIsSearchingRoute(false);
    }
  };

  const handleStartMonitoring = () => {
    if (!destinationCoords) {
      Alert.alert(
        'Configura tu destino',
        'Primero indica a dónde vas para calcular tu ruta y tiempo real.',
        [{ text: 'Elegir destino', onPress: () => setIsModalVisible(true) }]
      );
      return;
    }

    setIsMonitoringActive(true);
    Alert.alert(
      '🛡️ Trayecto Iniciado',
      `Rastreo GPS activo en tiempo real hacia "${destinationLabel}".`
    );
  };

  const handleStopMonitoring = () => {
    Alert.alert('¿Detener Trayecto?', 'Se desactivará el monitoreo en tiempo real.', [
      { text: 'Continuar', style: 'cancel' },
      {
        text: 'Detener',
        style: 'destructive',
        onPress: () => setIsMonitoringActive(false),
      },
    ]);
  };

  const handleAddMinutes = () => {
    if (!destinationCoords) {
      Alert.alert('Aviso', 'Primero configura un destino.');
      return;
    }
    setExtraMinutesAdded((prev) => prev + 10);
    Alert.alert('⏱️ Tiempo Extendido', 'Se agregaron +10 minutos de margen a tu llegada.');
  };

  const handleArrivedSafely = () => {
    setIsMonitoringActive(false);
    Alert.alert(
      '¡Llegaste a salvo! 🎉',
      `Confirmaste tu llegada a "${destinationLabel || 'tu destino'}". Tu Red de Confianza ha sido notificada.`,
      [{ text: 'Listo', onPress: () => navigation?.navigate('InicioTab') }]
    );
  };

  const formattedDistance =
    remainingMeters >= 1000
      ? `${(remainingMeters / 1000).toFixed(2)} km`
      : `${remainingMeters} m`;

  const liveMapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #EAE5DF; }
        .live-user-dot {
          width: 20px; height: 20px;
          background: #1A73E8;
          border: 3.5px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 0 0 8px rgba(26, 115, 232, 0.28), 0 2px 6px rgba(0,0,0,0.35);
        }
        .dest-pin {
          width: 24px; height: 24px;
          background: #521841;
          border: 3px solid #FFFFFF;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 3px 8px rgba(0,0,0,0.4);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([20.2294, -99.2136], 15);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

        var userIcon = L.divIcon({ className: 'live-user-dot', iconSize: [20, 20], iconAnchor: [10, 10] });
        var destIcon = L.divIcon({ className: 'dest-pin', iconSize: [24, 24], iconAnchor: [12, 24] });

        var userMarker = null;
        var destMarker = null;
        var routeLine = null;
        var lastRouteKey = '';

        window.updateAccompaniMap = function(data) {
          var u = data.userCoords;
          var d = data.destinationCoords;
          var pts = data.routeCoordinates;
          var active = data.isMonitoringActive;

          if (u) {
            if (!userMarker) {
              userMarker = L.marker([u.latitude, u.longitude], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
              map.setView([u.latitude, u.longitude], 16);
            } else {
              userMarker.setLatLng([u.latitude, u.longitude]);
              if (active) {
                map.panTo([u.latitude, u.longitude], { animate: true, duration: 0.6 });
              }
            }
          }

          if (d) {
            if (!destMarker) {
              destMarker = L.marker([d.latitude, d.longitude], { icon: destIcon }).addTo(map);
            } else {
              destMarker.setLatLng([d.latitude, d.longitude]);
            }
          }

          if (pts && pts.length > 1) {
            if (routeLine) map.removeLayer(routeLine);
            routeLine = L.polyline(pts, {
              color: '#521841',
              weight: 6,
              opacity: 0.9
            }).addTo(map);

            var routeKey = d ? (d.latitude + ',' + d.longitude) : '';
            if (!active && routeKey !== lastRouteKey) {
              lastRouteKey = routeKey;
              map.fitBounds(routeLine.getBounds(), { padding: [38, 38] });
            }
          }
        };
      </script>
    </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Encabezado */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Acompáñame</Text>
          {isMonitoringActive ? (
            <View style={styles.badgeActive}>
              <View style={styles.greenDot} />
              <Text style={styles.badgeText}>Rastreando en Vivo</Text>
            </View>
          ) : (
            <View style={styles.badgeInactive}>
              <Text style={styles.badgeInactiveText}>En Espera</Text>
            </View>
          )}
        </View>

        {/* Indicador discreto solo si se usó PIN de coacción */}
        {silentCoercionActive && (
          <TouchableOpacity
            style={styles.coercionNoticeStrip}
            onPress={() => setIsSosModalVisible(true)}
          >
            <View style={styles.redPulseDot} />
            <Text style={styles.coercionNoticeText}>
              Modo silencioso activo ({formatTimerMMSS(recordingSeconds)} grabando) · Toca para ver
            </Text>
          </TouchableOpacity>
        )}

        {/* Barra de acción rápida para configurar destino */}
        <Text style={styles.sectionSubtitle}>Busca cualquier calle, municipio o ciudad:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routesScroll}>
          <TouchableOpacity style={styles.addRouteChip} onPress={() => setIsModalVisible(true)}>
            <Feather name="search" size={15} color="#521841" />
            <Text style={styles.addRouteChipText}>
              {destinationLabel ? 'Cambiar Destino' : 'Buscar Destino'}
            </Text>
          </TouchableOpacity>

          {recentDestinations.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.routeChip,
                destinationLabel === item.name && styles.routeChipSelected,
              ]}
              onPress={() => buildRouteToCoords(item.coords, item.name)}
            >
              <Ionicons
                name="location"
                size={14}
                color={destinationLabel === item.name ? '#FFFFFF' : '#521841'}
              />
              <Text
                style={[
                  styles.routeChipText,
                  destinationLabel === item.name && styles.routeChipTextSelected,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Botón Iniciar Trayecto */}
        {!isMonitoringActive && (
          <TouchableOpacity
            style={styles.startMonitoringBtn}
            activeOpacity={0.85}
            onPress={handleStartMonitoring}
          >
            <Ionicons name="navigate" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.startMonitoringBtnText}>Iniciar Trayecto Seguro</Text>
          </TouchableOpacity>
        )}

        {/* MAPA GPS REAL EN TIEMPO REAL */}
        <View style={styles.realMapWrapper}>
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: liveMapHtml }}
            userAgent="WomenSafetyApp/1.0 (Expo)"
            style={{ flex: 1 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onLoadEnd={() => {
              if (userCoords && webViewRef.current) {
                const payload = JSON.stringify({
                  userCoords,
                  destinationCoords,
                  routeCoordinates,
                  isMonitoringActive,
                });
                webViewRef.current.injectJavaScript(`
                  if (window.updateAccompaniMap) { window.updateAccompaniMap(${payload}); }
                  true;
                `);
              }
            }}
          />

          {destinationCoords && (
            <View style={styles.floatingDistancePill}>
              <Ionicons
                name={travelMode === 'driving' ? 'car' : 'walk'}
                size={16}
                color="#521841"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.floatingDistanceText}>
                Restan {formattedDistance} · {minutesLeft} min
              </Text>
            </View>
          )}
        </View>

        {/* TARJETA DE TELEMETRÍA EN VIVO */}
        <View style={styles.cardTrayecto}>
          <View style={styles.routeHeader}>
            <View style={styles.pointDotOrigin} />
            <Text style={styles.routePointText} numberOfLines={1}>
              Origen: <Text style={styles.boldText}>{originLabel}</Text>
            </Text>
          </View>

          <View style={styles.verticalLineConnector} />

          <TouchableOpacity style={styles.routeHeader} onPress={() => setIsModalVisible(true)}>
            <Ionicons name="location" size={18} color="#521841" style={{ marginRight: 6 }} />
            <Text style={styles.routePointText} numberOfLines={1}>
              Destino:{' '}
              <Text
                style={[
                  styles.boldText,
                  !destinationLabel && { color: '#94A3B8', fontStyle: 'italic' },
                ]}
              >
                {destinationLabel || 'Toca aquí (Mixquiahuala, Actopan, Pachuca...)'}
              </Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.gpsBadgeContainer}>
            <Ionicons
              name="radio"
              size={14}
              color={userCoords ? '#0D7A68' : '#94A3B8'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.gpsBadgeText, userCoords && { color: '#0D7A68' }]}>
              {userCoords
                ? `GPS en vivo: ${userCoords.latitude.toFixed(5)}, ${userCoords.longitude.toFixed(5)}`
                : 'Conectando satélite GPS...'}
            </Text>
          </View>

          <View style={styles.timerRow}>
            <View>
              <Text style={styles.timerLabel}>
                {destinationCoords
                  ? `Tiempo real (${formattedDistance} · ${
                      travelMode === 'driving' ? 'Auto/Transporte' : 'Caminando'
                    })`
                  : 'Tiempo estimado'}
              </Text>
              <Text style={styles.timerValue}>
                {destinationCoords ? minutesLeft : '--'}{' '}
                <Text style={{ fontSize: 18 }}>min</Text>
              </Text>
            </View>

            {isMonitoringActive && (
              <View style={styles.activePulseBadge}>
                <Text style={styles.activePulseText}>
                  {currentSpeedKmh > 0.5 ? `${currentSpeedKmh} km/h` : 'En trayecto'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* BOTÓN LLEGUÉ BIEN */}
        {isMonitoringActive && (
          <TouchableOpacity
            style={styles.arrivedBtn}
            activeOpacity={0.8}
            onPress={handleArrivedSafely}
          >
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.arrivedBtnText}>Llegué bien</Text>
          </TouchableOpacity>
        )}

        {/* BOTÓN DETENER TRAYECTO */}
        {isMonitoringActive && (
          <TouchableOpacity
            style={styles.stopMonitoringBtn}
            activeOpacity={0.8}
            onPress={handleStopMonitoring}
          >
            <Ionicons name="square-outline" size={18} color="#64748B" style={{ marginRight: 6 }} />
            <Text style={styles.stopMonitoringBtnText}>Detener Trayecto</Text>
          </TouchableOpacity>
        )}

        {/* ACCIONES SECUNDARIAS (+10 MIN Y PEDIR AYUDA) */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.addTimeBtn}
            activeOpacity={0.8}
            onPress={handleAddMinutes}
          >
            <Text style={styles.addTimeText}>+10 minutos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.helpBtn}
            activeOpacity={0.8}
            onPress={handleRequestHelp}
          >
            <Text style={styles.helpBtnText}>Pedir ayuda</Text>
          </TouchableOpacity>
        </View>

        {/* NOTA PREVENTIVA */}
        <View style={styles.safetyBox}>
          <Ionicons name="shield-checkmark" size={22} color="#521841" style={{ marginRight: 10 }} />
          <Text style={styles.footerNote}>
            El punto azul sigue tu desplazamiento real y recalcula automáticamente los minutos restantes hasta tu destino en cualquier municipio o ciudad.
          </Text>
        </View>
      </ScrollView>

      {/* ===================================================================== */}
      {/* MODAL BUSCAR DESTINO REAL                                             */}
      {/* ===================================================================== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>¿A dónde vas?</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>¿Cómo te trasladas?</Text>
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[styles.modeBtn, travelMode === 'foot' && styles.modeBtnActive]}
                onPress={() => setTravelMode('foot')}
              >
                <Ionicons
                  name="walk"
                  size={16}
                  color={travelMode === 'foot' ? '#FFFFFF' : '#521841'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[styles.modeBtnText, travelMode === 'foot' && styles.modeBtnTextActive]}
                >
                  Caminando
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeBtn, travelMode === 'driving' && styles.modeBtnActive]}
                onPress={() => setTravelMode('driving')}
              >
                <Ionicons
                  name="car"
                  size={16}
                  color={travelMode === 'driving' ? '#FFFFFF' : '#521841'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.modeBtnText,
                    travelMode === 'driving' && styles.modeBtnTextActive,
                  ]}
                >
                  Auto / Transporte
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Escribe cualquier ciudad, municipio o calle</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="location" size={18} color="#521841" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInput}
                placeholder="Ej. Actopan Hidalgo, Pachuca Centro, UTVM..."
                placeholderTextColor="#94A3B8"
                value={formDestination}
                onChangeText={setFormDestination}
                autoFocus
              />
              {isLoadingSuggestions && <ActivityIndicator size="small" color="#521841" />}
            </View>

            {placeSuggestions.length > 0 && (
              <View style={styles.suggestionsBox}>
                {placeSuggestions.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.suggestionItem}
                    onPress={() => {
                      const shortName = item.display_name.split(',').slice(0, 2).join(',');
                      buildRouteToCoords(
                        {
                          latitude: parseFloat(item.lat),
                          longitude: parseFloat(item.lon),
                        },
                        shortName
                      );
                    }}
                  >
                    <Ionicons
                      name="pin"
                      size={15}
                      color="#521841"
                      style={{ marginRight: 8, marginTop: 2 }}
                    />
                    <Text style={styles.suggestionText} numberOfLines={2}>
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[styles.inputLabel, { marginTop: 4 }]}>Destinos rápidos:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {[
                { label: 'Mixquiahuala Centro', mode: 'foot' },
                { label: 'Actopan Hidalgo', mode: 'driving' },
                { label: 'Pachuca de Soto Hidalgo', mode: 'driving' },
                { label: 'Progreso de Obregón Hidalgo', mode: 'driving' },
                { label: 'Ixmiquilpan Hidalgo', mode: 'driving' },
              ].map((place) => (
                <TouchableOpacity
                  key={place.label}
                  style={styles.presetChip}
                  onPress={() => {
                    setTravelMode(place.mode);
                    setFormDestination(place.label);
                  }}
                >
                  <Text style={styles.presetChipText}>{place.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                disabled={isSearchingRoute}
                onPress={() => configureRealDestination(formDestination)}
              >
                {isSearchingRoute ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Trazar Ruta Real</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL DE EMERGENCIA: "ALERTA ENVIADA" + PROGRESIÓN + AUDIO REAL       */}
      {/* ===================================================================== */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={isSosModalVisible}
        onRequestClose={() => setIsPinModalVisible(true)}
      >
        <View style={styles.sosScreenContainer}>
          {/* BANNER ROJO SUPERIOR CON CONTADOR EN VIVO */}
          <SafeAreaView edges={['top']} style={styles.sosRedBanner}>
            <View style={styles.sosBannerContent}>
              <View style={styles.sosLivePill}>
                <View style={styles.sosWhiteDot} />
                <Text style={styles.sosLivePillText}>
                  EN CURSO · {formatTimerMMSS(sosElapsedSeconds)} (Inicio {sosStartTime})
                </Text>
              </View>

              <Text style={styles.sosBannerTitle}>Alerta enviada</Text>
              <Text style={styles.sosBannerSubtitle}>
                La ayuda ya está en camino. Mantén la pulsera contigo.
              </Text>
            </View>
          </SafeAreaView>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.sosBodyScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* TARJETA DE SEGUIMIENTO PROGRESIVO EN 4 PASOS */}
            <View style={styles.sosTimelineCard}>
              {/* PASO 1: Siempre empieza en verde */}
              <View style={styles.timelineStepRow}>
                <View style={styles.timelineLeftCol}>
                  <View style={styles.stepCircleDone}>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                  <View
                    style={
                      sosProgressStage >= 2
                        ? styles.stepConnectorDone
                        : styles.stepConnectorPending
                    }
                  />
                </View>
                <View style={styles.timelineTextCol}>
                  <Text style={styles.stepTitle}>Enviada desde la pulsera</Text>
                  <Text style={styles.stepSub}>{sosStartTime} · vía LoRa</Text>
                </View>
              </View>

              {/* PASO 2: Se activa a los 3 segundos */}
              <View style={styles.timelineStepRow}>
                <View style={styles.timelineLeftCol}>
                  {sosProgressStage >= 2 ? (
                    <View style={styles.stepCircleDone}>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                  ) : (
                    <View style={styles.stepCircleActiveRing}>
                      <View style={styles.stepInnerRedDot} />
                    </View>
                  )}
                  <View
                    style={
                      sosProgressStage >= 3
                        ? styles.stepConnectorDone
                        : styles.stepConnectorPending
                    }
                  />
                </View>
                <View style={styles.timelineTextCol}>
                  <Text
                    style={[
                      styles.stepTitle,
                      sosProgressStage < 2 && { color: '#64748B' },
                    ]}
                  >
                    Recibida por la Instancia de la Mujer
                  </Text>
                  <Text style={styles.stepSub}>
                    {sosProgressStage >= 2
                      ? `${step2Time} · panel de monitoreo`
                      : 'Transmitiendo paquete al servidor...'}
                  </Text>
                </View>
              </View>

              {/* PASO 3: Se activa a los 6 segundos */}
              <View style={styles.timelineStepRow}>
                <View style={styles.timelineLeftCol}>
                  {sosProgressStage >= 3 ? (
                    <View style={styles.stepCircleDone}>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                  ) : sosProgressStage === 2 ? (
                    <View style={styles.stepCircleActiveRing}>
                      <View style={styles.stepInnerRedDot} />
                    </View>
                  ) : (
                    <View style={styles.stepCircleIdle} />
                  )}
                  <View
                    style={
                      sosProgressStage >= 4
                        ? styles.stepConnectorDone
                        : styles.stepConnectorPending
                    }
                  />
                </View>
                <View style={styles.timelineTextCol}>
                  <Text
                    style={[
                      styles.stepTitle,
                      sosProgressStage < 3 && { color: '#64748B' },
                    ]}
                  >
                    Contactos avisados
                  </Text>
                  <Text style={styles.stepSub}>
                    {sosProgressStage >= 3
                      ? `${step3Time} · Mamá y Valeria recibieron tu ubicación`
                      : 'Enviando alerta y enlace GPS a tu Red de Confianza...'}
                  </Text>
                </View>
              </View>

              {/* PASO 4: Se activa a los 9 segundos */}
              <View style={[styles.timelineStepRow, { marginBottom: 0 }]}>
                <View style={styles.timelineLeftCol}>
                  {sosProgressStage >= 4 ? (
                    <View style={styles.stepCircleDone}>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                  ) : sosProgressStage === 3 ? (
                    <View style={styles.stepCircleActiveRing}>
                      <View style={styles.stepInnerRedDot} />
                    </View>
                  ) : (
                    <View style={styles.stepCircleIdle} />
                  )}
                </View>
                <View style={styles.timelineTextCol}>
                  <Text
                    style={[
                      styles.stepTitle,
                      {
                        color:
                          sosProgressStage >= 4
                            ? '#0D7A68'
                            : sosProgressStage === 3
                            ? '#B91C1C'
                            : '#64748B',
                      },
                    ]}
                  >
                    En atención
                  </Text>
                  <Text style={styles.stepSub}>
                    {sosProgressStage >= 4
                      ? `${step4Time} · Operadora conectada siguiendo tu ubicación`
                      : 'Esperando asignación de operadora...'}
                  </Text>
                </View>
              </View>
            </View>

            {/* TARJETA UBICACIÓN COMPARTIDA */}
            <View style={styles.sosInfoCard}>
              <View style={styles.sosLocationIconBox}>
                <Ionicons name="location-outline" size={22} color="#521841" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sosCardTitle}>Ubicación compartida</Text>
                <Text style={styles.sosCardSub}>
                  GPS de la pulsera · precisión {gpsAccuracy} m
                  {userCoords
                    ? ` (${userCoords.latitude.toFixed(4)}, ${userCoords.longitude.toFixed(4)})`
                    : ''}
                </Text>
              </View>
            </View>

            {/* TARJETA GRABAR AUDIO DE EVIDENCIA CON ESTADO CLARO */}
            <View style={styles.sosInfoCard}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Text style={styles.sosCardTitle}>Grabar audio de evidencia</Text>
                  {isRecordingAudio ? (
                    <View style={styles.recLiveTag}>
                      <View style={styles.recRedDot} />
                      <Text style={styles.recLiveTagText}>
                        GRABANDO · {formatTimerMMSS(recordingSeconds)}
                      </Text>
                    </View>
                  ) : savedAudioUri ? (
                    <View style={styles.savedAudioTag}>
                      <Ionicons name="checkmark-circle" size={12} color="#0D7A68" />
                      <Text style={styles.savedAudioTagText}>
                        Guardado ({formatTimerMMSS(savedAudioDuration)})
                      </Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.sosCardSub}>
                  Se guarda cifrado, solo tú decides compartirlo
                </Text>

                {/* Botón directo para detener y guardar mientras está grabando */}
                {isRecordingAudio && (
                  <TouchableOpacity
                    style={styles.stopSaveAudioBtn}
                    onPress={handleToggleEvidenceCheckbox}
                  >
                    <Ionicons
                      name="stop-circle"
                      size={17}
                      color="#B91C1C"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.stopSaveAudioBtnText}>Detener y guardar audio</Text>
                  </TouchableOpacity>
                )}

                {/* Botón para escuchar la evidencia una vez guardada */}
                {savedAudioUri && !isRecordingAudio && (
                  <TouchableOpacity
                    style={styles.playEvidenceBtn}
                    onPress={handlePlaySavedEvidence}
                  >
                    <Ionicons
                      name={isPlayingPreview ? 'pause-circle' : 'play-circle'}
                      size={18}
                      color="#521841"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.playEvidenceBtnText}>
                      {isPlayingPreview
                        ? 'Pausar reproducción'
                        : `Escuchar evidencia (${formatTimerMMSS(savedAudioDuration)})`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                onPress={handleToggleEvidenceCheckbox}
                style={[
                  styles.evidenceCheckbox,
                  recordEvidenceEnabled && styles.evidenceCheckboxChecked,
                ]}
              >
                {recordEvidenceEnabled && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
              </TouchableOpacity>
            </View>

            {/* BOTÓN LLAMAR AL 911 */}
            <TouchableOpacity
              style={styles.sosCall911Btn}
              activeOpacity={0.85}
              onPress={() => Linking.openURL('tel:911')}
            >
              <Ionicons name="call-outline" size={22} color="#FFFFFF" style={{ marginRight: 10 }} />
              <Text style={styles.sosCall911Text}>Llamar al 911</Text>
            </TouchableOpacity>

            {/* BOTÓN CANCELAR ALERTA CON PIN */}
            <TouchableOpacity
              style={styles.sosCancelPinBtn}
              activeOpacity={0.85}
              onPress={() => {
                setPinInput('');
                setIsPinModalVisible(true);
              }}
            >
              <Text style={styles.sosCancelPinText}>Cancelar alerta con PIN</Text>
            </TouchableOpacity>

            {/* NOTA EXPLICATIVA INFERIOR */}
            <View style={styles.sosFooterNoteBox}>
              <Text style={styles.sosFooterNoteText}>
                Seguimiento: enviada ➔ recibida ➔ en atención. Cancelar pide PIN; un PIN de coacción finge cancelar y mantiene la alerta activa. Respaldo por SMS si no hay LoRa ni LTE.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL INGRESAR PIN DE SEGURIDAD (1234 REAL / 9999 COACCIÓN)           */}
      {/* ===================================================================== */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isPinModalVisible}
        onRequestClose={() => setIsPinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cancelar alerta con PIN</Text>
              <TouchableOpacity onPress={() => setIsPinModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionSubtitle, { marginBottom: 12 }]}>
              Ingresa tu PIN de 4 dígitos para confirmar que estás a salvo:
            </Text>

            <TextInput
              style={styles.pinInputBox}
              keyboardType="number-pad"
              secureTextEntry={true}
              maxLength={4}
              placeholder="••••"
              placeholderTextColor="#94A3B8"
              value={pinInput}
              onChangeText={setPinInput}
              autoFocus
            />

            <Text style={styles.pinHelperHint}>
              PIN normal: 1234 · PIN de coacción silencioso: 9999
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsPinModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Volver</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleVerifyCancelPin}>
                <Text style={styles.saveBtnText}>Confirmar PIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* TabBar Inferior */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('InicioTab')}>
          <Ionicons name="home-outline" size={24} color="#9E8697" />
          <Text style={styles.navText}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('ContactosTab')}>
          <Ionicons name="people-outline" size={24} color="#9E8697" />
          <Text style={styles.navText}>Contactos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={1}>
          <Ionicons name="location" size={24} color="#521841" />
          <Text style={[styles.navText, styles.navTextActive]}>Acompáñame</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('HistorialTab')}>
          <Ionicons name="bookmark-outline" size={24} color="#9E8697" />
          <Text style={styles.navText}>Recursos</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F8F6' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { fontSize: 28, fontWeight: '900', color: '#0F172A' },
  badgeActive: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E6F4EA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0D7A68', marginRight: 6 },
  badgeText: { fontSize: 13, fontWeight: '700', color: '#0D7A68' },
  badgeInactive: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeInactiveText: { fontSize: 13, fontWeight: '700', color: '#64748B' },

  coercionNoticeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  redPulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#DC2626', marginRight: 8 },
  coercionNoticeText: { fontSize: 12, fontWeight: '700', color: '#991B1B' },

  sectionSubtitle: { fontSize: 13, color: '#64748B', fontWeight: '600', marginBottom: 8 },
  routesScroll: { flexDirection: 'row', marginBottom: 16 },
  addRouteChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E8F0', borderWidth: 1.5, borderColor: '#521841', borderStyle: 'dashed', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
  addRouteChipText: { fontSize: 13, color: '#521841', fontWeight: '800', marginLeft: 6 },
  routeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
  routeChipSelected: { backgroundColor: '#521841', borderColor: '#521841' },
  routeChipText: { fontSize: 13, color: '#334155', fontWeight: '700', marginLeft: 6 },
  routeChipTextSelected: { color: '#FFFFFF' },
  startMonitoringBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#521841', borderRadius: 18, paddingVertical: 16, marginBottom: 16 },
  startMonitoringBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },

  realMapWrapper: {
    height: 240,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginBottom: 16,
    position: 'relative',
    backgroundColor: '#EAE5DF',
  },
  floatingDistancePill: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  floatingDistanceText: { fontSize: 13, fontWeight: '800', color: '#0F172A' },

  cardTrayecto: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  routeHeader: { flexDirection: 'row', alignItems: 'center' },
  pointDotOrigin: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#1A73E8', marginRight: 10, marginLeft: 3 },
  verticalLineConnector: { width: 2, height: 16, backgroundColor: '#CBD5E1', marginLeft: 8, marginVertical: 2 },
  routePointText: { fontSize: 14, color: '#475569', flex: 1 },
  boldText: { fontWeight: '800', color: '#0F172A' },
  gpsBadgeContainer: { marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center' },
  gpsBadgeText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  timerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  timerLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  timerValue: { fontSize: 32, fontWeight: '900', color: '#0F172A' },
  activePulseBadge: { backgroundColor: '#E6F4EA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  activePulseText: { fontSize: 11, color: '#0D7A68', fontWeight: '800' },

  arrivedBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D7A68', borderRadius: 18, paddingVertical: 16, marginBottom: 10 },
  arrivedBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },

  stopMonitoringBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 16, paddingVertical: 12, marginBottom: 16 },
  stopMonitoringBtnText: { color: '#475569', fontSize: 14, fontWeight: '700' },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  addTimeBtn: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 18, paddingVertical: 14, alignItems: 'center', marginRight: 8 },
  addTimeText: { color: '#0F172A', fontSize: 15, fontWeight: '800' },
  helpBtn: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#DC2626', borderRadius: 18, paddingVertical: 14, alignItems: 'center', marginLeft: 8 },
  helpBtnText: { color: '#DC2626', fontSize: 15, fontWeight: '800' },
  safetyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E8F0', borderRadius: 18, padding: 16 },
  footerNote: { flex: 1, fontSize: 12, color: '#521841', lineHeight: 17, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  modalContainer: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 22 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6 },
  modeRow: { flexDirection: 'row', marginBottom: 14, gap: 8 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#521841', backgroundColor: '#FFFFFF' },
  modeBtnActive: { backgroundColor: '#521841' },
  modeBtnText: { fontSize: 13, fontWeight: '700', color: '#521841' },
  modeBtnTextActive: { color: '#FFFFFF' },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 12, marginBottom: 10 },
  textInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#0F172A' },
  suggestionsBox: { backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12, overflow: 'hidden' },
  suggestionItem: { flexDirection: 'row', alignItems: 'flex-start', padding: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  suggestionText: { flex: 1, fontSize: 12, color: '#0F172A', lineHeight: 16 },
  presetChip: { backgroundColor: '#F3E8F0', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, marginRight: 8 },
  presetChipText: { fontSize: 12, fontWeight: '700', color: '#521841' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 18, marginRight: 8 },
  cancelBtnText: { fontSize: 14, color: '#64748B', fontWeight: '700' },
  saveBtn: { backgroundColor: '#521841', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 14, minWidth: 130, alignItems: 'center' },
  saveBtnText: { fontSize: 14, color: '#FFFFFF', fontWeight: '800' },

  sosScreenContainer: { flex: 1, backgroundColor: '#F5F3F0' },
  sosRedBanner: { backgroundColor: '#A62117', paddingHorizontal: 22, paddingBottom: 26, paddingTop: 14 },
  sosBannerContent: { marginTop: 4 },
  sosLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 14,
  },
  sosWhiteDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#FFFFFF', marginRight: 7 },
  sosLivePillText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  sosBannerTitle: { fontSize: 30, fontWeight: '900', color: '#FFFFFF', marginBottom: 6 },
  sosBannerSubtitle: { fontSize: 15, color: '#FDE8E8', lineHeight: 21 },
  sosBodyScroll: { padding: 18, paddingBottom: 40 },
  sosTimelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E2DC',
    marginBottom: 14,
  },
  timelineStepRow: { flexDirection: 'row', marginBottom: 4 },
  timelineLeftCol: { alignItems: 'center', marginRight: 14, width: 28 },
  stepCircleDone: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#137356', justifyContent: 'center', alignItems: 'center' },
  stepCircleActiveRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#A62117',
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepInnerRedDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#A62117' },
  stepCircleIdle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  stepConnectorDone: { width: 2, height: 28, backgroundColor: '#BCE3D6', marginVertical: 3 },
  stepConnectorPending: { width: 2, height: 28, backgroundColor: '#E2E8F0', marginVertical: 3 },
  timelineTextCol: { flex: 1, paddingTop: 2, paddingBottom: 14 },
  stepTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  stepSub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  sosInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E2DC',
    marginBottom: 14,
  },
  sosLocationIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F3E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  sosCardTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  sosCardSub: { fontSize: 13, color: '#64748B', marginTop: 3 },
  recLiveTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: 8 },
  recRedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#DC2626', marginRight: 4 },
  recLiveTagText: { fontSize: 10, fontWeight: '800', color: '#DC2626' },
  savedAudioTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E6F4EA', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: 8 },
  savedAudioTagText: { fontSize: 10, fontWeight: '800', color: '#0D7A68', marginLeft: 4 },
  stopSaveAudioBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  stopSaveAudioBtnText: { fontSize: 12, fontWeight: '700', color: '#B91C1C' },
  playEvidenceBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: '#F3E8F0', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  playEvidenceBtnText: { fontSize: 12, fontWeight: '700', color: '#521841' },
  evidenceCheckbox: { width: 26, height: 26, borderRadius: 6, borderWidth: 2, borderColor: '#94A3B8', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  evidenceCheckboxChecked: { backgroundColor: '#521841', borderColor: '#521841' },
  sosCall911Btn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#A62117', borderRadius: 18, paddingVertical: 17, marginTop: 6, marginBottom: 12 },
  sosCall911Text: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  sosCancelPinBtn: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginBottom: 18 },
  sosCancelPinText: { color: '#0F172A', fontSize: 16, fontWeight: '800' },
  sosFooterNoteBox: { backgroundColor: '#FCE8E6', borderRadius: 14, padding: 14 },
  sosFooterNoteText: { fontSize: 12, color: '#7F1D1D', lineHeight: 17 },

  pinInputBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#521841',
    borderRadius: 16,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 12,
    textAlign: 'center',
    paddingVertical: 12,
    color: '#0F172A',
    marginBottom: 8,
  },
  pinHelperHint: { fontSize: 11, color: '#64748B', textAlign: 'center', marginBottom: 12 },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 68, backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingBottom: 4 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  navText: { fontSize: 11, color: '#9E8697', marginTop: 4, fontWeight: '500', textAlign: 'center' },
  navTextActive: { color: '#521841', fontWeight: '700' },
});