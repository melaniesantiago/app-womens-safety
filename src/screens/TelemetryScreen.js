import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Animated, 
  Easing 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

export default function TelemetryScreen({ navigation }) {
  const [heartRate, setHeartRate] = useState(74);
  const [signal, setSignal] = useState(-92);
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    // Animación de palpitar para el corazón
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

    // Simulación biométrica
    const interval = setInterval(() => {
      setHeartRate(prev => Math.min(85, Math.max(68, prev + (Math.floor(Math.random() * 3) - 1))));
      setSignal(prev => Math.min(-85, Math.max(-98, prev + (Math.floor(Math.random() * 3) - 1))));
    }, 3000);

    return () => {
      loop.stop();
      clearInterval(interval);
    };
  }, []);

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
            ctx.strokeStyle = '#C026D3'; // Color magenta exacto de tu diseño
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
          <Text style={styles.headerSub}>Actualizado hace 5 s</Text>
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
                <Text style={styles.ecgValue}>{heartRate}</Text>
                <Text style={styles.ecgSubValue}>lpm · en reposo</Text>
              </View>
            </View>
          </View>

          {/* Gráfica ECG fluida y redonda renderizada vía Canvas */}
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
            <Text style={styles.cardMainValue}>Señal fija</Text>
            <Text style={styles.cardSubValue}>Precisión 8 m</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.cardHeader}>
              <Feather name="bar-chart-2" size={18} color="#6B21A8" />
              <Text style={styles.cardLabel}>Señal</Text>
            </View>
            <Text style={styles.cardMainValue}>{signal} dBm</Text>
            <Text style={styles.cardSubValue}>Buena</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="mic-outline" size={18} color="#6B21A8" />
              <Text style={styles.cardLabel}>Detección de</Text>
            </View>
            <Text style={styles.cardMainValue}>Activa</Text>
            <Text style={styles.cardSubValue}>"auxilio" o "ayuda"</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="walk" size={18} color="#6B21A8" />
              <Text style={styles.cardLabel}>Movimiento</Text>
            </View>
            <Text style={styles.cardMainValue}>Caminando</Text>
            <Text style={styles.cardSubValue}>Sin caídas</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="battery-charging-outline" size={18} color="#6B21A8" />
              <Text style={styles.cardLabel}>Batería</Text>
            </View>
            <Text style={styles.cardMainValue}>82 %</Text>
            <Text style={styles.cardSubValue}>Unos 2 días</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="thermometer-outline" size={18} color="#6B21A8" />
              <Text style={styles.cardLabel}>Temperatura</Text>
            </View>
            <Text style={styles.cardMainValue}>34.6 °C</Text>
            <Text style={styles.cardSubValue}>Piel, normal</Text>
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
          onPress={() => navigation?.navigate('MainTabs', { screen: 'MapaDeApoyo' })}
        >
          <Ionicons name="people-outline" size={24} color="#9E8697" />
          <Text style={styles.navText}>Contactos</Text>
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
  navTextActive: { color: '#521841', fontWeight: '700' }
});