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

export default function LoginScreen({ onLogin, onNavigateToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLoginPress = () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Correo inválido', 'Por favor ingresa un correo electrónico válido.');
      return;
    }
    if (password.length < 4) {
      Alert.alert('Contraseña requerida', 'Ingresa tu contraseña (mínimo 4 caracteres).');
      return;
    }

    if (onLogin) {
      onLogin({ email: email.trim().toLowerCase() });
    }
  };

  const handleDemoAccess = () => {
    if (onLogin) {
      onLogin({
        name: 'Melisan Reséndiz',
        email: 'melisan@pulserasegura.mx',
      });
    }
  };

  return (
    <View style={styles.root}>
      {/* Cabecera curva guinda */}
      <View style={styles.topHeaderBanner}>
        <SafeAreaView edges={['top']} style={styles.bannerInner}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="watch-variant" size={30} color="#521841" />
            <View style={styles.miniShield}>
              <Ionicons name="shield-checkmark" size={13} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.headerTitle}>Bienvenida de nuevo</Text>
          <Text style={styles.headerSubtitle}>
            Inicia sesión para monitorear tu pulsera y tu red de confianza
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
          {/* Tarjeta principal */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Iniciar sesión</Text>

            {/* Campo Correo */}
            <Text style={styles.label}>Correo electrónico</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={19} color="#521841" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="tu.correo@ejemplo.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Campo Contraseña */}
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={19} color="#521841" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            {/* Botón Principal */}
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.88}
              onPress={handleLoginPress}
            >
              <Text style={styles.primaryBtnText}>Iniciar sesión</Text>
              <Ionicons name="arrow-forward" size={19} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            {/* Enlace clásico hacia RegisterScreen */}
            <View style={styles.switchPromptRow}>
              <Text style={styles.switchPromptText}>¿No tienes cuenta?</Text>
              <TouchableOpacity onPress={onNavigateToRegister}>
                <Text style={styles.switchPromptLink}> Regístrate ahora</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Acceso rápido demo para presentaciones */}
          <TouchableOpacity
            style={styles.demoAccessBtn}
            activeOpacity={0.8}
            onPress={handleDemoAccess}
          >
            <Ionicons name="flash-outline" size={16} color="#0D7A68" style={{ marginRight: 6 }} />
            <Text style={styles.demoAccessText}>Entrar con cuenta demo (Presentación)</Text>
          </TouchableOpacity>
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
    paddingBottom: 30,
    paddingTop: 12,
  },
  bannerInner: {
    alignItems: 'center',
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    elevation: 4,
  },
  miniShield: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0D7A68',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#F3E8F0',
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 14,
  },
  formScroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  cardHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 18,
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#380E2B',
    marginBottom: 6,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 16,
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
  primaryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#521841',
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 6,
    elevation: 2,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  switchPromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  switchPromptText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  switchPromptLink: {
    fontSize: 13,
    color: '#521841',
    fontWeight: '800',
  },
  demoAccessBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    borderWidth: 1,
    borderColor: '#BCE3D6',
    borderRadius: 16,
    paddingVertical: 13,
    marginTop: 16,
  },
  demoAccessText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D7A68',
  },
});