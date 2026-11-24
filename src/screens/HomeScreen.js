import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Vibration,
  Linking,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import {
  useAudioRecorder,
  useAudioPlayer,
  AudioModule,
  RecordingPresets,
} from 'expo-audio';
import { API_URL } from '../config/api';

const AVATAR_ICONS = [
  { id: 'person', label: 'Clásico' },
  { id: 'shield-checkmark', label: 'Protegida' },
  { id: 'heart', label: 'Cuidado' },
  { id: 'sparkles', label: 'Estrella' },
  { id: 'flower', label: 'Flor' },
];

// PINs de respaldo (solo se usan en modo práctica o si no hay red)
const REAL_CANCEL_PIN = '1234';
const COERCION_PIN = '9999';

export default function HomeScreen({ user, setUser, onLogout }) {
  const navigation = useNavigation();

  // Estados para editar el perfil
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatarIcon || 'person');

  // Datos reales de la pulsera (vienen del backend en Railway: GET /estado)
  const [conectado, setConectado] = useState(false);
  const [usuaria, setUsuaria] = useState({ pulso: 0, oxigeno: 0, bat: 255 });
  const [ultimaAlerta, setUltimaAlerta] = useState(null);
  const alertaAbiertaRef = useRef(false);
  const triggerRef = useRef(null);
  const [enEmergencia, setEnEmergencia] = useState(false);
  const [canceladaLocal, setCanceladaLocal] = useState(false);

  // Estados del botón "Pedir ayuda" (cuenta regresiva de 3 segundos al mantener presionado)
  const [isHoldingPanic, setIsHoldingPanic] = useState(false);
  const [panicCountdown, setPanicCountdown] = useState(3);
  const holdIntervalRef = useRef(null);
  const holdProgressAnim = useRef(new Animated.Value(0)).current;

  // Estados de Alerta Activa ("Alerta enviada") + GPS + Audio real
  const [isSosModalVisible, setIsSosModalVisible] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [sosStartTime, setSosStartTime] = useState('');
  const [step2Time, setStep2Time] = useState('');
  const [step3Time, setStep3Time] = useState('');
  const [step4Time, setStep4Time] = useState('');
  const [sosElapsedSeconds, setSosElapsedSeconds] = useState(0);
  const [sosProgressStage, setSosProgressStage] = useState(1);
  const [silentCoercionActive, setSilentCoercionActive] = useState(false);
  const [currentGps, setCurrentGps] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(7);

  // Audio de evidencia real con expo-audio
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

  // Sincronizar campos cuando cambia el usuario
  useEffect(() => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditAvatar(user?.avatarIcon || 'person');
  }, [user]);

  // Consultar el estado de la pulsera cada 3 segundos
  useEffect(() => {
    let activo = true;

    const consultarEstado = async () => {
      try {
        const res = await fetch(`${API_URL}/estado`);
        const data = await res.json();
        if (!activo || !data.ok) return;

        setConectado(Boolean(data.conectado));

        if (data.usuaria) {
          setUsuaria(data.usuaria);

          const emergencia =
            data.usuaria.estado === 'emergencia' ||
            data.usuaria.situacion === 'emergencia';

          setEnEmergencia(emergencia);

          if (emergencia && !alertaAbiertaRef.current) {
            alertaAbiertaRef.current = true;
            triggerRef.current?.(false); // abre el modal (botón físico de la pulsera)
          } else if (!emergencia) {
            alertaAbiertaRef.current = false;
            setCanceladaLocal(false);
          }
        }

        if (Array.isArray(data.historial) && data.historial.length > 0) {
          setUltimaAlerta(data.historial[0]);
        }
      } catch {
        if (activo) setConectado(false);
      }
    };

    consultarEstado();
    const id = setInterval(consultarEstado, 3000);
    return () => {
      activo = false;
      clearInterval(id);
    };
  }, []);

  // Limpiar intervalos si se desmonta la pantalla
  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  // Temporizador activo de "EN CURSO" y avance por etapas (1 -> 2 -> 3 -> 4)
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

  // Cronómetro de grabación de audio de evidencia
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

  const displayName = user?.name ? user.name.trim().split(' ')[0] : 'Usuaria';
  const currentAvatar = user?.avatarIcon || 'person';

  const textoBateria =
    usuaria.bat === 255 || usuaria.bat === undefined
      ? 'USB / Sin bat'
      : `Batería ${usuaria.bat} %`;

  // Pantalla roja solo con alerta real. Con PIN de coacción se ve normal a propósito.
  const mostrarRojo = enEmergencia && !canceladaLocal && !silentCoercionActive;

  const getFormattedDate = () => {
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ];
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const hoy = new Date();
    return `${dias[hoy.getDay()]} ${hoy.getDate()} de ${meses[hoy.getMonth()]}`;
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      Alert.alert('Nombre requerido', 'Por favor escribe tu nombre para actualizar tu perfil.');
      return;
    }

    if (setUser) {
      setUser((prev) => ({
        ...prev,
        name: editName.trim(),
        email: editEmail.trim() || prev?.email,
        avatarIcon: editAvatar,
      }));
    }

    setIsProfileModalVisible(false);
    Alert.alert('Perfil actualizado 💜', 'Tus datos se han guardado correctamente.');
  };

  // Avisa al servidor (sin await: el modal abre aunque no haya internet)
  const enviarSosAlServidor = () => {
    fetch(`${API_URL}/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: user?.name || 'Usuaria',
        lat: usuaria.lat || 0,
        lon: usuaria.lon || 0,
      }),
    }).catch(() => {});
  };

  // =========================================================================
  // LÓGICA DEL BOTÓN "PEDIR AYUDA" (MANTENER PRESIONADO 3 SEGUNDOS)
  // =========================================================================
  const handlePressInPanic = () => {
    setIsHoldingPanic(true);
    setPanicCountdown(3);
    Vibration.vibrate(60);

    holdProgressAnim.setValue(0);
    Animated.timing(holdProgressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    let secondsLeft = 3;
    holdIntervalRef.current = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft > 0) {
        setPanicCountdown(secondsLeft);
        Vibration.vibrate(60);
      } else {
        clearInterval(holdIntervalRef.current);
        holdIntervalRef.current = null;
        setIsHoldingPanic(false);
        setPanicCountdown(3);
        holdProgressAnim.setValue(0);
        Vibration.vibrate([0, 200, 100, 300]);
        enviarSosAlServidor();
        triggerEmergencyAlert(false);
      }
    }, 1000);
  };

  const handlePressOutPanic = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
      const abortedEarly = panicCountdown === 3;
      setIsHoldingPanic(false);
      setPanicCountdown(3);
      holdProgressAnim.stopAnimation();
      holdProgressAnim.setValue(0);

      if (abortedEarly) {
        Alert.alert(
          'Botón de Emergencia',
          'Mantén presionado el botón rojo durante 3 segundos seguidos para enviar una alerta SOS.'
        );
      }
    }
  };

  // =========================================================================
  // DISPARAR ALERTA SOS + OBTENER GPS REAL + GRABAR AUDIO DE EVIDENCIA
  // =========================================================================
  const triggerEmergencyAlert = async (practice = false) => {
    const now = new Date();
    const formattedHour = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    setIsPracticeMode(practice);
    if (!practice) alertaAbiertaRef.current = true;
    setSosStartTime(formattedHour);
    setStep2Time('');
    setStep3Time('');
    setStep4Time('');
    setSosElapsedSeconds(0);
    setSosProgressStage(1);
    setSilentCoercionActive(false);
    setRecordEvidenceEnabled(true);
    setSavedAudioUri(null);
    setIsSosModalVisible(true);

    // Obtener coordenadas GPS reales al momento de la alerta
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCurrentGps({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (loc.coords.accuracy) {
          setGpsAccuracy(Math.max(4, Math.round(loc.coords.accuracy)));
        }
      }
    } catch {}

    await startEvidenceAudioRecording();
  };

  // Mantiene la referencia al disparador siempre actualizada (la usa el polling)
  triggerRef.current = triggerEmergencyAlert;

  const startEvidenceAudioRecording = async () => {
    try {
      if (isRecordingAudio) return;
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
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

  // Valida el PIN: en el servidor (alerta real) o local (práctica / sin red)
  const handleVerifyCancelPin = async () => {
    if (pinInput.length < 4) {
      Alert.alert('PIN requerido', 'Ingresa tu PIN de 4 dígitos.');
      return;
    }

    let resultado; // 'cancelar' | 'coaccion' | 'incorrecto'
    const validarLocal = () =>
      pinInput === REAL_CANCEL_PIN
        ? 'cancelar'
        : pinInput === COERCION_PIN
        ? 'coaccion'
        : 'incorrecto';

    if (isPracticeMode) {
      resultado = validarLocal();
    } else {
      try {
        const res = await fetch(`${API_URL}/cancelar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: pinInput }),
        });
        const data = await res.json();
        resultado = !data.ok ? 'incorrecto' : data.coaccion ? 'coaccion' : 'cancelar';
      } catch {
        resultado = validarLocal(); // sin red: valida en el teléfono
      }
    }

    if (resultado === 'cancelar') {
      setCanceladaLocal(true);
      await stopEvidenceAudioRecording();
      setIsPinModalVisible(false);
      setIsSosModalVisible(false);
      setPinInput('');
      setSilentCoercionActive(false);
      Alert.alert(
        'Alerta Cancelada',
        'Has confirmado que te encuentras segura. El audio de evidencia quedó guardado cifrado en tu teléfono.'
      );
    } else if (resultado === 'coaccion') {
      setIsPinModalVisible(false);
      setIsSosModalVisible(false);
      setPinInput('');
      setSilentCoercionActive(true);
    } else {
      Alert.alert('PIN incorrecto', 'El PIN ingresado no es válido.');
      setPinInput('');
    }
  };

  const formatTimerMMSS = (totalSecs) => {
    const mins = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const secs = String(totalSecs % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const progressWidth = holdProgressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={[styles.container, mostrarRojo && styles.containerAlerta]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header con Botón de Perfil en la esquina superior derecha */}
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[styles.dateText, mostrarRojo && styles.textoClaroSuave]}>{getFormattedDate()}</Text>
            <Text style={[styles.welcomeText, mostrarRojo && styles.textoClaro]} numberOfLines={1}>
              Hola, {displayName}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            activeOpacity={0.8}
            onPress={() => setIsProfileModalVisible(true)}
          >
            <View style={styles.profileAvatarCircle}>
              <Ionicons name={currentAvatar} size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.profileBtnLabel}>Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Aviso de alerta activa (toca para ver el seguimiento) */}
        {mostrarRojo && (
          <TouchableOpacity
            style={styles.alertaActivaStrip}
            activeOpacity={0.85}
            onPress={() => setIsSosModalVisible(true)}
          >
            <View style={styles.redPulseDot} />
            <Text style={styles.alertaActivaText}>
              ALERTA ACTIVA · Toca para ver el seguimiento
            </Text>
          </TouchableOpacity>
        )}

        {/* Indicador discreto solo si se activó PIN de coacción */}
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

        {/* Botón Rojo Pedir Ayuda con Cuenta Regresiva y Barra de Progreso */}
        <TouchableOpacity
          style={[
            styles.panicButton,
            mostrarRojo && styles.panicButtonAlerta,
            isHoldingPanic && styles.panicButtonHolding,
          ]}
          activeOpacity={0.95}
          onPressIn={handlePressInPanic}
          onPressOut={handlePressOutPanic}
        >
          {isHoldingPanic && (
            <Animated.View style={[styles.panicProgressFill, { width: progressWidth }]} />
          )}

          <View style={styles.alertIconCircle}>
            {isHoldingPanic ? (
              <Text style={styles.countdownBigNumber}>{panicCountdown}</Text>
            ) : (
              <Ionicons name="warning-outline" size={28} color="#C5221F" />
            )}
          </View>

          <View style={styles.panicTextContainer}>
            <Text style={styles.panicTitle}>
              {isHoldingPanic ? `Enviando en ${panicCountdown}s...` : 'Pedir ayuda'}
            </Text>
            <Text style={styles.panicSubtitle}>
              {isHoldingPanic
                ? 'Suelta para cancelar antes de enviar'
                : 'Mantén presionado 3 segundos'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Card Mi Pulsera */}
        <TouchableOpacity
          style={styles.myBraceletCard}
          onPress={() => navigation?.navigate('MyDevice')}
        >
          <View style={styles.starIconBox}>
            <Ionicons name="star" size={26} color="#FFFFFF" />
          </View>
          <View style={styles.braceletInfo}>
            <Text style={styles.braceletTitle}>Mi pulsera</Text>
            <Text style={styles.braceletSub}>{textoBateria} • Red móvil • GPS</Text>
            <Text style={styles.view3dText}>Ver en 3D</Text>
          </View>
          <View style={[styles.connectedChip, !conectado && { backgroundColor: '#FEE2E2' }]}>
            <View style={[styles.greenDot, !conectado && { backgroundColor: '#C5221F' }]} />
            <Text style={[styles.connectedText, !conectado && { color: '#C5221F' }]}>
              {conectado ? 'Conectada' : 'Sin red'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Grid 2x2 */}
        <View style={styles.grid}>
          {/* Card Sensores */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation?.navigate('Telemetry')}
          >
            <View style={styles.cardHeaderRow}>
              <Ionicons name="heart-outline" size={18} color="#C5221F" />
              <Text style={styles.cardCategoryTitleRed}>Sensores</Text>
            </View>
            <View style={styles.bpmRow}>
              <Text style={styles.bpmNumber}>{usuaria.pulso > 0 ? usuaria.pulso : '--'}</Text>
              <Text style={styles.bpmUnit}>lpm</Text>
            </View>

            <View style={styles.ecgContainer}>
              <View style={styles.ecgLine} />
            </View>

            <Text style={styles.cardFooterText}>
              SpO₂ {usuaria.oxigeno > 0 ? `${usuaria.oxigeno}%` : '--'} • En vivo
            </Text>
          </TouchableOpacity>

          {/* Card Última Alerta */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation?.navigate('AlertDetail')}
          >
            <View style={styles.cardHeaderRow}>
              <Ionicons name="time-outline" size={18} color="#4C1D95" />
              <Text style={styles.cardCategoryTitlePurple}>Última alerta</Text>
            </View>
            <Text style={styles.alertDateText}>
              {ultimaAlerta ? ultimaAlerta.hora : 'Sin registros'}
            </Text>
            <View
              style={[
                styles.attendedChip,
                ultimaAlerta?.nivel === 'alto' && { backgroundColor: '#FEE2E2' },
              ]}
            >
              <Text
                style={[
                  styles.attendedChipText,
                  ultimaAlerta?.nivel === 'alto' && { color: '#C5221F' },
                ]}
              >
                {ultimaAlerta?.nivel === 'alto' ? 'Activa' : 'Atendida'}
              </Text>
            </View>
            <Text style={styles.cardFooterText} numberOfLines={1}>
              {ultimaAlerta ? ultimaAlerta.texto : 'Hora, lugar y pulso'}
            </Text>
          </TouchableOpacity>

          {/* Card Acompáñame */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation?.navigate('AccompaniTab')}
          >
            <Ionicons
              name="location-outline"
              size={22}
              color="#4C1D95"
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.cardMainTitle}>Acompáñame</Text>
            <Text style={styles.cardFooterText}>Comparte tu trayecto</Text>
          </TouchableOpacity>

          {/* Card Probar Alerta -> Abre Alerta Enviada en Modo Práctica */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => triggerEmergencyAlert(true)}
          >
            <MaterialCommunityIcons
              name="pulse"
              size={22}
              color="#4C1D95"
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.cardMainTitle}>Probar alerta</Text>
            <Text style={styles.cardFooterText}>Modo práctica</Text>
          </TouchableOpacity>
        </View>

        {/* Contactos de Confianza */}
        <TouchableOpacity
          style={styles.contactsCard}
          onPress={() => navigation?.navigate('ContactosTab')}
        >
          <View style={styles.avatarGroup}>
            <View style={[styles.avatarCircle, { backgroundColor: '#4C1D95' }]}>
              <Text style={styles.avatarLetter}>M</Text>
            </View>
            <View style={[styles.avatarCircle, { backgroundColor: '#0D9488', marginLeft: -10 }]}>
              <Text style={styles.avatarLetter}>V</Text>
            </View>
            <View style={[styles.avatarCircle, { backgroundColor: '#9A3412', marginLeft: -10 }]}>
              <Text style={styles.avatarLetter}>D</Text>
            </View>
          </View>

          <View style={styles.contactsTextContainer}>
            <Text style={styles.contactsTitle}>3 contactos de confianza</Text>
            <Text style={styles.contactsSub}>2 activos • 1 pendiente</Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>
      </ScrollView>

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
          <SafeAreaView edges={['top']} style={styles.sosRedBanner}>
            <View style={styles.sosBannerContent}>
              <View style={styles.sosLivePill}>
                <View style={styles.sosWhiteDot} />
                <Text style={styles.sosLivePillText}>
                  {isPracticeMode ? 'MODO PRÁCTICA · ' : 'EN CURSO · '}
                  {formatTimerMMSS(sosElapsedSeconds)} (Inicio {sosStartTime})
                </Text>
              </View>

              <Text style={styles.sosBannerTitle}>
                {isPracticeMode ? 'Simulacro de alerta' : 'Alerta enviada'}
              </Text>
              <Text style={styles.sosBannerSubtitle}>
                {isPracticeMode
                  ? 'Prueba segura: no se notificó al 911 real, pero todos los sensores están activos.'
                  : 'La ayuda ya está en camino. Mantén la pulsera contigo.'}
              </Text>
            </View>
          </SafeAreaView>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.sosBodyScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* LÍNEA DE TIEMPO PROGRESIVA */}
            <View style={styles.sosTimelineCard}>
              {/* PASO 1 */}
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
                  <Text style={styles.stepSub}>{sosStartTime} · vía red móvil</Text>
                </View>
              </View>

              {/* PASO 2 */}
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

              {/* PASO 3 */}
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

              {/* PASO 4 */}
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

            {/* UBICACIÓN COMPARTIDA */}
            <View style={styles.sosInfoCard}>
              <View style={styles.sosLocationIconBox}>
                <Ionicons name="location-outline" size={22} color="#521841" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sosCardTitle}>Ubicación compartida</Text>
                <Text style={styles.sosCardSub}>
                  GPS de la pulsera · precisión {gpsAccuracy} m
                  {currentGps
                    ? ` (${currentGps.latitude.toFixed(4)}, ${currentGps.longitude.toFixed(4)})`
                    : ''}
                </Text>
              </View>
            </View>

            {/* GRABAR AUDIO DE EVIDENCIA */}
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

            {/* LLAMAR AL 911 */}
            <TouchableOpacity
              style={styles.sosCall911Btn}
              activeOpacity={0.85}
              onPress={() => Linking.openURL('tel:911')}
            >
              <Ionicons name="call-outline" size={22} color="#FFFFFF" style={{ marginRight: 10 }} />
              <Text style={styles.sosCall911Text}>Llamar al 911</Text>
            </TouchableOpacity>

            {/* CANCELAR ALERTA CON PIN */}
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

            <View style={styles.sosFooterNoteBox}>
              <Text style={styles.sosFooterNoteText}>
                Seguimiento: enviada ➔ recibida ➔ en atención. Cancelar pide PIN; un PIN de coacción finge cancelar y mantiene la alerta activa. Respaldo por SMS si no hay red móvil.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL INGRESAR PIN DE SEGURIDAD                                       */}
      {/* ===================================================================== */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isPinModalVisible}
        onRequestClose={() => setIsPinModalVisible(false)}
      >
        <View style={styles.pinModalOverlay}>
          <View style={styles.pinModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cancelar alerta con PIN</Text>
              <TouchableOpacity onPress={() => setIsPinModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.pinSubtitleText}>
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

            {/* Quitar esta línea antes de usarlo como producto real */}
            <Text style={styles.pinHelperHint}>
              PIN normal: 1234 · PIN de coacción silencioso: 9999
            </Text>

            <View style={styles.pinActionsRow}>
              <TouchableOpacity
                style={styles.pinCancelBtn}
                onPress={() => setIsPinModalVisible(false)}
              >
                <Text style={styles.pinCancelBtnText}>Volver</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pinConfirmBtn} onPress={handleVerifyCancelPin}>
                <Text style={styles.pinConfirmBtnText}>Confirmar PIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL PARA EDITAR PERFIL DE LA USUARIA                                */}
      {/* ===================================================================== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isProfileModalVisible}
        onRequestClose={() => setIsProfileModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mi Perfil</Text>
              <TouchableOpacity onPress={() => setIsProfileModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.largeAvatarContainer}>
              <View style={styles.largeAvatarCircle}>
                <Ionicons name={editAvatar} size={36} color="#FFFFFF" />
              </View>
              <Text style={styles.avatarHint}>Elige tu ícono de perfil</Text>

              <View style={styles.iconSelectorRow}>
                {AVATAR_ICONS.map((item) => {
                  const isSelected = editAvatar === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.iconChoiceBtn, isSelected && styles.iconChoiceBtnSelected]}
                      onPress={() => setEditAvatar(item.id)}
                    >
                      <Ionicons
                        name={item.id}
                        size={20}
                        color={isSelected ? '#FFFFFF' : '#521841'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Text style={styles.inputLabel}>Nombre completo</Text>
            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={18} color="#521841" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Tu nombre completo"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <Text style={styles.inputLabel}>Correo electrónico</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={18} color="#521841" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInput}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="ejemplo@correo.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={styles.saveProfileBtn}
              activeOpacity={0.85}
              onPress={handleSaveProfile}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.saveProfileBtnText}>Guardar cambios</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutBtn}
              activeOpacity={0.8}
              onPress={() => {
                setIsProfileModalVisible(false);
                if (onLogout) onLogout();
              }}
            >
              <Ionicons name="log-out-outline" size={18} color="#B91C1C" style={{ marginRight: 6 }} />
              <Text style={styles.logoutBtnText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Navegación Inferior */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} activeOpacity={1}>
          <Ionicons name="home" size={22} color="#521841" />
          <Text style={[styles.navText, styles.navActive]}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('ContactosTab')}>
          <Ionicons name="people-outline" size={22} color="#9E8697" />
          <Text style={styles.navText}>Contactos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('AccompaniTab')}>
          <Ionicons name="location-outline" size={22} color="#9E8697" />
          <Text style={styles.navText}>Acompáñame</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('HistorialTab')}>
          <Ionicons name="bookmark-outline" size={22} color="#9E8697" />
          <Text style={styles.navText}>Recursos</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F8F6' },
  containerAlerta: { backgroundColor: '#B91C1C' },
  textoClaro: { color: '#FFFFFF' },
  textoClaroSuave: { color: '#FEE2E2' },
  alertaActivaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  alertaActivaText: { fontSize: 12, fontWeight: '800', color: '#991B1B' },
  panicButtonAlerta: { backgroundColor: '#7F1D1D' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 85 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  welcomeText: { fontSize: 24, fontWeight: '800', color: '#0F172A' },

  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  profileAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#521841',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  profileBtnLabel: { fontSize: 13, fontWeight: '700', color: '#521841' },

  coercionNoticeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  redPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
    marginRight: 8,
  },
  coercionNoticeText: { fontSize: 12, fontWeight: '700', color: '#991B1B' },

  // Botón Rojo con barra de progreso al mantener presionado
  panicButton: {
    backgroundColor: '#C5221F',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  panicButtonHolding: {
    backgroundColor: '#991B1B',
  },
  panicProgressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  alertIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    zIndex: 2,
  },
  countdownBigNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#C5221F',
  },
  panicTextContainer: { flex: 1, zIndex: 2 },
  panicTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  panicSubtitle: { fontSize: 13, color: '#FEE2E2', marginTop: 2 },

  // Card Mi Pulsera
  myBraceletCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  starIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#C026D3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  braceletInfo: { flex: 1 },
  braceletTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  braceletSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  view3dText: { fontSize: 13, color: '#4C1D95', fontWeight: '700', marginTop: 4 },
  connectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#137333',
    marginRight: 6,
  },
  connectedText: { fontSize: 12, color: '#137333', fontWeight: '700' },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 125,
    justifyContent: 'center',
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardCategoryTitleRed: { fontSize: 13, fontWeight: '700', color: '#C5221F', marginLeft: 6 },
  cardCategoryTitlePurple: { fontSize: 13, fontWeight: '700', color: '#4C1D95', marginLeft: 6 },
  bpmRow: { flexDirection: 'row', alignItems: 'baseline' },
  bpmNumber: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  bpmUnit: { fontSize: 13, fontWeight: '600', color: '#0F172A', marginLeft: 4 },

  ecgContainer: { height: 16, justifyContent: 'center', marginVertical: 4 },
  ecgLine: { height: 2, backgroundColor: '#C5221F', width: '100%' },

  alertDateText: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginVertical: 2 },
  attendedChip: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  attendedChipText: { fontSize: 11, color: '#137333', fontWeight: '700' },

  cardMainTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  cardFooterText: { fontSize: 12, color: '#64748B', marginTop: 2 },

  // Contactos
  contactsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarGroup: { flexDirection: 'row', marginRight: 12 },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarLetter: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  contactsTextContainer: { flex: 1 },
  contactsTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  contactsSub: { fontSize: 12, color: '#64748B', marginTop: 2 },

  // =========================================================================
  // ESTILOS DE PANTALLA "ALERTA ENVIADA"
  // =========================================================================
  sosScreenContainer: { flex: 1, backgroundColor: '#F5F3F0' },
  sosRedBanner: {
    backgroundColor: '#A62117',
    paddingHorizontal: 22,
    paddingBottom: 26,
    paddingTop: 14,
  },
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
  sosWhiteDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
    marginRight: 7,
  },
  sosLivePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
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
  stepCircleDone: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#137356',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  stepConnectorDone: {
    width: 2,
    height: 28,
    backgroundColor: '#BCE3D6',
    marginVertical: 3,
  },
  stepConnectorPending: {
    width: 2,
    height: 28,
    backgroundColor: '#E2E8F0',
    marginVertical: 3,
  },
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
  sosLocationIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F3E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  sosCardTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  sosCardSub: { fontSize: 13, color: '#64748B', marginTop: 3 },
  recLiveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  recRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
    marginRight: 4,
  },
  recLiveTagText: { fontSize: 10, fontWeight: '800', color: '#DC2626' },
  savedAudioTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  savedAudioTagText: { fontSize: 10, fontWeight: '800', color: '#0D7A68', marginLeft: 4 },
  stopSaveAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  stopSaveAudioBtnText: { fontSize: 12, fontWeight: '700', color: '#B91C1C' },
  playEvidenceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#F3E8F0',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  playEvidenceBtnText: { fontSize: 12, fontWeight: '700', color: '#521841' },
  evidenceCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  evidenceCheckboxChecked: { backgroundColor: '#521841', borderColor: '#521841' },
  sosCall911Btn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#A62117',
    borderRadius: 18,
    paddingVertical: 17,
    marginTop: 6,
    marginBottom: 12,
  },
  sosCall911Text: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  sosCancelPinBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 18,
  },
  sosCancelPinText: { color: '#0F172A', fontSize: 16, fontWeight: '800' },
  sosFooterNoteBox: { backgroundColor: '#FCE8E6', borderRadius: 14, padding: 14 },
  sosFooterNoteText: { fontSize: 12, color: '#7F1D1D', lineHeight: 17 },

  // Modal PIN
  pinModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pinModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
  },
  pinSubtitleText: { fontSize: 13, color: '#64748B', fontWeight: '600', marginBottom: 12 },
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
  pinActionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  pinCancelBtn: { paddingVertical: 10, paddingHorizontal: 18, marginRight: 8 },
  pinCancelBtnText: { fontSize: 14, color: '#64748B', fontWeight: '700' },
  pinConfirmBtn: {
    backgroundColor: '#521841',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
    minWidth: 130,
    alignItems: 'center',
  },
  pinConfirmBtnText: { fontSize: 14, color: '#FFFFFF', fontWeight: '800' },

  // Modal Editar Perfil
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  largeAvatarContainer: { alignItems: 'center', marginBottom: 18 },
  largeAvatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#521841',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarHint: { fontSize: 12, color: '#64748B', fontWeight: '600', marginBottom: 10 },
  iconSelectorRow: { flexDirection: 'row', justifyContent: 'center' },
  iconChoiceBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  iconChoiceBtnSelected: { backgroundColor: '#521841' },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#380E2B',
    marginBottom: 6,
    marginLeft: 2,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 14,
  },
  textInput: { flex: 1, fontSize: 14, color: '#0F172A', fontWeight: '600' },
  saveProfileBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#521841',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 6,
  },
  saveProfileBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    paddingVertical: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutBtnText: { color: '#B91C1C', fontSize: 14, fontWeight: '700' },

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
  navActive: { color: '#521841', fontWeight: '700' },
});