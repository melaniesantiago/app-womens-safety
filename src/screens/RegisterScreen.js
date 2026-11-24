import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function RegisterScreen({ onRegisterSuccess, onNavigateToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityPin, setSecurityPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword || !securityPin) {
      Alert.alert('Campos incompletos', 'Por favor llena todos los campos requeridos, incluyendo tu PIN.');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Correo inválido', 'Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (password.length < 4) {
      Alert.alert('Contraseña corta', 'La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error de contraseña', 'Las contraseñas no coinciden. Por favor verifica.');
      return;
    }

    if (securityPin.length !== 4 || !/^\d{4}$/.test(securityPin)) {
      Alert.alert('PIN inválido', 'Tu PIN de seguridad debe ser exactamente de 4 números (ej. 4821).');
      return;
    }

    if (securityPin === '9999') {
      Alert.alert(
        'PIN reservado',
        'El código 9999 está reservado para el modo de coacción silenciosa. Elige otros 4 dígitos.'
      );
      return;
    }

    Alert.alert(
      '¡Registro Exitoso!',
      `Tu cuenta y tu PIN de cancelación (${securityPin}) han sido configurados. Ahora inicia sesión.`,
      [
        {
          text: 'Ir a Iniciar Sesión',
          onPress: () => {
            if (onRegisterSuccess) {
              onRegisterSuccess({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                pin: securityPin,
              });
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      {/* Cabecera curva guinda */}
      <View style={styles.topHeaderBanner}>
        <SafeAreaView edges={['top']} style={styles.bannerInner}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="watch-variant" size={28} color="#521841" />
            <View style={styles.miniShield}>
              <Ionicons name="shield-checkmark" size={13} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.headerTitle}>Crea tu cuenta</Text>
          <Text style={styles.headerSubtitle}>
            Configura tu acceso y tu PIN personal de seguridad
          </Text>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.formScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Registro de usuaria</Text>

            {/* Nombre Completo */}
            <Text style={styles.label}>Nombre completo</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={19} color="#521841" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Tu nombre completo"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Correo Electrónico */}
            <Text style={styles.label}>Correo electrónico</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={19} color="#521841" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="ejemplo@correo.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Contraseña */}
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={19} color="#521841" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            {/* Confirmar Contraseña */}
            <Text style={styles.label}>Confirmar contraseña</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="shield-checkmark-outline" size={19} color="#521841" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            {/* PIN de Cancelación Segura */}
            <View style={styles.pinHeaderRow}>
              <Text style={styles.label}>PIN de cancelación de alerta (4 dígitos)</Text>
              <View style={styles.pinBadge}>
                <Text style={styles.pinBadgeText}>Requerido SOS</Text>
              </View>
            </View>
            <View style={[styles.inputWrapper, styles.pinInputWrapper]}>
              <Ionicons name="keypad" size={19} color="#0D7A68" style={styles.icon} />
              <TextInput
                style={[styles.input, styles.pinInputText]}
                placeholder="Ej. 2580"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={4}
                value={securityPin}
                onChangeText={(txt) => setSecurityPin(txt.replace(/[^0-9]/g, ''))}
              />
            </View>
            <Text style={styles.pinHint}>
              Este código te será solicitado para detener una alerta de emergencia activa.
            </Text>

            {/* Botón Crear Cuenta */}
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.88}
              onPress={handleRegister}
            >
              <Text style={styles.primaryBtnText}>Crear cuenta segura</Text>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            {/* Enlace hacia LoginScreen */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>¿Ya tienes una cuenta?</Text>
              <TouchableOpacity onPress={onNavigateToLogin}>
                <Text style={styles.loginLink}> Inicia sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9F8F6',
  },
  topHeaderBanner: {
    backgroundColor: '#521841',
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 10,
  },
  bannerInner: {
    alignItems: 'center',
  },
  logoBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 4,
  },
  miniShield: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0D7A68',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#F3E8F0',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 14,
  },
  formScroll: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 34,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#380E2B',
    marginBottom: 5,
    marginLeft: 2,
  },
  pinHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  pinBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pinBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D7A68',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 13,
  },
  pinInputWrapper: {
    borderColor: '#0D7A68',
    backgroundColor: '#F0FDF9',
    marginBottom: 6,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  pinInputText: {
    letterSpacing: 6,
    fontSize: 16,
    fontWeight: '800',
    color: '#0D7A68',
  },
  pinHint: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 16,
    marginLeft: 2,
  },
  primaryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#521841',
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 4,
    elevation: 2,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  loginText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  loginLink: {
    fontSize: 13,
    color: '#521841',
    fontWeight: '800',
  },
});