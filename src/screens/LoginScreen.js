import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ onLogin, onNavigateToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginPress = () => {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      Alert.alert('Correo requerido', 'Por favor ingresa tu correo electrónico para continuar.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      Alert.alert('Correo no válido', 'Ingresa un correo electrónico válido (ejemplo@correo.com).');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Contraseña requerida', 'Por favor ingresa tu contraseña.');
      return;
    }

    onLogin({ email: cleanEmail });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2EBF0" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          
          <View style={styles.logoContainer}>
            <View style={styles.symbolBadge}>
              <Text style={styles.logoIcon}>♀</Text>
            </View>
            <Text style={styles.title}>WOMEN SAFETY</Text>
            <Text style={styles.subtitle}>Inicia sesión para mantenerte protegida</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={18} color="#521841" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="ejemplo@correo.com"
                placeholderTextColor="#9E8697"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={18} color="#521841" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#9E8697"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginButton} activeOpacity={0.85} onPress={handleLoginPress}>
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>¿No tienes una cuenta? </Text>
              <TouchableOpacity 
                activeOpacity={0.6}
                onPress={() => {
                  if (onNavigateToRegister) onNavigateToRegister();
                }}
              >
                <Text style={styles.registerLink}>Regístrate</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EBF0' },
  keyboardView: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  symbolBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DFD2DC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CFC0CC',
    marginBottom: 12,
  },
  logoIcon: { fontSize: 30, color: '#521841', fontWeight: 'bold' },
  title: { fontSize: 22, fontWeight: '800', color: '#380E2B', letterSpacing: 1 },
  subtitle: { fontSize: 12, color: '#785970', marginTop: 4, fontWeight: '600' },
  form: { width: '100%' },
  label: { fontSize: 12, fontWeight: '700', color: '#380E2B', marginBottom: 6, marginLeft: 2 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E4D8E2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D4C2D0',
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 48,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: '#380E2B', fontSize: 14 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotPasswordText: { fontSize: 11, color: '#521841', fontWeight: '600' },
  loginButton: {
    backgroundColor: '#521841',
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#521841',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  loginButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, paddingVertical: 5 },
  registerText: { fontSize: 12, color: '#785970' },
  registerLink: { fontSize: 12, color: '#521841', fontWeight: 'bold' },
});