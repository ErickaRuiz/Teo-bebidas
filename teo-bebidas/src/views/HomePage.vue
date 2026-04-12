<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="main-toolbar">
        <ion-title>Panel Teo Bebidas</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="cerrarSesion">
            <ion-icon :icon="logOutOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="form-wrapper">
        
      <div class="stats-grid">
  <div class="stat-card stock-btn" @click="irA('stock')">
    <p class="label-superior">STOCK ACTUAL</p>
    <h2 class="cantidad-numero">{{ stockTotalGlobal }}</h2> 
    <ion-icon :icon="cubeOutline" class="mini-icon-bg"></ion-icon>
  </div>

  <div :class="['stat-card', colorMetaVentas]" @click="irA('ventas')">
    <p class="label-superior-blanco">EFECTIVO HOY</p>
    <h2 class="monto-numero">S/ {{ totalVentasPagadas.toFixed(2) }}</h2>
    <ion-icon :icon="trendingUpOutline" class="mini-icon-bg-blanco"></ion-icon>
  </div>
</div>

<h2 class="section-title">Reporte de Ventas</h2>
<div class="reporte-full-card" @click="irA('reporte')">
  <div class="reporte-content">
    <div class="icon-box-dark">
      <ion-icon :icon="barChartOutline"></ion-icon>
    </div>
    <div class="reporte-text">
      <span class="reporte-title">REPORTE DETALLADO</span>
      <span class="reporte-subtitle">Análisis semanal y mensual</span>
    </div>
  </div>
  <ion-icon :icon="cubeOutline" class="cube-mini-icon"></ion-icon>
</div>  


        <h2 class="section-title">Gestión de Inventario</h2>
        <div class="action-grid">
          <ion-card class="action-card" @click="irA('ingreso')">
            <ion-card-content>
              <ion-icon :icon="addCircleOutline"></ion-icon>
              <p>Ingreso de Productos</p>
            </ion-card-content>
          </ion-card>

          <ion-card class="action-card" @click="irA('salida')">
            <ion-card-content>
              <ion-icon :icon="removeCircleOutline"></ion-icon>
              <p>Salida / Ventas</p>
            </ion-card-content>
          </ion-card>
        </div>

        <h2 class="section-title">Gestión de Clientes</h2>
        <div class="action-grid">
          <ion-card class="action-card" @click="irA('clientes')">
            <ion-card-content>
              <ion-icon :icon="peopleOutline"></ion-icon>
              <p>Agregar Cliente</p>
            </ion-card-content>
          </ion-card>

          <ion-card class="action-card" @click="irA('deudas')">
            <ion-card-content>
              <ion-icon :icon="walletOutline"></ion-icon>
              <p>Cuentas por Cobrar</p>
            </ion-card-content>
          </ion-card>
        </div>

        <h2 class="section-title">Alertas de Inventario</h2>
        <ion-list lines="full" class="custom-list">
          <ion-item v-if="productosAlerta.length === 0">
            <ion-label><p>Todo el stock está bien</p></ion-label>
          </ion-item>

          <ion-item v-for="prod in productosAlerta" :key="prod.id" button @click="irA('stock')">
            <ion-label>
              <h2 class="text-white">{{ prod.nombre }}</h2>
              <p>Quedan {{ prod.stock_actual }} unidades</p>
            </ion-label>
            <ion-badge color="danger" slot="end">¡Alerta!</ion-badge>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, 
  IonIcon, IonButton, IonButtons, IonCard, IonCardContent,
  IonList, IonItem, IonLabel, IonBadge
} from '@ionic/vue';
import { 
  logOutOutline, cubeOutline, trendingUpOutline, 
  addCircleOutline, removeCircleOutline, 
  peopleOutline, walletOutline, barChartOutline // <--- Agrega este
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { ref, onMounted, computed } from 'vue';
import { supabase } from '../supabase';

const router = useRouter();
const stockTotalGlobal = ref(0); 
const productosAlerta = ref<any[]>([]);
const ventasHoy = ref<any[]>([]); 

// --- CONFIGURACIÓN DE METAS ---
const metaDiaria = 100.00; 

// Cálculo del dinero real que ingresó hoy
const totalVentasPagadas = computed(() => {
  const hoy = new Date().toLocaleDateString('en-CA'); // Formato YYYY-MM-DD

  return ventasHoy.value
    .filter(v => {
      // Suma si se pagó hoy (venta directa o deuda cobrada hoy)
      return v.fecha_pago && v.fecha_pago.includes(hoy);
    })
    .reduce((acc, v) => acc + (parseFloat(v.total) || 0), 0);
});
// Color dinámico: Verde si llegas a la meta de efectivo, Rojo si no
const colorMetaVentas = computed(() => {
  return totalVentasPagadas.value >= metaDiaria ? 'bg-verde' : 'bg-rojo';
});

const cargarVentasHoy = async () => {
  // Obtenemos el inicio y fin del día actual en formato ISO
  const ahora = new Date();
  const hoy = ahora.toLocaleDateString('en-CA'); // "2026-04-11"
  const inicioDia = `${hoy}T00:00:00.000Z`;
  const finDia = `${hoy}T23:59:59.999Z`;

  const { data, error } = await supabase
    .from('ventas')
    .select('*')
    // Traemos ventas que se crearon hoy O que se pagaron hoy
    .or(`fecha.gte.${inicioDia},fecha_pago.gte.${inicioDia}`)
    .lte('fecha', finDia); 

  if (error) {
    console.error("Error al obtener ventas:", error);
  } else {
    ventasHoy.value = data || [];
  }
};

const obtenerSumaStock = async () => {
  const { data } = await supabase.from('productos').select('stock_actual');
  if (data) {
    stockTotalGlobal.value = data.reduce((acc, p) => acc + (p.stock_actual || 0), 0);
  }
};

const cargarAlertas = async () => {
  const { data } = await supabase
    .from('productos')
    .select('*')
    .lte('stock_actual', 5)
    .order('stock_actual', { ascending: true });
  if (data) productosAlerta.value = data;
};

// HomePage.vue
onMounted(() => {
  obtenerSumaStock();
  cargarAlertas();
  cargarVentasHoy(); 

  // ESCUCHA CAMBIOS EN VIVO
  supabase
    .channel('cambios-ventas')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, () => {
      console.log("¡Venta actualizada! Recargando total...");
      cargarVentasHoy(); // Esto actualiza el S/ 0.00 automáticamente
    })
    .subscribe();
});
const irA = (ruta: string) => {
  const rutas: Record<string, string> = {
    'clientes': '/agregar-cliente',
    'deudas': '/cuentas-cobrar',
    'stock': '/stock',
    'ventas': '/ventas-hoy',
    'reporte': '/reporte-ventas' // Cambié 'reporteVentas' por 'reporte'
  };
  
  const destino = rutas[ruta] || `/${ruta}`;
  router.push(destino);
};


