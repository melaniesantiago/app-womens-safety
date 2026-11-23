import React, { useState, useEffect } from 'react';
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
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const AVATAR_ICONS = [
  { id: 'person', label: 'Clásico' },
  { id: 'shield-checkmark', label: 'Protegida' },
  { id: 'heart', label: 'Cuidado' },
  { id: 'sparkles', label: 'Estrella' },
  { id: 'flower', label: 'Flor' }
];

export default function HomeScreen({ user, setUser, onLogout }) {
  const navigation = useNavigation();

  // Estados para editar el perfil
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatarIcon || 'person');

  // Sincronizar campos cuando cambia el usuario
  useEffect(() => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditAvatar(user?.avatarIcon || 'person');
  }, [user]);

  // Muestra el nombre de la usuaria (ej. "Melisanresendiz" o el nombre editado)
  const displayName = user?.name ? user.name.trim().split(' ')[0] : 'Usuaria';
  const currentAvatar = user?.avatarIcon || 'person';

  // Fecha actual formateada en español
  const getFormattedDate = () => {
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const hoy = new Date();
    return `${dias[hoy.getDay()]} ${hoy.getDate()} de ${meses[hoy.getMonth()]}`;
  };

  // Guardar cambios de perfil en el estado global
  const handleSaveProfile = () => {
    if (!editName.trim()) {
      Alert.alert('Nombre requerido', 'Por favor escribe tu nombre para actualizar tu perfil.');
      return;
    }

    if (setUser) {
      setUser(prev => ({
        ...prev,
        name: editName.trim(),
        email: editEmail.trim() || prev?.email,
        avatarIcon: editAvatar
      }));
    }

    setIsProfileModalVisible(false);
    Alert.alert('Perfil actualizado 💜', 'Tus datos se han guardado correctamente.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header con Botón de Perfil en la esquina superior derecha */}
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.dateText}>{getFormattedDate()}</Text>
            <Text style={styles.welcomeText} numberOfLines={1}>
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

        {/* Botón Rojo Pedir Ayuda */}
        <TouchableOpacity 
          style={styles.panicButton}
          activeOpacity={0.88}
          onLongPress={() => navigation?.navigate('ActiveAlert')}
          delayLongPress={3000}
        >
          <View style={styles.alertIconCircle}>
            <Ionicons name="warning-outline" size={28} color="#C5221F" />
          </View>
          <View style={styles.panicTextContainer}>
            <Text style={styles.panicTitle}>Pedir ayuda</Text>
            <Text style={styles.panicSubtitle}>Mantén presionado 3 segundos</Text>
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
            <Text style={styles.braceletSub}>Batería 82 % • LoRa • GPS fijo</Text>
            <Text style={styles.view3dText}>Ver en 3D</Text>
          </View>
          <View style={styles.connectedChip}>
            <View style={styles.greenDot} />
            <Text style={styles.connectedText}>Conectada</Text>
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
              <Text style={styles.bpmNumber}>76</Text>
              <Text style={styles.bpmUnit}>lpm</Text>
            </View>

            <View style={styles.ecgContainer}>
              <View style={styles.ecgLine} />
            </View>

            <Text style={styles.cardFooterText}>GPS, LoRa, voz y más</Text>
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
            <Text style={styles.alertDateText}>3 nov • 18:32</Text>
            <View style={styles.attendedChip}>
              <Text style={styles.attendedChipText}>Atendida</Text>
            </View>
            <Text style={styles.cardFooterText}>Hora, lugar y pulso</Text>
          </TouchableOpacity>

          {/* Card Acompáñame */}
          <TouchableOpacity 
            style={styles.gridCard}
            onPress={() => navigation?.navigate('AccompaniTab')}
          >
            <Ionicons name="location-outline" size={22} color="#4C1D95" style={{ marginBottom: 8 }} />
            <Text style={styles.cardMainTitle}>Acompáñame</Text>
            <Text style={styles.cardFooterText}>Comparte tu trayecto</Text>
          </TouchableOpacity>

          {/* Card Probar Alerta */}
          <TouchableOpacity 
            style={styles.gridCard}
            onPress={() => navigation?.navigate('ActiveAlert')}
          >
            <MaterialCommunityIcons name="pulse" size={22} color="#4C1D95" style={{ marginBottom: 8 }} />
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
            
            {/* Encabezado Modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mi Perfil</Text>
              <TouchableOpacity onPress={() => setIsProfileModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Avatar Grande */}
            <View style={styles.largeAvatarContainer}>
              <View style={styles.largeAvatarCircle}>
                <Ionicons name={editAvatar} size={36} color="#FFFFFF" />
              </View>
              <Text style={styles.avatarHint}>Elige tu ícono de perfil</Text>

              {/* Selector de íconos */}
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

            {/* Campo Nombre */}
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

            {/* Campo Correo */}
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

            {/* Botón Guardar Cambios */}
            <TouchableOpacity 
              style={styles.saveProfileBtn} 
              activeOpacity={0.85}
              onPress={handleSaveProfile}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveProfileBtnText}>Guardar cambios</Text>
            </TouchableOpacity>

            {/* Botón Cerrar Sesión */}
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 85 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dateText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  welcomeText: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  
  // Botón de Perfil en esquina superior derecha
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
  profileBtnLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#521841',
  },

  // Botón Rojo
  panicButton: {
    backgroundColor: '#C5221F',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3
  },
  alertIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  panicTextContainer: { flex: 1 },
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
    borderColor: '#E2E8F0'
  },
  starIconBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#C026D3', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  braceletInfo: { flex: 1 },
  braceletTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  braceletSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  view3dText: { fontSize: 13, color: '#4C1D95', fontWeight: '700', marginTop: 4 },
  connectedChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E6F4EA', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#137333', marginRight: 6 },
  connectedText: { fontSize: 12, color: '#137333', fontWeight: '700' },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 125,
    justifyContent: 'center'
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
  attendedChip: { backgroundColor: '#E6F4EA', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 4 },
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
    borderColor: '#E2E8F0'
  },
  avatarGroup: { flexDirection: 'row', marginRight: 12 },
  avatarCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  avatarLetter: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  contactsTextContainer: { flex: 1 },
  contactsTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  contactsSub: { fontSize: 12, color: '#64748B', marginTop: 2 },

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
  iconChoiceBtnSelected: {
    backgroundColor: '#521841',
  },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#380E2B', marginBottom: 6, marginLeft: 2 },
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
  navActive: { color: '#521841', fontWeight: '700' }
});