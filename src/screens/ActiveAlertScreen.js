import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  Linking,
  Modal,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ActiveAlertScreen({ navigation }) {
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');

  // PINs de prueba
  const REAL_PIN = '1234';
  const COERCION_PIN = '9999';

  // Realizar llamada al 911
  const handleCall911 = () => {
    Linking.openURL('tel:911').catch(() => {
      Alert.alert('Error', 'No se pudo abrir la aplicación de teléfono.');
    });
  };

  // Validar PIN ingresado
  const handleVerifyPin = () => {
    if (pinInput === REAL_PIN) {
      setIsPinModalVisible(false);
      setPinInput('');
      Alert.alert(
        'Alerta Cancelada',
        'Has cancelado la alerta de forma segura. La Instancia de la Mujer ha sido notificada.',
        [{ text: 'Entendido', onPress: () => navigation?.navigate('MainTabs', { screen: 'InicioTab' }) }]
      );
    } else if (pinInput === COERCION_PIN) {
      // PIN DE COACCIÓN: Finge cancelación visual pero mantiene alerta activa en segundo plano
      setIsPinModalVisible(false);
      setPinInput('');
      Alert.alert(
        'Alerta Desactivada',
        'La alerta ha sido finalizada correctamente.',
        [{ text: 'Aceptar', onPress: () => navigation?.navigate('MainTabs', { screen: 'InicioTab' }) }]
      );
    } else {
      Alert.alert('PIN Incorrecto', 'El PIN de seguridad ingresado no es válido.');
      setPinInput('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* BANNER ROJO INSTITUCIONAL: ALERTA EN CURSO */}
        <View style={styles.alertBanner}>
          <View style={styles.badgeEnCurso}>
            <View style={styles.whiteDot} />
            <Text style={styles.badgeEnCursoText}>EN CURSO · 18:32</Text>
          </View>
          <Text style={styles.alertTitle}>Alerta enviada</Text>
          <Text style={styles.alertSub}>
            La ayuda ya está en camino. Mantén la pulsera contigo.
          </Text>
        </View>

        {/* TIMELINE DE SEGUIMIENTO PASO A PASO */}
        <View style={styles.timelineCard}>
          
          {/* Paso 1: Enviada */}
          <View style={styles.timelineItem}>
            <View style={styles.iconColumn}>
              <View style={styles.checkCircleCompleted}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.timelineLineActive} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.stepTitle}>Enviada desde la pulsera</Text>
              <Text style={styles.stepSub}>18:32 · vía SMS </Text>
            </View>
          </View>

          {/* Paso 2: Recibida */}
          <View style={styles.timelineItem}>
            <View style={styles.iconColumn}>
              <View style={styles.checkCircleCompleted}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.timelineLineActive} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.stepTitle}>Recibida por la Instancia de la Mujer</Text>
              <Text style={styles.stepSub}>18:32 · panel de monitoreo</Text>
            </View>
          </View>

          {/* Paso 3: Contactos avisados */}
          <View style={styles.timelineItem}>
            <View style={styles.iconColumn}>
              <View style={styles.checkCircleCompleted}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.timelineLineActive} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.stepTitle}>Contactos avisados</Text>
              <Text style={styles.stepSub}>Mamá y Valeria recibieron tu ubicación</Text>
            </View>
          </View>

          {/* Paso 4: En atención */}
          <View style={styles.timelineItem}>
            <View style={styles.iconColumn}>
              <View style={styles.circlePending}>
                <View style={styles.circlePendingInner} />
              </View>
            </View>
            <View style={styles.timelineContent}>
              <Text style={[styles.stepTitle, { color: '#B91C1C' }]}>En atención</Text>
              <Text style={styles.stepSub}>Una operadora está revisando tu ubicación</Text>
            </View>
          </View>

        </View>

        {/* UBICACIÓN COMPARTIDA */}
        <View style={styles.infoBox}>
          <View style={styles.purpleIconBox}>
            <Ionicons name="location" size={20} color="#521841" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoBoxTitle}>Ubicación compartida</Text>
            <Text style={styles.infoBoxSub}>GPS de la pulsera · precisión 8 m</Text>
          </View>
        </View>

        {/* GRABAR AUDIO DE EVIDENCIA */}
        <TouchableOpacity 
          style={styles.infoBox}
          activeOpacity={0.8}
          onPress={() => setIsRecordingAudio(!isRecordingAudio)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.infoBoxTitle}>Grabar audio de evidencia</Text>
            <Text style={styles.infoBoxSub}>Se guarda cifrado, solo tú decides compartirlo</Text>
          </View>
          <View style={[styles.checkbox, isRecordingAudio && styles.checkboxChecked]}>
            {isRecordingAudio && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
          </View>
        </TouchableOpacity>

        {/* BOTÓN LLAMAR AL 911 */}
        <TouchableOpacity 
          style={styles.call911Btn} 
          activeOpacity={0.8}
          onPress={handleCall911}
        >
          <Ionicons name="call" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.call911BtnText}>Llamar al 911</Text>
        </TouchableOpacity>

        {/* BOTÓN CANCELAR ALERTA CON PIN */}
        <TouchableOpacity 
          style={styles.cancelPinBtn} 
          activeOpacity={0.8}
          onPress={() => setIsPinModalVisible(true)}
        >
          <Text style={styles.cancelPinBtnText}>Cancelar alerta con PIN</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* MODAL DE INGRESO DE PIN */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isPinModalVisible}
        onRequestClose={() => setIsPinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Ingresa tu PIN de Seguridad</Text>
            <Text style={styles.modalSub}>
              Para desactivar la alerta en curso, ingresa tu código de 4 dígitos.
            </Text>

            <TextInput
              style={styles.pinInput}
              keyboardType="numeric"
              secureTextEntry={true}
              maxLength={4}
              placeholder="••••"
              placeholderTextColor="#94A3B8"
              value={pinInput}
              onChangeText={setPinInput}
              autoFocus={true}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelBtn} 
                onPress={() => setIsPinModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Volver</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalConfirmBtn} 
                onPress={handleVerifyPin}
              >
                <Text style={styles.modalConfirmBtnText}>Desactivar</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.pinTipText}>
              💡 PIN Real Demo: <Text style={{ fontWeight: '800' }}>1234</Text> | PIN Coacción: <Text style={{ fontWeight: '800' }}>9999</Text>
            </Text>
          </View>
        </View>
      </Modal>

      {/* TabBar Inferior */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('MainTabs', { screen: 'InicioTab' })}>
          <Ionicons name="home-outline" size={24} color="#9E8697" />
          <Text style={styles.navText}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('MainTabs', { screen: 'ContactosTab' })}>
          <Ionicons name="people-outline" size={24} color="#9E8697" />
          <Text style={styles.navText}>Contactos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('MainTabs', { screen: 'AccompaniTab' })}>
          <Ionicons name="location-outline" size={24} color="#9E8697" />
          <Text style={styles.navText}>Acompáñame</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="bookmark" size={24} color="#521841" />
          <Text style={[styles.navText, styles.navTextActive]}>Recursos</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 100 },

  alertBanner: {
    backgroundColor: '#B91C1C',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  badgeEnCurso: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  whiteDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF', marginRight: 6 },
  badgeEnCursoText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  alertTitle: { fontSize: 30, fontWeight: '900', color: '#FFFFFF', marginBottom: 4, letterSpacing: -0.5 },
  alertSub: { fontSize: 14, color: '#FEE2E2', lineHeight: 20, fontWeight: '500' },

  timelineCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 14,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineItem: { flexDirection: 'row', marginBottom: 4 },
  iconColumn: { alignItems: 'center', marginRight: 14, width: 24 },
  checkCircleCompleted: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#0D7A68', justifyContent: 'center', alignItems: 'center' },
  timelineLineActive: { width: 2, height: 32, backgroundColor: '#0D7A68', marginVertical: 2 },
  circlePending: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#B91C1C', justifyContent: 'center', alignItems: 'center' },
  circlePendingInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#B91C1C' },
  timelineContent: { flex: 1, paddingBottom: 12 },
  stepTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  stepSub: { fontSize: 12, color: '#64748B', marginTop: 2 },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  purpleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F3E8F0',
    justify: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoBoxTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  infoBoxSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#521841', borderColor: '#521841' },

  call911Btn: {
    flexDirection: 'row',
    justify: 'center',
    alignItems: 'center',
    backgroundColor: '#B91C1C',
    marginHorizontal: 20,
    borderRadius: 18,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  call911BtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },

  cancelPinBtn: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  cancelPinBtnText: { color: '#0F172A', fontSize: 16, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  modalContainer: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', textAlign: 'center' },
  modalSub: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 6, marginBottom: 20, lineHeight: 18 },
  pinInput: {
    width: '80%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingVertical: 12,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 12,
    color: '#0F172A',
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalCancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', marginRight: 8, borderRadius: 14, backgroundColor: '#F1F5F9' },
  modalCancelBtnText: { color: '#64748B', fontWeight: '800', fontSize: 15 },
  modalConfirmBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', marginLeft: 8, borderRadius: 14, backgroundColor: '#B91C1C' },
  modalConfirmBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  pinTipText: { fontSize: 11, color: '#64748B', marginTop: 16 },

  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 68,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justify: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: 4,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  navText: { fontSize: 11, color: '#9E8697', marginTop: 4, fontWeight: '500', textAlign: 'center' },
  navTextActive: { color: '#521841', fontWeight: '700' },
});