import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function SplashAnimationScreen({ onFinish }) {
  // Valores de animación
  const coreScale = useRef(new Animated.Value(0.3)).current;
  const coreOpacity = useRef(new Animated.Value(0)).current;
  const orbitRotation = useRef(new Animated.Value(0)).current;
  const reverseOrbit = useRef(new Animated.Value(0)).current;
  const heartbeat = useRef(new Animated.Value(1)).current;
  const auraBreath = useRef(new Animated.Value(0)).current;
  const scanLineY = useRef(new Animated.Value(-55)).current;

  // Textos e indicadores secuenciales
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(18)).current;
  const badge1 = useRef(new Animated.Value(0)).current;
  const badge2 = useRef(new Animated.Value(0)).current;
  const badge3 = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const screenExitOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Aparición dramática del núcleo central
    Animated.parallel([
      Animated.spring(coreScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(coreOpacity, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Órbitas continuas (horaria y antihoraria)
    const spin1 = Animated.loop(
      Animated.timing(orbitRotation, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const spin2 = Animated.loop(
      Animated.timing(reverseOrbit, {
        toValue: 1,
        duration: 14000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // 3. Latido cardíaco realista (doble pulso: lub-dub)
    const beatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(heartbeat, {
          toValue: 1.14,
          duration: 140,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(heartbeat, {
          toValue: 0.98,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(heartbeat, {
          toValue: 1.09,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(heartbeat, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );

    // 4. Escáner láser sutil sobre el reloj/pulsera
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, {
          toValue: 55,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineY, {
          toValue: -55,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // 5. Respiración del halo ambiental
    const auraLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(auraBreath, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(auraBreath, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    spin1.start();
    spin2.start();
    beatLoop.start();
    scanLoop.start();
    auraLoop.start();

    // 6. Revelación escalonada de tipografía y módulos
    Animated.sequence([
      Animated.delay(450),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(titleSlide, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(220, [
        Animated.spring(badge1, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.spring(badge2, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.spring(badge3, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]),
    ]).start();

    // 7. Barra de progreso inferior sincronizada (4.2 segundos)
    Animated.timing(progressWidth, {
      toValue: 1,
      duration: 4100,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();

    // 8. Transición suave de salida
    const exitTimer = setTimeout(() => {
      Animated.timing(screenExitOpacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }, 4200);

    return () => {
      clearTimeout(exitTimer);
      spin1.stop();
      spin2.stop();
      beatLoop.stop();
      scanLoop.stop();
      auraLoop.stop();
    };
  }, []);

  const spinInterpolate = orbitRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const reverseSpinInterpolate = reverseOrbit.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  const auraScale = auraBreath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.18],
  });

  const auraOpacity = auraBreath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22, 0.45],
  });

  const barWidth = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: screenExitOpacity }]}>
      {/* Botón discreto para saltar */}
      <TouchableOpacity
        style={styles.skipBtn}
        activeOpacity={0.7}
        onPress={() => onFinish && onFinish()}
      >
        <Text style={styles.skipText}>Saltar</Text>
        <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
      </TouchableOpacity>

      {/* Halo de luz ambiental */}
      <Animated.View
        style={[
          styles.ambientGlow,
          { transform: [{ scale: auraScale }], opacity: auraOpacity },
        ]}
      />

      {/* Sistema Orbital + Núcleo de la Pulsera */}
      <Animated.View
        style={[
          styles.orbitalStage,
          { opacity: coreOpacity, transform: [{ scale: coreScale }] },
        ]}
      >
        {/* Anillo exterior punteado girando en reversa */}
        <Animated.View
          style={[
            styles.outerDashedRing,
            { transform: [{ rotate: reverseSpinInterpolate }] },
          ]}
        />

        {/* Anillo orbital principal con satélites */}
        <Animated.View
          style={[
            styles.orbitRing,
            { transform: [{ rotate: spinInterpolate }] },
          ]}
        >
          {/* Nodo 1: GPS */}
          <View style={[styles.satelliteNode, styles.nodeTop]}>
            <Ionicons name="location" size={14} color="#FFFFFF" />
          </View>
          {/* Nodo 2: Escudo */}
          <View style={[styles.satelliteNode, styles.nodeBottomLeft, { backgroundColor: '#0D7A68' }]}>
            <Ionicons name="shield-checkmark" size={13} color="#FFFFFF" />
          </View>
          {/* Nodo 3: Señal LoRa */}
          <View style={[styles.satelliteNode, styles.nodeBottomRight, { backgroundColor: '#A62117' }]}>
            <Ionicons name="radio" size={13} color="#FFFFFF" />
          </View>
        </Animated.View>

        {/* Núcleo central con latido y escáner */}
        <Animated.View
          style={[
            styles.coreSphere,
            { transform: [{ scale: heartbeat }] },
          ]}
        >
          <MaterialCommunityIcons name="watch-variant" size={56} color="#FFFFFF" />

          {/* Haz de escaneo biométrico */}
          <Animated.View
            style={[
              styles.scannerBeam,
              { transform: [{ translateY: scanLineY }] },
            ]}
          />
        </Animated.View>
      </Animated.View>

      {/* Tipografía de alto impacto */}
      <Animated.View
        style={[
          styles.headerSection,
          { opacity: titleOpacity, transform: [{ translateY: titleSlide }] },
        ]}
      >
        <View style={styles.statusChip}>
          <View style={styles.liveDot} />
          <Text style={styles.statusChipText}>SISTEMA DE PROTECCIÓN INTELIGENTE</Text>
        </View>

        <Text style={styles.mainTitle}>WOMEN SAFETY</Text>
        <Text style={styles.subtitle}>
          Tu pulsera conectada en tiempo real con quienes más te cuidan
        </Text>
      </Animated.View>

      {/* 3 Tarjetas de propósito que aparecen una tras otra */}
      <View style={styles.pillarsRow}>
        <Animated.View
          style={[
            styles.pillarCard,
            {
              opacity: badge1,
              transform: [{ scale: badge1 }],
            },
          ]}
        >
          <View style={[styles.pillarIconBox, { backgroundColor: 'rgba(13, 122, 104, 0.25)' }]}>
            <Ionicons name="navigate" size={18} color="#34D399" />
          </View>
          <Text style={styles.pillarTitle}>Ruta Segura</Text>
          <Text style={styles.pillarSub}>GPS en vivo</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.pillarCard,
            {
              opacity: badge2,
              transform: [{ scale: badge2 }],
            },
          ]}
        >
          <View style={[styles.pillarIconBox, { backgroundColor: 'rgba(166, 33, 23, 0.28)' }]}>
            <Ionicons name="pulse" size={18} color="#F87171" />
          </View>
          <Text style={styles.pillarTitle}>Biometría</Text>
          <Text style={styles.pillarSub}>Pulso activo</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.pillarCard,
            {
              opacity: badge3,
              transform: [{ scale: badge3 }],
            },
          ]}
        >
          <View style={[styles.pillarIconBox, { backgroundColor: 'rgba(216, 180, 226, 0.2)' }]}>
            <Ionicons name="shield-checkmark" size={18} color="#E879F9" />
          </View>
          <Text style={styles.pillarTitle}>Auxilio SOS</Text>
          <Text style={styles.pillarSub}>Alerta LoRa</Text>
        </Animated.View>
      </View>

      {/* Barra de progreso elegante inferior */}
      <View style={styles.footerLoader}>
        <Text style={styles.loadingLabel}>Inicializando enlace seguro...</Text>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: barWidth }]} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0513', // Guinda profundo de alta gama
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  skipBtn: {
    position: 'absolute',
    top: 52,
    right: 22,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  skipText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 2,
  },
  ambientGlow: {
    position: 'absolute',
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: (width * 0.85) / 2,
    backgroundColor: '#521841',
  },
  orbitalStage: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  outerDashedRing: {
    position: 'absolute',
    width: 214,
    height: 214,
    borderRadius: 107,
    borderWidth: 1.5,
    borderColor: 'rgba(243, 232, 240, 0.22)',
    borderStyle: 'dashed',
  },
  orbitRing: {
    position: 'absolute',
    width: 174,
    height: 174,
    borderRadius: 87,
    borderWidth: 1.5,
    borderColor: 'rgba(232, 121, 249, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  satelliteNode: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#521841',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1A0513',
  },
  nodeTop: {
    top: -14,
    backgroundColor: '#7C2262',
  },
  nodeBottomLeft: {
    bottom: 14,
    left: 6,
  },
  nodeBottomRight: {
    bottom: 14,
    right: 6,
  },
  coreSphere: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#521841',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#D946EF',
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#D946EF',
    shadowOpacity: 0.45,
    shadowRadius: 18,
  },
  scannerBeam: {
    position: 'absolute',
    width: '100%',
    height: 3,
    backgroundColor: '#34D399',
    opacity: 0.85,
    shadowColor: '#34D399',
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 26,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 122, 104, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#34D399',
    marginRight: 7,
  },
  statusChipText: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  pillarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
    marginBottom: 34,
  },
  pillarCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  pillarIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  pillarTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  pillarSub: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  footerLoader: {
    position: 'absolute',
    bottom: 42,
    width: '78%',
    alignItems: 'center',
  },
  loadingLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: 4,
  },
});