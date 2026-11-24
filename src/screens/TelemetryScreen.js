import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { API_URL } from '../config/api';

export default function TelemetryScreen({ navigation }) {
  const [conectado, setConectado] = useState(false);
  const [segundosAtras, setSegundosAtras] = useState(0);
  const [usuaria, setUsuaria] = useState({
    pulso: 0,
    oxigeno: 0,
    lat: 0,
    lon: 0,
    acel: 1,
    bat: 255,
  });
  const pulseAnim = useState(new Animated.Value(1))[0];

  // Animación de palpitar para el corazón
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 400,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Datos reales de la pulsera
  useEffect(() => {
    let activo = true;

    const consultar = async () => {
      try {
        const res = await fetch(`${API_URL}/estado`);
        const data = await res.json();
        if (!activo || !data.ok) return;

        setConectado(Boolean(data.conectado));
        if (data.usuaria) {
          setUsuaria(data.usuaria);
          setSegundosAtras(0);
        }
      } catch {
        if (activo) setConectado(false);
      }
    };

    consultar();
    const idFetch = setInterval(consultar, 2500);
    const idReloj = setInterval(() => setSegundosAtras((p) => p + 1), 1000);

    return () => {
      activo = false;
      clearInterval(idFetch);
      clearInterval(idReloj);
    };
  }, []);

  // Number(...) evita errores de .toFixed si el backend manda texto
  const pulso = Number(usuaria.pulso) || 0;
  const estadoPulso = pulso === 0 ? 'sin lectura' : pulso > 110 ? 'elevado' : 'en reposo';
  const lat = Number(usuaria.lat) || 0;
  const lon = Number(usuaria.lon) || 0;
  const tieneGps = lat !== 0 && lon !== 0;
  const acel = Number(usuaria.acel) || 1;
  const oxigeno = Number(usuaria.oxigeno) || 0;
  const sinBateria = usuaria.bat === 255 || usuaria.bat === undefined;

  // HTML/Canvas para dibujar el trazado de ECG suave y fluido en tiempo real
  const ecgCanvasHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: transparent; overflow: hidden; }
          canvas { width: 100%; height: 100%; display: block; }
        </style>
      </head>
      <body>
        <canvas id="ecgCanvas"></canvas>
        <script>
          const canvas = document.getElementById('ecgCanvas');
          const ctx = canvas.getContext('2d');

          function resize() {
            canvas.width = window.innerWidth * window.devicePixelRatio;
            canvas.height = window.innerHeight * window.devicePixelRatio;
          }
          resize();
          window.addEventListener('resize', resize);

          let offset = 0;
          const speed = 2.5;

          function drawECG() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.lineWidth = 3.5 * window.devicePixelRatio;
            ctx.strokeStyle = '#C026D3';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const midY = canvas.height / 2;
            const step = 140 * window.devicePixelRatio;
            const totalWidth = canvas.width + step;

            offset = (offset + speed) % step;

            for (let x = -step + offset; x < totalWidth; x += step) {
              ctx.moveTo(x, midY);
              ctx.lineTo(x + step * 0.35, midY);
              ctx.lineTo(x + step * 0.40, midY - 6 * window.devicePixelRatio);
              ctx.lineTo(x + step * 0.45, midY + 8 * window.devicePixelRatio);
              ctx.lineTo(x + step * 0.50, midY - 26 * window.devicePixelRatio);
              ctx.lineTo(x + step * 0.55, midY + 18 * window.devicePixelRatio);
              ctx.lineTo(x + step * 0.60, midY - 5 * window.devicePixelRatio);
              ctx.lineTo(x + step * 0.65, midY);
              ctx.lineTo(x + step, midY);
            }
            ctx.stroke();
            requestAnimationFrame(drawECG);
          }
          drawECG();
        </script>
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backCircle} onPress={() => navigation?.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>Sensores en vivo</Text>
          <Text style={styles.headerSub}>Actualizado hace {segundosAtras} s</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Tarjeta ECG */}
        <View style={styles.cardECG}>
          <View style={styles.ecgTopRow}>
            <Animated.View style={[styles.heartIconCircle, { transform: [{ scale: pulseAnim }] }]}>
              <Ionicons name="heart-outline" size={22} color="#991B1B" />
            </Animated.View>
            <View style={styles.heartTextGroup}>
              <Text style={styles.ecgLabel}>Ritmo cardíaco</Text>
              <View style={styles.heartValueRow}>
                <Text style={styles.ecgValue}>{pulso > 0 ? pulso : '--'}</Text>
                <Text style={styles.ecgSubValue}>lpm · {estadoPulso}</Text>
              </View>
            </View>
          </View>

          <View style={styles.ecgCanvasContainer}>
            <WebView
              originWhitelist={['*']}
              source={{ html: ecgCanvasHTML }}
              style={styles.webViewECG}
              scrollEnabled={false}
            />
          </View>

          <View style={styles.ecgFooter}>
            <Text style={styles.timeText}>Hace 1 min</Text>
            <Text style={styles.timeText}>Ahora</Text>
          </View>
        </View>

        {/* Grid 2x3 de Tarjetas */}
        <View style={styles.gridContainer}>
          <View style={styles.gridCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="location-outline" size={18} color="#6B21A8" />
              <Text style={styles.cardLabel}>Ubicación</Text>
            </View>
            <Text style={styles.cardMainValue}>{tieneGps ? 'Señal fija' : 'Buscando GPS'}</Text>
            <Text style={styles.cardSubValue}>
              {tieneGps ? `${lat.toFixed(4)}, ${lon.toFixed(4)}` : 'Sin fijar satélite'}
            </Text>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="cellular-outline" size={18} color="#6B21A8" />
              <Text style={styles.cardLabel}>Enlace</Text>
            </View>
            <Text style={styles.cardMainValue}>{conectado ? 'En línea' : 'Sin señal'}</Text>
            <Text style={styles.cardSubValue}>MQTT cifrado</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="mic-outline" size={18} color="#6B21A8" />
              <Text style={styles.cardLabel}>Detección de voz</Text>
            </View>
            <Text style={styles.cardMainValue}>{conectado ? 'Activa' : 'En espera'}</Text>
            <Text style={styles.cardSubValue}>"auxilio" o "ayuda"</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="walk" size={18} color="#6B21A8" />
              <Text style={styles.cardLabel}>Movimiento</Text>
            </View>
            <Text style={styles.cardMainValue}>{acel > 1.8 ? 'Agitado' : 'En reposo'}</Text>
            <Text style={styles.cardSubValue}>Acel: {acel.toFixed(2)} g</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="battery-charging-outline" size={18} color="#6B21A8" />
              <Text style={styles.cardLabel}>Batería</Text>
            </View>
            <Text style={styles.cardMainValue}>{sinBateria ? 'USB' : `${usuaria.bat} %`}</Text>
            <Text style={styles.cardSubValue}>{sinBateria ? 'Sin batería' : 'Nivel actual'}</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="water-outline" size={18} color="#6B21A8" />
              <Text style={styles.cardLabel}>Oxigenación</Text>
            </View>
            <Text style={styles.cardMainValue}>{oxigeno > 0 ? `${oxigeno} %` : '-- %'}</Text>
            <Text style={styles.cardSubValue}>SpO₂</Text>
          </View>
        </View>

        {/* Banner de Privacidad */}
        <View style={styles.privacyBanner}>
          <Text style={styles.privacyText}>
            Tus lecturas solo se comparten con la Instancia de la Mujer y tus contactos durante una alerta o un trayecto de Acompáñame.
          </Text>
        </View>
      </ScrollView>

      {/* TabBar Inferior */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation?.navigate('MainTabs', { screen: 'InicioTab' })}
        >
          <Ionicons name="home-outline" size={24} color="#521841" />
          <Text style={[styles.navText, styles.navTextActive]}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation?.navigate('MainTabs', { screen: 'ContactosTab' })}
        >
          <Ionicons name="people-outline" size={24} color="#9E8697" />
          <Text style={styles.navText}>Contactos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation?.navigate('MainTabs', { screen: 'AccompaniTab' })}
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

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  backCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginRight: 14 },
  headerTextGroup: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 13, color: '#64748B', marginTop: 2 },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 90 },

  cardECG: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  ecgTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  heartIconCircle: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  heartTextGroup: { flex: 1 },
  ecgLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  heartValueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  ecgValue: { fontSize: 32, fontWeight: '900', color: '#0F172A', marginRight: 8 },
  ecgSubValue: { fontSize: 15, fontWeight: '600', color: '#64748B' },

  ecgCanvasContainer: { height: 65, width: '100%', marginVertical: 4 },
  webViewECG: { flex: 1, backgroundColor: 'transparent' },

  ecgFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  timeText: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  gridCard: { width: '48.5%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardLabel: { fontSize: 13, color: '#64748B', fontWeight: '500', marginLeft: 6 },
  cardMainValue: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  cardSubValue: { fontSize: 12, color: '#64748B', marginTop: 2 },

  privacyBanner: { backgroundColor: '#F3E8FF', borderRadius: 20, padding: 18, marginBottom: 10 },
  privacyText: { fontSize: 13, color: '#581C87', lineHeight: 19, fontWeight: '500' },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 68, backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 11, color: '#9E8697', marginTop: 3, fontWeight: '500' },
  navTextActive: { color: '#521841', fontWeight: '700' },
});