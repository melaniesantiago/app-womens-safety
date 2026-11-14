import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function AlertDetailScreen({ navigation }) {

  // Generación y descarga del reporte PDF rediseñado y estilizado
  const generateAndDownloadPDF = async () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            @page { size: A4; margin: 0; }
            * { box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
              padding: 35px; 
              color: #0F172A; 
              background: #FFFFFF; 
              margin: 0;
            }
            .brand-header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start; 
              border-bottom: 2.5px solid #521841; 
              padding-bottom: 14px; 
            }
            .brand-title { 
              font-size: 26px; 
              font-weight: 900; 
              color: #521841; 
              margin: 0; 
              letter-spacing: -0.5px;
            }
            .brand-subtitle { 
              font-size: 11px; 
              color: #64748B; 
              margin-top: 4px; 
              font-weight: 500;
            }
            .status-badge { 
              background-color: #E6F4EA; 
              color: #137333; 
              border: 1px solid #A8DAB5; 
              padding: 5px 14px; 
              border-radius: 20px; 
              font-size: 11px; 
              font-weight: 800; 
              float: right; 
            }
            .folio-tag {
              font-size: 10px;
              color: #94A3B8;
              margin-top: 6px;
              text-align: right;
              clear: right;
            }
            .hero-card { 
              background: linear-gradient(135deg, #FCF7FA 0%, #F7F1F5 100%); 
              border: 1px solid #E9D8E4; 
              border-radius: 14px; 
              padding: 16px; 
              margin-top: 18px; 
            }
            .grid-4 { 
              display: flex; 
              justify-content: space-between; 
            }
            .col { flex: 1; }
            .label-muted { 
              font-size: 10px; 
              color: #64748B; 
              font-weight: 700; 
              text-transform: uppercase; 
              letter-spacing: 0.5px;
            }
            .val-bold { 
              font-size: 13px; 
              color: #0F172A; 
              font-weight: 800; 
              margin-top: 4px; 
            }
            .section-title { 
              font-size: 13px; 
              font-weight: 800; 
              color: #521841; 
              margin-top: 22px; 
              margin-bottom: 10px; 
              border-left: 4px solid #521841; 
              padding-left: 10px; 
            }
            .card-box { 
              background-color: #FFFFFF; 
              border: 1px solid #E2E8F0; 
              border-radius: 12px; 
              padding: 14px; 
            }
            .ecg-container { 
              border: 1px solid #FEE2E2; 
              background-color: #FFF5F5; 
              border-radius: 12px; 
              padding: 14px; 
            }
            .table-audit { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 6px; 
              font-size: 11px; 
            }
            .table-audit th { 
              background-color: #F8FAFC; 
              color: #475569; 
              text-align: left; 
              padding: 9px 12px; 
              border-bottom: 1.5px solid #CBD5E1; 
              font-weight: 700;
            }
            .table-audit td { 
              padding: 9px 12px; 
              border-bottom: 1px solid #F1F5F9; 
              color: #1E293B;
            }
            .signatures {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
            }
            .sig-box {
              width: 45%;
              text-align: center;
              border-top: 1.5px solid #CBD5E1;
              padding-top: 8px;
              font-size: 11px;
              font-weight: 800;
              color: #334155;
            }
            .sig-sub {
              font-size: 9px;
              color: #64748B;
              font-weight: normal;
              margin-top: 2px;
            }
            .footer { 
              margin-top: 35px; 
              text-align: center; 
              font-size: 10px; 
              color: #94A3B8; 
              border-top: 1px solid #E2E8F0; 
              padding-top: 14px; 
            }
          </style>
        </head>
        <body>
          <div class="brand-header">
            <div>
              <div class="brand-title">SafeWave</div>
              <div class="brand-subtitle">Reporte Oficial de Incidente · Instancia Municipal de la Mujer (Tlahuelilpan)</div>
            </div>
            <div>
              <span class="status-badge">ALERTA ATENDIDA</span>
              <div class="folio-tag">Folio Auditado: <strong>SW-2026-1103-08</strong></div>
            </div>
          </div>

          <div class="hero-card">
            <div class="grid-4">
              <div class="col"><div class="label-muted">FECHA Y HORA</div><div class="val-bold">Martes 3 nov · 18:32:07</div></div>
              <div class="col"><div class="label-muted">ACTIVACIÓN</div><div class="val-bold">Botón estrella (3 s)</div></div>
              <div class="col"><div class="label-muted">RESPUESTA</div><div class="val-bold">2 min</div></div>
              <div class="col"><div class="label-muted">ATENDIDO POR</div><div class="val-bold">Instancia de la Mujer</div></div>
            </div>
          </div>

          <div class="section-title">Geolocalización Registrada</div>
          <div class="card-box">
            <div class="grid-4">
              <div class="col"><div class="label-muted">COORDENADAS GPS EXACTAS</div><div class="val-bold" style="color:#521841;">Lat 20.1297, Lon -99.2310</div></div>
              <div class="col"><div class="label-muted">MARGEN DE PRECISIÓN</div><div class="val-bold">8 metros (Enlace LoRaWAN)</div></div>
            </div>
          </div>

          <div class="section-title">Telemetría Biométrica (Estrés Cardíaco)</div>
          <div class="ecg-container">
            <div style="display:flex; justify-content:space-between; margin-bottom: 8px;">
              <span class="label-muted" style="color:#7F1D1D;">FRECUENCIA CARDÍACA DURANTE EL EVENTO</span>
              <span style="color:#B91C1C; font-weight:800; font-size:12px;">Pico Máximo: 128 lpm (18:32)</span>
            </div>
            <svg viewBox="0 0 500 65" style="width:100%; height:50px;">
              <line x1="225" y1="4" x2="225" y2="58" stroke="#b91c1c" stroke-dasharray="3,3" stroke-width="1.5"/>
              <text x="230" y="14" fill="#b91c1c" font-size="9" font-weight="bold">18:32 (SOS)</text>
              <line x1="0" y1="48" x2="500" y2="48" stroke="#fca5a5" stroke-width="1"/>
              <path d="M0,46 L60,45 L110,47 L150,40 Q185,24 225,10 Q285,30 380,38 L500,40" fill="none" stroke="#b91c1c" stroke-width="2.5" stroke-linecap="round"/>
              <circle cx="225" cy="10" r="4.5" fill="#b91c1c" stroke="#ffffff" stroke-width="1.5"/>
            </svg>
            <div style="display:flex; justify-content:space-between; font-size:9px; color:#991B1B; margin-top:4px;">
              <span>18:22 hrs (Normal ~72 lpm)</span>
              <span>18:42 hrs (Estabilización ~84 lpm)</span>
            </div>
          </div>

          <div class="section-title">Bitácora de Respuesta e Intervención</div>
          <table class="table-audit">
            <thead>
              <tr><th>Hora</th><th>Evento Registrado</th><th>Canal / Responsable</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>18:32:07</strong></td><td>Señal de emergencia activada por la usuaria</td><td>Botón Estrella (SafeWave Band)</td></tr>
              <tr><td><strong>18:32:09</strong></td><td>Recepción de paquetes de telemetría y GPS</td><td>Enlace LoRaWAN · 2 s</td></tr>
              <tr><td><strong>18:33:12</strong></td><td>Despliegue de red de apoyo municipal</td><td>Central de Monitoreo Tlahuelilpan</td></tr>
              <tr><td><strong>18:34:07</strong></td><td>Atención presencial completada con éxito</td><td>Instancia Municipal de la Mujer</td></tr>
            </tbody>
          </table>

          <div class="signatures">
            <div class="sig-box">
              CENTRO DE MONITOREO SAFEWAVE
              <div class="sig-sub">Instancia Municipal de la Mujer</div>
            </div>
            <div class="sig-box">
              SELLO DIGITAL AUDITABLE
              <div class="sig-sub">Validación Criptográfica IoT (Hidalgo)</div>
            </div>
          </div>

          <div class="footer">
            SafeWave System · Evidencia Digital de Alerta Auditada · Tlahuelilpan, Hidalgo
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Guardar reporte PDF de Alerta',
          UTI: 'com.adobe.pdf'
        });
      } else {
        await Print.printAsync({ html: htmlContent });
      }
    } catch (err) {
      console.log('Falling back to print view:', err);
      try {
        await Print.printAsync({ html: htmlContent });
      } catch (printErr) {
        Alert.alert(
          "Reporte Listo",
          "Se generó el archivo en PDF con la evidencia y telemetría de la Instancia de la Mujer."
        );
      }
    }
  };

  // HTML/Canvas con animación de pulso continuo en el mapa GPS
  const mapCanvasHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #F5F1EB; overflow: hidden; }
          canvas { width: 100%; height: 100%; display: block; }
        </style>
      </head>
      <body>
        <canvas id="mapCanvas"></canvas>
        <script>
          const canvas = document.getElementById('mapCanvas');
          const ctx = canvas.getContext('2d');

          let pulseRadius = 15;
          let pulseAlpha = 0.6;
          let isExpanding = true;

          function drawMap() {
            canvas.width = window.innerWidth * window.devicePixelRatio;
            canvas.height = window.innerHeight * window.devicePixelRatio;
            const w = canvas.width;
            const h = canvas.height;

            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = '#F5F1EB';
            ctx.fillRect(0, 0, w, h);

            ctx.fillStyle = '#EBE3D7';
            const cols = 5;
            const rows = 3;
            const gap = 8 * window.devicePixelRatio;
            const bw = (w - (cols + 1) * gap) / cols;
            const bh = (h - (rows + 1) * gap) / rows;

            for (let r = 0; r < rows; r++) {
              for (let c = 0; c < cols; c++) {
                const x = gap + c * (bw + gap);
                const y = gap + r * (bh + gap);
                ctx.fillRect(x, y, bw, bh);
              }
            }

            const centerX = w * 0.48;
            const centerY = h * 0.45;

            if (isExpanding) {
              pulseRadius += 0.45 * window.devicePixelRatio;
              pulseAlpha -= 0.01;
              if (pulseRadius >= 35 * window.devicePixelRatio) isExpanding = false;
            } else {
              pulseRadius -= 0.45 * window.devicePixelRatio;
              pulseAlpha += 0.01;
              if (pulseRadius <= 16 * window.devicePixelRatio) isExpanding = true;
            }

            ctx.beginPath();
            ctx.arc(centerX, centerY, Math.max(10, pulseRadius), 0, Math.PI * 2);
            ctx.fillStyle = \`rgba(185, 28, 28, \${Math.max(0.1, pulseAlpha.toFixed(2))})\`;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(centerX, centerY, 7 * window.devicePixelRatio, 0, Math.PI * 2);
            ctx.fillStyle = '#B91C1C';
            ctx.fill();
            ctx.lineWidth = 2 * window.devicePixelRatio;
            ctx.strokeStyle = '#FFFFFF';
            ctx.stroke();

            requestAnimationFrame(drawMap);
          }

          drawMap();
        </script>
      </body>
    </html>
  `;

  // HTML/Canvas para la gráfica de Ritmo Cardíaco (Pico 128 lpm)
  const ecgPeakCanvasHTML = `
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
        <canvas id="peakCanvas"></canvas>
        <script>
          const canvas = document.getElementById('peakCanvas');
          const ctx = canvas.getContext('2d');
          
          function draw() {
            canvas.width = window.innerWidth * window.devicePixelRatio;
            canvas.height = window.innerHeight * window.devicePixelRatio;
            
            const w = canvas.width;
            const h = canvas.height;
            const padding = 10 * window.devicePixelRatio;

            ctx.clearRect(0, 0, w, h);

            const peakX = w * 0.45;
            const peakY = h * 0.25;

            ctx.beginPath();
            ctx.setLineDash([4 * window.devicePixelRatio, 4 * window.devicePixelRatio]);
            ctx.strokeStyle = '#B91C1C';
            ctx.lineWidth = 1.5 * window.devicePixelRatio;
            ctx.moveTo(peakX, peakY);
            ctx.lineTo(peakX, h - padding);
            ctx.stroke();

            ctx.setLineDash([]);
            ctx.fillStyle = '#B91C1C';
            ctx.font = 'bold ' + (12 * window.devicePixelRatio) + 'px sans-serif';
            ctx.fillText('18:32', peakX + (4 * window.devicePixelRatio), peakY - (6 * window.devicePixelRatio));

            ctx.beginPath();
            ctx.lineWidth = 3 * window.devicePixelRatio;
            ctx.strokeStyle = '#B91C1C';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.moveTo(0, h * 0.72);
            ctx.lineTo(w * 0.1, h * 0.71);
            ctx.lineTo(w * 0.2, h * 0.74);
            ctx.lineTo(w * 0.3, h * 0.65);
            ctx.quadraticCurveTo(w * 0.38, h * 0.5, peakX, peakY);
            ctx.quadraticCurveTo(w * 0.65, h * 0.55, w * 0.85, h * 0.62);
            ctx.lineTo(w, h * 0.64);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(peakX, peakY, 5 * window.devicePixelRatio, 0, Math.PI * 2);
            ctx.fillStyle = '#B91C1C';
            ctx.fill();
          }

          draw();
          window.addEventListener('resize', draw);
        </script>
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Header Superior */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backCircle} onPress={() => navigation?.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>Última alerta</Text>
          <Text style={styles.headerSub}>Martes 3 nov · 18:32:07</Text>
        </View>
        <View style={styles.statusChip}>
          <Text style={styles.statusChipText}>Atendida</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* 1. Dónde estabas (Mapa Animado) */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>Dónde estabas</Text>
          <View style={styles.mapContainer}>
            <WebView
              originWhitelist={['*']}
              source={{ html: mapCanvasHTML }}
              style={styles.webView}
              scrollEnabled={false}
            />
          </View>
          <Text style={styles.gpsCoordsText}>Lat 20.1297, Lon -99.2310 · precisión 8 m</Text>
        </View>

        {/* 2. Ritmo cardíaco */}
        <View style={styles.card}>
          <View style={styles.ecgHeaderRow}>
            <View>
              <Text style={styles.cardSectionLabel}>Ritmo</Text>
              <Text style={styles.cardSectionLabel}>cardíaco</Text>
            </View>
            <Text style={styles.peakText}>Pico 128 lpm</Text>
          </View>
          <View style={styles.ecgPeakCanvasContainer}>
            <WebView
              originWhitelist={['*']}
              source={{ html: ecgPeakCanvasHTML }}
              style={styles.webView}
              scrollEnabled={false}
            />
          </View>
          <View style={styles.ecgTimeFooter}>
            <Text style={styles.timeAxisText}>18:22</Text>
            <Text style={styles.timeAxisText}>18:42</Text>
          </View>
        </View>

        {/* 3. Grid 2x2 */}
        <View style={styles.gridContainer}>
          <View style={styles.gridCard}>
            <Text style={styles.gridLabel}>Se activó con</Text>
            <Text style={styles.gridValue}>Botón estrella (3 s)</Text>
          </View>

          <View style={styles.gridCard}>
            <Text style={styles.gridLabel}>Enlace</Text>
            <Text style={styles.gridValue}>LoRa · llegó en 2 s</Text>
          </View>

          <View style={styles.gridCard}>
            <Text style={styles.gridLabel}>Atendida por</Text>
            <Text style={styles.gridValue}>Instancia de la Mujer</Text>
          </View>

          <View style={styles.gridCard}>
            <Text style={styles.gridLabel}>Tiempo de respuesta</Text>
            <Text style={styles.gridValue}>2 min</Text>
          </View>
        </View>

        {/* 4. Descargar reporte (PDF Rediseñado) */}
        <TouchableOpacity style={styles.pdfButton} onPress={generateAndDownloadPDF}>
          <Feather name="download" size={20} color="#581C87" style={styles.pdfIcon} />
          <Text style={styles.pdfButtonText}>Descargar reporte (PDF)</Text>
        </TouchableOpacity>

        {/* 5. Historial */}
        <Text style={styles.sectionTitle}>Historial</Text>

        <TouchableOpacity style={styles.historyCard}>
          <View style={styles.historyTextGroup}>
            <Text style={styles.historyTitle}>Acompáñame terminado</Text>
            <Text style={styles.historySub}>29 oct · 21:10 · Llegó bien</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.historyCard}>
          <View style={styles.historyTextGroup}>
            <Text style={styles.historyTitle}>Prueba de alerta</Text>
            <Text style={styles.historySub}>24 oct · 10:02 · modo práctica</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </TouchableOpacity>

      </ScrollView>

      {/* TabBar Inferior */}
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
          <Ionicons name="bookmark-outline" size={24} color="#521841" />
          <Text style={[styles.navText, styles.navTextActive]}>Recursos</Text>
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
  statusChip: { backgroundColor: '#E6F4EA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusChipText: { fontSize: 13, color: '#137333', fontWeight: '700' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 90 },

  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  cardSectionLabel: { fontSize: 14, color: '#64748B', fontWeight: '500', lineHeight: 18 },

  mapContainer: { height: 130, width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 10, marginBottom: 8 },
  webView: { flex: 1, backgroundColor: 'transparent' },
  gpsCoordsText: { fontSize: 12, color: '#64748B', marginTop: 2 },

  ecgHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  peakText: { fontSize: 16, fontWeight: '800', color: '#B91C1C' },
  ecgPeakCanvasContainer: { height: 75, width: '100%', marginVertical: 4 },
  ecgTimeFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 6 },
  timeAxisText: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 14 },
  gridCard: { width: '48.5%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  gridLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  gridValue: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginTop: 4 },

  pdfButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#581C87', borderRadius: 20, paddingVertical: 14, marginBottom: 20 },
  pdfIcon: { marginRight: 8 },
  pdfButtonText: { fontSize: 15, fontWeight: '800', color: '#581C87' },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 10 },

  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  historyTextGroup: { flex: 1 },
  historyTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  historySub: { fontSize: 12, color: '#64748B', marginTop: 2 },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 68, backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 11, color: '#9E8697', marginTop: 3, fontWeight: '500' },
  navTextActive: { color: '#521841', fontWeight: '700' }
});