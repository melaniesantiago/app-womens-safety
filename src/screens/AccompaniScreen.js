import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';

export default function AccompaniScreen({ navigation }) {
  const [minutesLeft, setMinutesLeft] = useState(15);
  const [isMonitoringActive, setIsMonitoringActive] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Coordenadas reales del GPS
  const [userCoords, setUserCoords] = useState(null);

  // Formulario para nueva ruta
  const [newOrigin, setNewOrigin] = useState('Mi ubicación actual');
  const [newDestination, setNewDestination] = useState('');
  const [newMinutes, setNewMinutes] = useState('15');

  // Rutas predeterminadas
  const [routesList, setRoutesList] = useState([
    { id: '1', name: 'Casa ➔ Trabajo', origin: 'Casa (Calle Hidalgo)', destination: 'Trabajo (Centro)', etaMinutes: 12 },
    { id: '2', name: 'Trabajo ➔ Casa', origin: 'Trabajo (Centro)', destination: 'Casa (Calle Hidalgo)', etaMinutes: 15 },
    { id: '3', name: 'Casa ➔ Escuela', origin: 'Casa (Calle Hidalgo)', destination: 'Escuela / Universidad', etaMinutes: 20 },
  ]);

  const [selectedRoute, setSelectedRoute] = useState(routesList[0]);
  const locationSubscription = useRef(null);

  // EFECTO DE GPS Y TEMPORIZADOR
  useEffect(() => {
    let timerInterval = null;

    async function startLiveGpsTracking() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se requiere acceso al GPS para monitorear tu trayecto.');
        setIsMonitoringActive(false);
        return;
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 1
        },
        (location) => {
          setUserCoords({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );
    }

    if (isMonitoringActive) {
      startLiveGpsTracking();

      timerInterval = setInterval(() => {
        setMinutesLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            handleTimeExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 60000);
    } else {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    }

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isMonitoringActive]);

  // Iniciar Monitoreo
  const handleStartMonitoring = () => {
    setMinutesLeft(selectedRoute.etaMinutes);
    setIsMonitoringActive(true);
    Alert.alert('🛡️ Trayecto Iniciado', `GPS activado. Monitoreando recorrido a ${selectedRoute.destination}.`);
  };

  // Detener / Cancelar Trayecto
  const handleStopMonitoring = () => {
    Alert.alert(
      '¿Detener Trayecto?',
      'Se desactivará el monitoreo GPS y el temporizador preventivo.',
      [
        { text: 'Continuar monitoreo', style: 'cancel' },
        { 
          text: 'Sí, detener', 
          style: 'destructive',
          onPress: () => {
            setIsMonitoringActive(false);
            setMinutesLeft(selectedRoute.etaMinutes);
            if (locationSubscription.current) {
              locationSubscription.current.remove();
            }
          } 
        }
      ]
    );
  };

  // Botón +10 minutos
  const handleAddMinutes = () => {
    if (!isMonitoringActive) {
      Alert.alert('Aviso', 'Primero debes iniciar el trayecto seguro.');
      return;
    }
    setMinutesLeft(prev => prev + 10);
    Alert.alert('⏱️ Tiempo Extendido', 'Se agregaron +10 minutos correctamente a tu temporizador.');
  };

  // Llegué bien (Navegación directa a InicioTab)
  const handleArrivedSafely = () => {
    setIsMonitoringActive(false);
    Alert.alert(
      '¡Llegaste a salvo! 🎉',
      `Confirmaste tu llegada a "${selectedRoute.destination}". Tu Red de Confianza ha sido notificada.`,
      [{ text: 'Entendido', onPress: () => navigation?.navigate('InicioTab') }]
    );
  };

  // Temporizador vencido
  const handleTimeExpired = () => {
    Alert.alert(
      '⚠️ ¿Te encuentras bien?',
      'El tiempo de tu trayecto ha finalizado. Tienes 2 minutos para confirmar tu llegada antes de avisar a tus contactos.',
      [
        { text: 'Pedir Ayuda SOS', style: 'destructive', onPress: handleRequestHelp },
        { text: 'Llegué bien', onPress: handleArrivedSafely }
      ],
      { cancelable: false }
    );
  };

  // Alerta SOS
  const handleRequestHelp = () => {
    Alert.alert(
      '🚨 ALERTA SOS ACTIVADA',
      `Ubicación en tiempo real enviada a tus contactos de emergencia.`,
      [{ text: 'Aceptar' }]
    );
  };

  // Crear nueva ruta
  const handleCreateRoute = () => {
    if (!newDestination.trim()) {
      Alert.alert('Atención', 'Ingresa un punto de destino.');
      return;
    }

    const minutesNum = parseInt(newMinutes) || 15;
    const createdRoute = {
      id: Date.now().toString(),
      name: `${newOrigin.split(' ')[0]} ➔ ${newDestination}`,
      origin: newOrigin.trim(),
      destination: newDestination.trim(),
      etaMinutes: minutesNum
    };

    setRoutesList(prev => [...prev, createdRoute]);
    setSelectedRoute(createdRoute);
    setMinutesLeft(minutesNum);
    
    setNewDestination('');
    setNewMinutes('15');
    setIsModalVisible(false);

    Alert.alert('Ruta Configurada', 'Presiona "Iniciar Trayecto Seguro" para activar el mapa y el GPS.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Encabezado */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Acompáñame</Text>
          {isMonitoringActive ? (
            <View style={styles.badgeActive}>
              <View style={styles.greenDot} />
              <Text style={styles.badgeText}>En Monitoreo</Text>
            </View>
          ) : (
            <View style={styles.badgeInactive}>
              <Text style={styles.badgeInactiveText}>En Espera</Text>
            </View>
          )}
        </View>

        {/* Seleccionar o Crear Ruta */}
        <Text style={styles.sectionSubtitle}>Selecciona tu destino o crea una ruta:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routesScroll}>
          <TouchableOpacity style={styles.addRouteChip} onPress={() => setIsModalVisible(true)}>
            <Feather name="plus" size={16} color="#521841" />
            <Text style={styles.addRouteChipText}>Nueva Ruta</Text>
          </TouchableOpacity>

          {routesList.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.routeChip, selectedRoute.id === item.id && styles.routeChipSelected]}
              onPress={() => {
                setSelectedRoute(item);
                setMinutesLeft(item.etaMinutes);
              }}
            >
              <Ionicons 
                name={selectedRoute.id === item.id ? "navigate" : "navigate-outline"} 
                size={15} 
                color={selectedRoute.id === item.id ? "#FFFFFF" : "#521841"} 
              />
              <Text style={[styles.routeChipText, selectedRoute.id === item.id && styles.routeChipTextSelected]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* BOTÓN PARA INICIAR EL TRAYECTO (Si está inactivo) */}
        {!isMonitoringActive ? (
          <TouchableOpacity 
            style={styles.startMonitoringBtn}
            activeOpacity={0.8}
            onPress={handleStartMonitoring}
          >
            <Ionicons name="play" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.startMonitoringBtnText}>Iniciar Trayecto Seguro</Text>
          </TouchableOpacity>
        ) : null}

        {/* MAPA DE MONITOREO TRAYECTO */}
        <View style={styles.mapContainer}>
          <View style={styles.cityBlock1} />
          <View style={styles.cityBlock2} />
          <View style={styles.parkZone} />
          <View style={styles.mainAvenueHorizontal} />
          <View style={styles.mainAvenueVertical} />

          {/* Trazado Vectorial de la Ruta */}
          <View style={styles.vectorRouteSegment1} />
          <View style={styles.vectorRouteSegment2} />
          <View style={styles.vectorRouteSegment3} />

          {/* Marcador Origen (A) */}
          <View style={styles.originMarkerContainer}>
            <View style={styles.originPinOuter}>
              <View style={styles.originPinInner} />
            </View>
            <View style={styles.originLabelBox}>
              <Text style={styles.originLabelText} numberOfLines={1}>
                A: {selectedRoute.origin}
              </Text>
            </View>
          </View>

          {/* Marcador GPS Usuaria */}
          <View style={[styles.userPulseOuter, !isMonitoringActive && { backgroundColor: 'rgba(148, 163, 184, 0.4)' }]}>
            <View style={[styles.userPulseCore, !isMonitoringActive && { backgroundColor: '#64748B' }]} />
          </View>

          {/* Marcador Destino (B) */}
          <View style={styles.destinationMarkerContainer}>
            <View style={styles.destinationAreaGlow} />
            <View style={styles.destinationBadge}>
              <Ionicons name="location" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.destinationBadgeText} numberOfLines={1}>
                B: {selectedRoute.destination}
              </Text>
            </View>
          </View>
        </View>

        {/* TARJETA DE ESTADO Y TELEMETRÍA */}
        <View style={styles.cardTrayecto}>
          <View style={styles.routeHeader}>
            <View style={styles.pointDotOrigin} />
            <Text style={styles.routePointText}>Origen: <Text style={styles.boldText}>{selectedRoute.origin}</Text></Text>
          </View>
          <View style={styles.verticalLineConnector} />
          <View style={styles.routeHeader}>
            <Ionicons name="location" size={18} color="#521841" style={{ marginRight: 6 }} />
            <Text style={styles.routePointText}>Destino: <Text style={styles.boldText}>{selectedRoute.destination}</Text></Text>
          </View>

          {/* Estatus del GPS */}
          <View style={styles.gpsBadgeContainer}>
            <Ionicons name="radio" size={14} color={isMonitoringActive ? "#0D7A68" : "#94A3B8"} style={{ marginRight: 6 }} />
            <Text style={[styles.gpsBadgeText, isMonitoringActive && { color: "#0D7A68" }]}>
              {isMonitoringActive 
                ? (userCoords ? `GPS Activo (${userCoords.latitude.toFixed(4)}, ${userCoords.longitude.toFixed(4)})` : 'Conectando con señal GPS...')
                : 'GPS en espera (Presiona "Iniciar Trayecto")'}
            </Text>
          </View>

          {/* Temporizador */}
          <View style={styles.timerRow}>
            <View>
              <Text style={styles.timerLabel}>Tiempo estimado restante</Text>
              <Text style={styles.timerValue}>{minutesLeft} <Text style={{ fontSize: 18 }}>min</Text></Text>
            </View>
            {isMonitoringActive && (
              <View style={styles.activePulseBadge}>
                <Text style={styles.activePulseText}>Rastreando...</Text>
              </View>
            )}
          </View>
        </View>

        {/* BOTÓN LLEGUE BIEN (Solo cuando está monitoreando) */}
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

        {/* BOTÓN DETENER TRAYECTO (Solo cuando está monitoreando) */}
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

        {/* NOTA INSTITUCIONAL PREVENTIVA */}
        <View style={styles.safetyBox}>
          <Ionicons name="shield-checkmark" size={22} color="#521841" style={{ marginRight: 10 }} />
          <Text style={styles.footerNote}>
            Temporizador de trayecto. Si vence sin 'Llegué bien', primero le pregunta a la usuaria y, si no responde, avisa a sus contactos.
          </Text>
        </View>

      </ScrollView>

      {/* MODAL CONFIGURAR NUEVA RUTA */}
      <Modal animationType="slide" transparent={true} visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configurar Nueva Ruta</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Punto de Origen</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="radio-button-on" size={18} color="#3B82F6" style={{ marginRight: 8 }} />
              <TextInput style={styles.textInput} value={newOrigin} onChangeText={setNewOrigin} />
            </View>

            <Text style={styles.inputLabel}>Punto de Destino</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="location" size={18} color="#521841" style={{ marginRight: 8 }} />
              <TextInput style={styles.textInput} placeholder="Ej. Trabajo, Escuela..." value={newDestination} onChangeText={setNewDestination} />
            </View>

            <Text style={styles.inputLabel}>Minutos Estimados</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="time-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput style={styles.textInput} keyboardType="numeric" value={newMinutes} onChangeText={setNewMinutes} />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreateRoute}>
                <Text style={styles.saveBtnText}>Guardar Ruta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* TabBar Inferior (Rutas directas limpias) */}
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
  sectionSubtitle: { fontSize: 13, color: '#64748B', fontWeight: '600', marginBottom: 8 },
  routesScroll: { flexDirection: 'row', marginBottom: 16 },
  addRouteChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E8F0', borderWidth: 1.5, borderColor: '#521841', borderStyle: 'dashed', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
  addRouteChipText: { fontSize: 13, color: '#521841', fontWeight: '800', marginLeft: 4 },
  routeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
  routeChipSelected: { backgroundColor: '#521841', borderColor: '#521841' },
  routeChipText: { fontSize: 13, color: '#334155', fontWeight: '700', marginLeft: 6 },
  routeChipTextSelected: { color: '#FFFFFF' },
  startMonitoringBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#521841', borderRadius: 18, paddingVertical: 16, marginBottom: 16 },
  startMonitoringBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },

  mapContainer: {
    height: 200,
    backgroundColor: '#EAE5DF',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#D8D1C8',
  },
  cityBlock1: { position: 'absolute', top: 15, left: 15, width: 80, height: 60, backgroundColor: '#F4F0EC', borderRadius: 12 },
  cityBlock2: { position: 'absolute', bottom: 15, right: 15, width: 100, height: 70, backgroundColor: '#F4F0EC', borderRadius: 12 },
  parkZone: { position: 'absolute', top: 15, right: 20, width: 100, height: 65, backgroundColor: '#D6E8D5', borderRadius: 16 },
  mainAvenueHorizontal: { position: 'absolute', top: 90, left: 0, right: 0, height: 24, backgroundColor: '#FFFFFF' },
  mainAvenueVertical: { position: 'absolute', left: 110, top: 0, bottom: 0, width: 24, backgroundColor: '#FFFFFF' },
  vectorRouteSegment1: { position: 'absolute', left: 40, bottom: 35, width: 6, height: 75, backgroundColor: '#521841', borderRadius: 3 },
  vectorRouteSegment2: { position: 'absolute', left: 40, bottom: 100, width: 156, height: 6, backgroundColor: '#521841', borderRadius: 3 },
  vectorRouteSegment3: { position: 'absolute', left: 190, bottom: 100, width: 6, height: 45, backgroundColor: '#521841', borderRadius: 3 },
  originMarkerContainer: { position: 'absolute', left: 15, bottom: 15, flexDirection: 'row', alignItems: 'center' },
  originPinOuter: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  originPinInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  originLabelBox: { backgroundColor: '#FFFFFF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 6, borderWidth: 1, borderColor: '#CBD5E1' },
  originLabelText: { fontSize: 11, fontWeight: '800', color: '#1E293B', maxWidth: 110 },
  userPulseOuter: { position: 'absolute', left: 110, top: 86, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(82, 24, 65, 0.3)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  userPulseCore: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#521841', borderWidth: 2, borderColor: '#FFFFFF' },
  destinationMarkerContainer: { position: 'absolute', right: 15, top: 20, alignItems: 'center' },
  destinationAreaGlow: { position: 'absolute', width: 110, height: 45, backgroundColor: 'rgba(209, 237, 212, 0.8)', borderRadius: 16, top: -4 },
  destinationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, elevation: 3 },
  destinationBadgeText: { color: '#FFFFFF', fontWeight: '800', fontSize: 11, maxWidth: 100 },

  cardTrayecto: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  routeHeader: { flexDirection: 'row', alignItems: 'center' },
  pointDotOrigin: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#3B82F6', marginRight: 10, marginLeft: 3 },
  verticalLineConnector: { width: 2, height: 16, backgroundColor: '#CBD5E1', marginLeft: 8, marginVertical: 2 },
  routePointText: { fontSize: 14, color: '#475569' },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  modalContainer: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 22 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6 },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 12, marginBottom: 14 },
  textInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#0F172A' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 18, marginRight: 8 },
  cancelBtnText: { fontSize: 14, color: '#64748B', fontWeight: '700' },
  saveBtn: { backgroundColor: '#521841', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 14 },
  saveBtnText: { fontSize: 14, color: '#FFFFFF', fontWeight: '800' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 68, backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingBottom: 4 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  navText: { fontSize: 11, color: '#9E8697', marginTop: 4, fontWeight: '500', textAlign: 'center' },
  navTextActive: { color: '#521841', fontWeight: '700' },
});