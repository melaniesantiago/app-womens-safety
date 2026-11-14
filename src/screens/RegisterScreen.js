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
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen({ onRegisterSuccess, onNavigateToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Campos incompletos', 'Por favor llena todos los campos requeridos.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error de contraseña', 'Las contraseñas no coinciden. Por favor verifica.');
      return;
    }

    Alert.alert(
      '¡Registro Exitoso!',
      'Tu cuenta ha sido creada correctamente. Por favor inicia sesión.',
      [
        {
          text: 'Ir a Iniciar Sesión',
          onPress: () => {
            if (onRegisterSuccess) {
              onRegisterSuccess({ name: name.trim(), email: email.trim() });
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2EBF0" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            
            <View style={styles.logoContainer}>
              <View style={styles.symbolBadge}>
                <Text style={styles.logoIcon}>♀</Text>
              </View>
              <Text style={styles.title}>WOMEN SAFETY</Text>
              <Text style={styles.subtitle}>Crea tu cuenta para activar tu protección</Text>
            </View>

            <View style={styles.form}>
              
              <Text style={styles.label}>Nombre Completo</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={18} color="#521841" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Tu nombre completo"
                  placeholderTextColor="#9E8697"
                  value={name}
                  onChangeText={setName}
                />
              </View>

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

              <Text style={styles.label}>Confirmar Contraseña</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#521841" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9E8697"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity style={styles.registerButton} activeOpacity={0.85} onPress={handleRegister}>
                <Text style={styles.registerButtonText}>Crear Cuenta</Text>
              </TouchableOpacity>

              <View style={styles.loginRow}>
                <Text style={styles.loginText}>¿Ya tienes una cuenta? </Text>
                <TouchableOpacity onPress={onNavigateToLogin}>
                  <Text style={styles.loginLink}>Inicia Sesión</Text>
                </TouchableOpacity>
              </View>

            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EBF0' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  content: { paddingHorizontal: 24, paddingVertical: 20, alignItems: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 24 },
  symbolBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#DFD2DC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CFC0CC',
    marginBottom: 10,
  },
  logoIcon: { fontSize: 26, color: '#521841', fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: '800', color: '#380E2B', letterSpacing: 1 },
  subtitle: { fontSize: 11, color: '#785970', marginTop: 4, fontWeight: '600' },
  form: { width: '100%' },
  label: { fontSize: 12, fontWeight: '700', color: '#380E2B', marginBottom: 4, marginLeft: 2 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E4D8E2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D4C2D0',
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 46,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: '#380E2B', fontSize: 14 },
  registerButton: {
    backgroundColor: '#521841',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
    shadowColor: '#521841',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  registerButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  loginText: { fontSize: 12, color: '#785970' },
  loginLink: { fontSize: 12, color: '#521841', fontWeight: 'bold' },
});