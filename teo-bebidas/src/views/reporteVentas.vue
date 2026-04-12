<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="main-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" text="ATRÁS"></ion-back-button>
        </ion-buttons>
        <ion-title>REPORTES DE VENTAS</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding content-dark">
      <div class="stats-grid">
        <div class="stat-card weekly">
          <p>ESTA SEMANA</p>
          <h2>S/ {{ totalSemana.toFixed(2) }}</h2>
        </div>
        <div class="stat-card monthly">
          <p>ESTE MES</p>
          <h2>S/ {{ totalMes.toFixed(2) }}</h2>
        </div>
        <div class="stat-card yearly">
          <p>AÑO {{ currentYear }}</p>
          <h2>S/ {{ totalAnual.toFixed(2) }}</h2>
        </div>
      </div>

      <div class="divider-dashed"></div>

      <div class="filter-row">
        <ion-button 
          size="small" 
          :fill="filtroActivo === 'hoy' ? 'solid' : 'outline'" 
          @click="filtrar('hoy')"
        >HOY</ion-button>
        <ion-button 
          size="small" 
          :fill="filtroActivo === 'semana' ? 'solid' : 'outline'" 
          @click="filtrar('semana')"
        >SEMANA</ion-button>
        <ion-button 
          size="small" 
          :fill="filtroActivo === 'mes' ? 'solid' : 'outline'" 
          @click="filtrar('mes')"
        >MES</ion-button>
      </div>

      <h2 class="section-title">Detalle de Ventas ({{ filtroActivo.toUpperCase() }})</h2>

      <div class="sales-list">
        <div v-if="ventasFiltradas.length === 0" class="no-data">
          No hay ventas registradas en este periodo.
        </div>
        
        <div v-for="v in ventasFiltradas" :key="v.id" class="sale-item">
          <div class="sale-info">
            <span class="client-name">{{ v.cliente || 'Venta General' }}</span>
            <span class="sale-date">{{ formatearFecha(v.fecha) }}</span>
          </div>
          <div class="sale-amount">
            <span :class="['status-badge', v.estado]">{{ v.estado }}</span>
            <span class="price">S/ {{ parseFloat(v.total).toFixed(2) }}</span>
          </div>
        </div>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '../supabase';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButtons, IonBackButton, IonButton 
} from '@ionic/vue';

const totalSemana = ref(0);
const totalMes = ref(0);
const totalAnual = ref(0);
const ventasFiltradas = ref<any[]>([]);
const filtroActivo = ref('hoy');
const currentYear = new Date().getFullYear();

// Carga los totales de las tarjetas superiores
const cargarReportesResumen = async () => {
  const ahora = new Date();
  const primerDiaAnio = new Date(ahora.getFullYear(), 0, 1).toISOString();

  const { data: todasVentas } = await supabase
    .from('ventas')
    .select('*')
    .gte('fecha', primerDiaAnio)
    .eq('estado', 'cancelado'); // Solo sumamos lo pagado

  if (todasVentas) {
    const inicioSemana = new Date(ahora);
    inicioSemana.setDate(ahora.getDate() - (ahora.getDay() === 0 ? 6 : ahora.getDay() - 1));
    inicioSemana.setHours(0,0,0,0);

    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    totalAnual.value = todasVentas.reduce((acc, v) => acc + (v.total || 0), 0);
    totalMes.value = todasVentas
      .filter(v => new Date(v.fecha) >= inicioMes)
      .reduce((acc, v) => acc + (v.total || 0), 0);
    totalSemana.value = todasVentas
      .filter(v => new Date(v.fecha) >= inicioSemana)
      .reduce((acc, v) => acc + (v.total || 0), 0);
  }
};

// Filtra y carga la lista de ventas inferior
const filtrar = async (tipo: string) => {
  filtroActivo.value = tipo;
  const ahora = new Date();
  let fechaInicio = new Date();

  if (tipo === 'hoy') {
    fechaInicio.setHours(0, 0, 0, 0);
  } else if (tipo === 'semana') {
    fechaInicio.setDate(ahora.getDate() - (ahora.getDay() === 0 ? 6 : ahora.getDay() - 1));
    fechaInicio.setHours(0, 0, 0, 0);
  } else if (tipo === 'mes') {
    fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  }

  const { data, error } = await supabase
    .from('ventas')
    .select('*')
    .gte('fecha', fechaInicio.toISOString())
    .order('fecha', { ascending: false });

  if (!error) {
    ventasFiltradas.value = data || [];
  }
};

const formatearFecha = (f: string) => {
  return new Date(f).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(() => {
  cargarReportesResumen();
  filtrar('hoy'); // Carga inicial
});
</script>

<style scoped>
.content-dark { --background: #0d0d0d !important; }
.main-toolbar { --background: #002e5d; --color: white; }

.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }

.stat-card { padding: 15px; border-radius: 12px; text-align: center; color: white; }
.weekly { background: #0056b3; }
.monthly { background: #00c853; }
.yearly { background: #6a1b9a; grid-column: span 2; }

.stat-card h2 { margin: 5px 0 0; font-weight: 900; }
.stat-card p { margin: 0; font-size: 0.7rem; font-weight: bold; opacity: 0.8; }

.filter-row { display: flex; gap: 8px; margin: 15px 0; }
.section-title { color: white; font-size: 1rem; font-weight: 800; margin-bottom: 10px; }

.sale-item {
  background: #1a191d;
  margin-bottom: 8px;
  padding: 12px;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.client-name { color: white; display: block; font-weight: bold; }
.sale-date { color: #888; font-size: 0.75rem; }

.sale-amount { text-align: right; }
.price { color: #00c853; font-weight: 900; display: block; font-size: 1.1rem; }

.status-badge {
  font-size: 0.6rem;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: bold;
  margin-bottom: 4px;
  display: inline-block;
}
.cancelado { background: #00c853; color: white; }
.credito { background: #ff4961; color: white; } /* Rojo para crédito */

.no-data { color: #888; text-align: center; margin-top: 20px; font-size: 0.9rem; }
.divider-dashed { border-top: 1px dashed #444; margin: 20px 0; }
</style>