const cerrarSesion = () => router.push('/login');
</script>

<style scoped>
ion-content { --background: #0b0b0b !important; }
.main-toolbar { --background: #002e5d; --color: white; }

.form-wrapper { padding: 15px; display: flex; flex-direction: column; gap: 12px; }
.section-title { color: #ffffff; font-size: 0.9rem; font-weight: 800; margin: 15px 0 5px 5px; opacity: 0.8; }

.stats-grid { display: flex; gap: 10px; }
.stat-card { 
  flex: 1; padding: 18px 10px; border-radius: 16px; 
  text-align: center; cursor: pointer; position: relative; 
  overflow: hidden; transition: 0.2s ease;
}
.stat-card:active { transform: scale(0.92); }

.stock-btn { background: white !important; border: 2px solid #002e5d; display: flex; flex-direction: column; align-items: center; justify-content: center;}
.label-superior { color: #002e5d; font-size: 0.6rem; font-weight: 900; margin: 0; }
.cantidad-numero { color: #002e5d !important; font-size: 2.5rem; font-weight: 900; margin: 0; z-index: 2; }
.mini-icon-bg { position: absolute; right: 5px; bottom: 5px; font-size: 3rem; color: rgba(0, 46, 93, 0.1); z-index: 1; }

.bg-verde { background: linear-gradient(135deg, #2dd36f, #1a8a43) !important; }
.bg-rojo { background: linear-gradient(135deg, #ff4961, #ba1a33) !important; }
.label-superior-blanco { color: rgba(255,255,255,0.9); font-size: 0.6rem; font-weight: 900; margin: 0; }
.monto-numero { color: white !important; font-size: 1.4rem; font-weight: 900; margin: 5px 0; }
.mini-icon-bg-blanco { position: absolute; right: -10px; bottom: -10px; font-size: 3rem; color: rgba(255, 255, 255, 0.1); }

.action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.action-card { margin: 0; border-radius: 15px; background: #002e5d; color: white; border: 1px solid rgba(255,255,255,0.1); }
.action-card ion-icon { font-size: 1.8rem; color: white; margin-bottom: 5px; }
.action-card p { font-size: 0.75rem; font-weight: bold; margin: 0; }

.custom-list { background: transparent; border-radius: 12px; }
ion-item { --background: #1a1a1a; --color: white; margin-bottom: 5px; border-radius: 10px; }
.text-white { color: white !important; font-weight: bold; }

.reporte-full-card {
  background: #004a99; /* El azul de tu captura */
  margin: 10px 5px;
  padding: 15px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  position: relative;
}

.reporte-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* El cuadro azul oscuro detrás del icono principal */
.icon-box-dark {
  background: rgba(0, 0, 0, 0.2);
  padding: 12px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-box-dark ion-icon {
  font-size: 1.8rem;
  color: white;
}

.reporte-text {
  display: flex;
  flex-direction: column;
}

.reporte-title {
  color: white;
  font-weight: 800;
  font-size: 1.1rem;
}

.reporte-subtitle {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
  font-weight: 600;
}

/* El icono de cubo pequeño decorativo a la derecha */
.cube-mini-icon {
  color: rgba(255, 255, 255, 0.3);
  font-size: 1.5rem;
}

.reporte-full-card:active {
  transform: scale(0.98);
  filter: brightness(0.9);
}
</style>