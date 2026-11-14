import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Modal,
  TextInput,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export default function ContactsScreen({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  // Contactos de la Red de Confianza
  // Agrega el número de tu mamá en 'phone' (ej: '7711234567') para ir directo a su chat
  const [contacts, setContacts] = useState([
    {
      id: '1',
      name: 'Mamá',
      phone: '', // <--- Pon aquí su número de 10 dígitos para ir directo a su chat
      channel: 'SMS y llamada',
      status: 'Aceptó',
      statusType: 'accepted',
      avatarColor: '#521841',
      initials: 'M',
      liveLocation: true,
    },
    {
      id: '2',
      name: 'Valeria',
      phone: '',
      channel: 'WhatsApp',
      status: 'Aceptó',
      statusType: 'accepted',
      avatarColor: '#0D7A68',
      initials: 'V',
      liveLocation: true,
    },
    {
      id: '3',
      name: 'Diego (hermano)',
      phone: '',
      channel: 'Notificación en la app',
      status: 'Pendiente',
      statusType: 'pending',
      avatarColor: '#8C4A00',
      initials: 'D',
      liveLocation: false,
    },
  ]);

  // Cambiar visibilidad de ubicación
  const toggleLiveLocation = (id) => {
    setContacts(prev =>
      prev.map(item => {
        if (item.id === id) {
          const nextLocationState = !item.liveLocation;
          const nextStatus = (nextLocationState && item.statusType === 'pending') ? 'Aceptó' : item.status;
          const nextStatusType = (nextLocationState && item.statusType === 'pending') ? 'accepted' : item.statusType;
          
          return { 
            ...item, 
            liveLocation: nextLocationState,
            status: nextStatus,
            statusType: nextStatusType
          };
        }
        return item;
      })
    );
  };

  // Eliminar contacto
  const handleDeleteContact = (id, name) => {
    Alert.alert(
      'Eliminar contacto',
      `¿Estás segura de eliminar a ${name} de tu Red de Confianza?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => {
            setContacts(prev => prev.filter(c => c.id !== id));
          }
        }
      ]
    );
  };

  // Guardar nuevo contacto
  const handleSaveNewContact = () => {
    if (!newContactName.trim()) {
      Alert.alert('Atención', 'Por favor ingresa el nombre o parentesco de tu contacto.');
      return;
    }

    const initials = newContactName.trim().charAt(0).toUpperCase();
    const colors = ['#6B21A8', '#0369A1', '#B91C1C', '#047857', '#C2410C', '#521841'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newEntry = {
      id: Date.now().toString(),
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      channel: 'WhatsApp',
      status: 'Aceptó',
      statusType: 'accepted',
      avatarColor: randomColor,
      initials: initials,
      liveLocation: true,
    };

    setContacts(prev => [...prev, newEntry]);
    setNewContactName('');
    setNewContactPhone('');
    setModalVisible(false);

    Alert.alert('¡Contacto Agregado!', `${newEntry.name} se añadió a tu Red de Confianza.`);
  };

  // APERTURA DIRECTA AL CHAT PRIVADO DEL CONTACTO CON MENSAJE PRE-CARGADO
  const handleOpenDirectChat = async (contact) => {
    let rawPhone = contact.phone ? contact.phone.replace(/[^0-9]/g, '') : '';

    // Si el contacto no tiene número guardado, lo pide rápidamente
    if (!rawPhone) {
      Alert.prompt(
        `Número de ${contact.name}`,
        'Ingresa el número de WhatsApp a 10 dígitos para ir directo a su chat:',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Ir a WhatsApp',
            onPress: (inputPhone) => {
              if (inputPhone) {
                // Actualiza el contacto en el estado para recordar su número
                setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, phone: inputPhone } : c));
                sendWhatsAppToPhone(inputPhone, contact.name);
              }
            }
          }
        ],
        'plain-text'
      );
    } else {
      sendWhatsAppToPhone(rawPhone, contact.name);
    }
  };

  const sendWhatsAppToPhone = async (phoneNumber, name) => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      let lat = 20.1297;
      let lon = -99.2310;

      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        lat = location.coords.latitude;
        lon = location.coords.longitude;
      }

      const mapsUrl = `https://maps.google.com/?q=${lat},${lon}`;
      const textMessage = `🚨 *ALERTA SAFEWAVE* 🚨\n¡Hola ${name}! Te comparto mi ubicación exacta en tiempo real:\n${mapsUrl}`;

      // Formatear para México (+52) si tiene 10 dígitos
      let cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      if (cleanPhone.length === 10) {
        cleanPhone = `52${cleanPhone}`;
      }

      const whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(textMessage)}`;
      const fallbackUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(textMessage)}`;

      const supported = await Linking.canOpenURL(whatsappUrl);

      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Linking.openURL(fallbackUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir el chat de WhatsApp.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Encabezado */}
        <Text style={styles.title}>Red de confianza</Text>
        <Text style={styles.subtitle}>
          Reciben tus alertas. Puedes tener hasta 5 contactos.
        </Text>

        {/* Tarjeta Institucional */}
        <View style={styles.institutionalCard}>
          <View style={styles.instIconCircle}>
            <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.instTextContainer}>
            <Text style={styles.instTitle}>Instancia de la Mujer</Text>
            <Text style={styles.instSub}>
              Recibe siempre tus alertas en su panel de monitoreo
            </Text>
          </View>
          <Ionicons name="lock-closed-outline" size={18} color="#521841" style={styles.lockIcon} />
        </View>

        {/* Lista de Contactos */}
        {contacts.map((contact) => (
          <View key={contact.id} style={styles.contactCard}>
            
            {/* Toca para abrir directamente el chat de este contacto */}
            <TouchableOpacity 
              style={styles.contactHeader}
              activeOpacity={0.7}
              onPress={() => handleOpenDirectChat(contact)}
            >
              <View style={[styles.avatar, { backgroundColor: contact.avatarColor }]}>
                <Text style={styles.avatarText}>{contact.initials}</Text>
              </View>

              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactChannel}>
                  {contact.phone ? `Tel: ${contact.phone}` : 'Toca para registrar número y enviar'}
                </Text>
              </View>

              <View style={[
                styles.statusBadge, 
                contact.statusType === 'accepted' ? styles.badgeAccepted : styles.badgePending
              ]}>
                <Text style={[
                  styles.statusText, 
                  contact.statusType === 'accepted' ? styles.textAccepted : styles.textPending
                ]}>
                  {contact.status}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.locationRow}>
              <TouchableOpacity 
                style={styles.checkboxTouch} 
                activeOpacity={0.7}
                onPress={() => toggleLiveLocation(contact.id)}
              >
                <MaterialCommunityIcons 
                  name={contact.liveLocation ? "checkbox-marked" : "checkbox-blank-outline"} 
                  size={22} 
                  color={contact.liveLocation ? "#521841" : "#94A3B8"} 
                />
                <Text style={styles.locationText}>Ver mi ubicación en vivo</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.deleteBtn}
                onPress={() => handleDeleteContact(contact.id, contact.name)}
              >
                <Feather name="trash-2" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>

          </View>
        ))}

        {/* Botón Agregar Contacto */}
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => {
            if (contacts.length >= 5) {
              Alert.alert('Límite alcanzado', 'Has llegado al límite máximo de 5 contactos.');
            } else {
              setModalVisible(true);
            }
          }}
        >
          <Feather name="plus" size={20} color="#521841" style={styles.addIcon} />
          <Text style={styles.addButtonText}>Agregar contacto</Text>
        </TouchableOpacity>

        <Text style={styles.helperText}>
          Le enviaremos una invitación. Solo queda activo cuando la acepta.
        </Text>

      </ScrollView>

      {/* Modal Agregar Contacto */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Agregar Contacto de Confianza</Text>
            <Text style={styles.modalSub}>
              Ingresa el nombre y número a 10 dígitos para enviar alertas directo a su chat.
            </Text>

            <Text style={styles.inputLabel}>Nombre / Parentesco</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ej. Abuela Elena, Hermana Sofía..."
              placeholderTextColor="#94A3B8"
              value={newContactName}
              onChangeText={setNewContactName}
            />

            <Text style={styles.inputLabel}>Número de WhatsApp (10 dígitos)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ej. 7711234567"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={newContactPhone}
              onChangeText={setNewContactPhone}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.saveBtn} 
                onPress={handleSaveNewContact}
              >
                <Text style={styles.saveBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* TabBar Inferior Alineado */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation?.navigate('MainTabs', { screen: 'InicioTab' })}
        >
          <Ionicons name="home-outline" size={24} color="#9E8697" />
          <Text style={styles.navText}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation?.navigate('MainTabs', { screen: 'MapaDeApoyo' })}
        >
          <Ionicons name="people" size={24} color="#521841" />
          <Text style={[styles.navText, styles.navTextActive]}>Contactos</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation?.navigate('MainTabs', { screen: 'MapaDeApoyo' })}
        >
          <Ionicons name="location-outline" size={24} color="#9E8697" />
          <Text style={styles.navText}>Acompáñame</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation?.navigate('MainTabs', { screen: 'HistorialTab' })}
        >
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

  title: { fontSize: 28, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4, marginBottom: 20, lineHeight: 20 },

  institutionalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8F0',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  instIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#521841',
    justify: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  instTextContainer: { flex: 1, paddingRight: 8 },
  instTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  instSub: { fontSize: 12, color: '#64748B', marginTop: 2, lineHeight: 16 },
  lockIcon: { opacity: 0.7 },

  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justify: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  contactChannel: { fontSize: 12, color: '#64748B', marginTop: 2 },

  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  badgeAccepted: { backgroundColor: '#E6F4EA' },
  badgePending: { backgroundColor: '#FEF3C7' },
  statusText: { fontSize: 12, fontWeight: '700' },
  textAccepted: { color: '#137333' },
  textPending: { color: '#B45309' },

  locationRow: {
    flexDirection: 'row',
    justify: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  checkboxTouch: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: { fontSize: 14, color: '#334155', fontWeight: '500', marginLeft: 8 },
  deleteBtn: { padding: 4 },

  addButton: {
    flexDirection: 'row',
    justify: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#521841',
    borderStyle: 'dashed',
    borderRadius: 18,
    paddingVertical: 14,
    marginTop: 8,
    marginBottom: 12,
  },
  addIcon: { marginRight: 8 },
  addButtonText: { fontSize: 15, fontWeight: '800', color: '#521841' },

  helperText: { fontSize: 12, color: '#64748B', textAlign: 'center', lineHeight: 18, paddingHorizontal: 10 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justify: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    elevation: 5,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 16, lineHeight: 18 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6 },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 14,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 18, marginRight: 8 },
  cancelBtnText: { fontSize: 14, color: '#64748B', fontWeight: '700' },
  saveBtn: { backgroundColor: '#521841', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 14 },
  saveBtnText: { fontSize: 14, color: '#FFFFFF', fontWeight: '800' },

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
  navItem: { 
    flex: 1,
    alignItems: 'center', 
    justify: 'center',
    paddingVertical: 6,
  },
  navText: { 
    fontSize: 11, 
    color: '#9E8697', 
    marginTop: 4, 
    fontWeight: '500',
    textAlign: 'center',
  },
  navTextActive: { 
    color: '#521841', 
    fontWeight: '700' 
  },
});