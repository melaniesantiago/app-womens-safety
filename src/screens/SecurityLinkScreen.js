import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function SecurityLinkScreen({ user, onComplete }) {
  const [step, setStep] = useState(0);

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseRing = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const exitFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrada suave
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Onda continua de sincronización
    const wave = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseRing, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseRing, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    wave.start();

    // Secuencia de pasos de enlace
    const t1 = setTimeout(() => setStep(1), 750);
    const t2 = setTimeout(() => {
      setStep(2);
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }, 1650);

    // Salida suave hacia Home
    const t3 = setTimeout(() => {
      Animated.timing(exitFade, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        if (onComplete) onComplete();
      });
    }, 2650);

    return () => {
      wave.stop();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const ringStyle = {
    transform: [
      {
        scale: pulseRing.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.9],
        }),
      },
    ],
    opacity: pulseRing.interpolate({
      inputRange: [0, 1],
      outputRange: [0.45, 0],
    }),
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'Usuaria';

  return (
    <Animated.View style={[styles.container, { opacity: exitFade }]}>
      <Animated.View
        style={[
          styles.centerContent,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Núcleo de sincronización */}
        <View style={styles.orbWrapper}>
          <Animated.View style={[styles.waveCircle, ringStyle]} />

          <View style={[styles.orbCore, step === 2 && styles.orbCoreReady]}>
            {step < 2 ? (
              <MaterialCommunityIcons name="watch-variant" size={46} color="#FFFFFF" />
            ) : (
              <Animated.View style={{ transform: [{ scale: checkScale }] }}>
                <Ionicons name="checkmark" size={50} color="#FFFFFF" />
              </Animated.View>
            )}
          </View>
        </View>

        {/* Saludo personalizado */}
        <Text style={styles.welcomeBack}>Hola, {firstName}</Text>
        <Text style={styles.statusHeadline}>
          {step === 0 && 'Verificando credenciales seguras...'}
          {step === 1 && 'Sincronizando pulsera y GPS...'}
          {step === 2 && '¡Tu espacio seguro está activo!'}
        </Text>

        {/* Checklist progresivo de seguridad */}
        <View style={styles.checklistCard}>
          <View style={styles.checkRow}>
            <Ionicons
              name={step >= 0 ? 'checkmark-circle' : 'ellipse-outline'}
              size={19}
              color="#34D399"
            />
            <Text style={styles.checkText}>Sesión cifrada iniciada</Text>
          </View>

          <View style={styles.checkRow}>
            <Ionicons
              name={step >= 1 ? 'checkmark-circle' : 'time-outline'}
              size={19}
              color={step >= 1 ? '#34D399' : '#94A3B8'}
            />
            <Text style={[styles.checkText, step < 1 && styles.checkTextPending]}>
              Enlace con pulsera inteligente
            </Text>
          </View>

          <View style={[styles.checkRow, { marginBottom: 0 }]}>
            <Ionicons
              name={step >= 2 ? 'checkmark-circle' : 'time-outline'}
              size={19}
              color={step >= 2 ? '#34D399' : '#94A3B8'}
            />
            <Text style={[styles.checkText, step < 2 && styles.checkTextPending]}>
              Protocolo SOS y red de confianza listos
            </Text>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0513',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  centerContent: {
    width: '100%',
    alignItems: 'center',
  },
  orbWrapper: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 26,
  },
  waveCircle: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#0D7A68',
  },
  orbCore: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#521841',
    borderWidth: 2.5,
    borderColor: '#D946EF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  orbCoreReady: {
    backgroundColor: '#0D7A68',
    borderColor: '#34D399',
  },
  welcomeBack: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  statusHeadline: {
    fontSize: 14,
    color: '#A7F3D0',
    fontWeight: '600',
    marginBottom: 28,
    textAlign: 'center',
  },
  checklistCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    padding: 18,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  checkText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 10,
  },
  checkTextPending: {
    color: '#94A3B8',
    fontWeight: '500',
  },
});