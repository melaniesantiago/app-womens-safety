import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

export default function MyDeviceScreen({ navigation }) {
  const [activeAngle, setActiveAngle] = useState('Girar');
  const webViewRef = useRef(null);

  const custom3DHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; background-color: #F3E8FF; overflow: hidden; }
          #canvas3d { width: 100%; height: 100%; display: block; }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
      </head>
      <body>
        <canvas id="canvas3d"></canvas>
        <script>
          const scene = new THREE.Scene();
          scene.background = new THREE.Color(0xF3E8FF);

          const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
          camera.position.set(0, 0, 8.5);

          const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas3d'), antialias: true });
          renderer.setSize(window.innerWidth, window.innerHeight);
          renderer.setPixelRatio(window.devicePixelRatio);

          const controls = new THREE.OrbitControls(camera, renderer.domElement);
          controls.enableDamping = true;
          controls.dampingFactor = 0.05;
          controls.autoRotate = true;
          controls.autoRotateSpeed = 3.5;

          // Iluminación 3D para acentuar el volumen y grosor
          const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
          scene.add(ambientLight);
          const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
          dirLight1.position.set(5, 10, 7);
          scene.add(dirLight1);
          const dirLight2 = new THREE.DirectionalLight(0xD946EF, 0.4);
          dirLight2.position.set(-5, -5, -5);
          scene.add(dirLight2);

          const braceletGroup = new THREE.Group();

          // Materiales con volumen y textura
          const magentaMat = new THREE.MeshStandardMaterial({ 
            color: 0xC026D3, 
            roughness: 0.3, 
            metalness: 0.1 
          });
          const darkMagentaMat = new THREE.MeshStandardMaterial({ 
            color: 0x86198F, 
            roughness: 0.4 
          });
          const silverStarMat = new THREE.MeshStandardMaterial({ 
            color: 0xF8FAFC, 
            metalness: 0.9, 
            roughness: 0.2 
          });

          // 1. Cuerpo Principal con Profundidad 3D (Grosor real)
          const bodyGeo = new THREE.BoxGeometry(3.2, 3.2, 0.5);
          const bodyMesh = new THREE.Mesh(bodyGeo, magentaMat);
          braceletGroup.add(bodyMesh);

          // 2. Correas Superior e Inferior con Grosor
          const strapGeo = new THREE.BoxGeometry(1.8, 2.2, 0.22);
          const strapTop = new THREE.Mesh(strapGeo, darkMagentaMat);
          strapTop.position.set(0, 2.6, -0.05);
          braceletGroup.add(strapTop);

          const strapBottom = new THREE.Mesh(strapGeo, darkMagentaMat);
          strapBottom.position.set(0, -2.6, -0.05);
          braceletGroup.add(strapBottom);

          // Bisagras 3D
          const hingeGeo = new THREE.BoxGeometry(2.0, 0.3, 0.3);
          const hingeTop = new THREE.Mesh(hingeGeo, darkMagentaMat);
          hingeTop.position.set(0, 1.5, 0);
          braceletGroup.add(hingeTop);

          const hingeBottom = new THREE.Mesh(hingeGeo, darkMagentaMat);
          hingeBottom.position.set(0, -1.5, 0);
          braceletGroup.add(hingeBottom);

          // 3. Pantalla OLED con Bisel
          const oledFrameGeo = new THREE.BoxGeometry(1.5, 0.9, 0.08);
          const oledFrameMat = new THREE.MeshStandardMaterial({ color: 0x0F172A });
          const oledFrame = new THREE.Mesh(oledFrameGeo, oledFrameMat);
          oledFrame.position.set(0.4, 0.4, 0.24);
          braceletGroup.add(oledFrame);

          // Contenido de Pantalla OLED (Hora espejeada)
          const oledCanvas = document.createElement('canvas');
          oledCanvas.width = 256;
          oledCanvas.height = 140;
          const ctx = oledCanvas.getContext('2d');
          ctx.fillStyle = '#090D16';
          ctx.fillRect(0, 0, 256, 140);
          ctx.fillStyle = '#38BDF8';
          ctx.font = 'bold 22px sans-serif';
          ctx.save();
          ctx.scale(-1, 1);
          ctx.fillText('SafeWave', -170, 35);
          ctx.fillText('82%', -220, 35);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 36px sans-serif';
          ctx.fillText('18:32', -175, 80);
          ctx.fillStyle = '#38BDF8';
          ctx.font = '16px sans-serif';
          ctx.fillText('LoRa ok', -170, 115);
          ctx.fillText('GPS', -90, 115);
          ctx.restore();

          const oledTex = new THREE.CanvasTexture(oledCanvas);
          const screenGeo = new THREE.PlaneGeometry(1.4, 0.8);
          const screenMat = new THREE.MeshBasicMaterial({ map: oledTex });
          const screenMesh = new THREE.Mesh(screenGeo, screenMat);
          screenMesh.position.set(0.4, 0.4, 0.29);
          braceletGroup.add(screenMesh);

          // 4. Estrella Magenta Elevada en 3D
          function createStarShape(outerRadius, innerRadius) {
            const shape = new THREE.Shape();
            const points = 5;
            for (let i = 0; i < points * 2; i++) {
              const r = (i % 2 === 0) ? outerRadius : innerRadius;
              const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
              const x = Math.cos(a) * r;
              const y = Math.sin(a) * r;
              if (i === 0) shape.moveTo(x, y);
              else shape.lineTo(x, y);
            }
            return shape;
          }

          const starShape = createStarShape(0.45, 0.2);
          const starGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02 });
          const starMesh = new THREE.Mesh(starGeo, magentaMat);
          starMesh.position.set(-0.7, -0.4, 0.25);
          braceletGroup.add(starMesh);

          // 5. Estrellitas Blancas/Plateadas en 3D
          const smallStarShape = createStarShape(0.08, 0.035);
          const smallStarGeo = new THREE.ExtrudeGeometry(smallStarShape, { depth: 0.02, bevelEnabled: false });

          const starPositions = [
            [-1.2, 1.2], [1.2, 1.2], [-1.2, -1.2], [1.2, -1.2],
            [-0.5, 1.2], [0.5, 1.2], [-1.2, 0.1], [1.2, -0.2],
            [0.2, -0.9], [0.8, -0.7],
            // En las correas
            [-0.4, 3.0], [0.4, 2.5], [-0.3, -3.0], [0.3, -2.4]
          ];

          starPositions.forEach(pos => {
            const star = new THREE.Mesh(smallStarGeo, silverStarMat);
            const zPos = Math.abs(pos[1]) > 1.6 ? 0.07 : 0.26;
            star.position.set(pos[0], pos[1], zPos);
            braceletGroup.add(star);
          });

          scene.add(braceletGroup);

          // Bucle de Animación Continuo
          function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
          }
          animate();

          // Control interactivo con botones
          window.setAngle = function(angle) {
            if (angle === 'Frente') {
              controls.autoRotate = false;
              camera.position.set(0, 0, 8.5);
            } else if (angle === 'Lado') {
              controls.autoRotate = false;
              camera.position.set(8.5, 0, 0);
            } else if (angle === 'Atrás') {
              controls.autoRotate = false;
              camera.position.set(0, 0, -8.5);
            } else {
              controls.autoRotate = true;
              camera.position.set(0, 0, 8.5);
            }
            controls.target.set(0, 0, 0);
          };

          window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
          });
        </script>
      </body>
    </html>
  `;

  const handleAngleChange = (angle) => {
    setActiveAngle(angle);
    const jsCode = `if (window.setAngle) { window.setAngle('${angle}'); } true;`;
    webViewRef.current?.injectJavaScript(jsCode);
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backCircleButton} onPress={() => navigation?.goBack()}>
          <Ionicons name="chevron-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Mi pulsera</Text>
          <Text style={styles.headerSub}>SafeWave · ID SW-0142</Text>
        </View>

        <View style={styles.connectedChip}>
          <View style={styles.greenDot} />
          <Text style={styles.connectedText}>Conectada</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Visor 3D Interactivo */}
        <View style={styles.visor3dCard}>
          <View style={styles.imageContainer}>
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: custom3DHTML }}
              style={styles.webView3D}
              scrollEnabled={false}
            />
          </View>
          <Text style={styles.dragText}>Arrastra para girar</Text>
        </View>

        {/* Botones de Ángulo */}
        <View style={styles.angleButtonsRow}>
          {['Girar', 'Frente', 'Lado', 'Atrás'].map((item) => (
            <TouchableOpacity 
              key={item}
              style={[
                styles.angleButton, 
                activeAngle === item && styles.angleButtonActive
              ]}
              onPress={() => handleAngleChange(item)}
            >
              <Text style={[
                styles.angleButtonText, 
                activeAngle === item && styles.angleButtonTextActive
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Métricas Hardware Grid 2x2 */}
        <View style={styles.grid2x2}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Batería</Text>
            <Text style={styles.infoValue}>82 %</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Conexión</Text>
            <Text style={styles.infoValue}>Red móvil</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Firmware</Text>
            <Text style={styles.infoValue}>v1.2</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Sincronizada</Text>
            <Text style={styles.infoValue}>hace 2 min</Text>
          </View>
        </View>

        {/* Tarjetas inferiores */}
        <View style={styles.featuresRow}>
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Botón estrella</Text>
            <Text style={styles.featureDesc}>Toque corto cancela, 3 s envía</Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Pantalla OLED</Text>
            <Text style={styles.featureDesc}>Muestra la hora, sin delatar</Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Vibración</Text>
            <Text style={styles.featureDesc}>Confirma en silencio</Text>
          </View>
        </View>

      </ScrollView>

      {/* TabBar Inferior */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('MainTabs', { screen: 'InicioTab' })}>
          <Ionicons name="home-outline" size={22} color="#64748B" />
          <Text style={styles.navText}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('MainTabs', { screen: 'Mapa de Apoyo' })}>
          <Ionicons name="people-outline" size={22} color="#64748B" />
          <Text style={styles.navText}>Contactos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('MainTabs', { screen: 'Mapa de Apoyo' })}>
          <Ionicons name="location-outline" size={22} color="#64748B" />
          <Text style={styles.navText}>Acompáñame</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('MainTabs', { screen: 'Historial' })}>
          <Ionicons name="bookmark-outline" size={22} color="#64748B" />
          <Text style={styles.navText}>Recursos</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F8F6' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14 },
  backCircleButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  headerTitleContainer: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 13, color: '#64748B', marginTop: 1 },
  connectedChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E6F4EA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#137333', marginRight: 6 },
  connectedText: { fontSize: 12, color: '#137333', fontWeight: '700' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 85 },

  visor3dCard: { backgroundColor: '#F3E8FF', borderRadius: 24, paddingTop: 12, paddingBottom: 12, paddingHorizontal: 12, alignItems: 'center', marginBottom: 14 },
  imageContainer: { height: 260, width: '100%', borderRadius: 16, overflow: 'hidden' },
  webView3D: { flex: 1, backgroundColor: 'transparent' },
  dragText: { fontSize: 13, color: '#4A154B', fontWeight: '600', marginTop: 8 },

  angleButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  angleButton: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 12, alignItems: 'center', marginHorizontal: 3, borderWidth: 1, borderColor: '#E2E8F0' },
  angleButtonActive: { backgroundColor: '#582C83', borderColor: '#582C83' },
  angleButtonText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  angleButtonTextActive: { color: '#FFFFFF' },

  grid2x2: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 14 },
  infoCard: { width: '48.5%', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  infoLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  infoValue: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 4 },

  featuresRow: { flexDirection: 'row', justifyContent: 'space-between' },
  featureCard: { width: '31.5%', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  featureTitle: { fontSize: 12, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  featureDesc: { fontSize: 11, color: '#64748B', lineHeight: 15 },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 65, backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 11, color: '#64748B', marginTop: 2 }
});