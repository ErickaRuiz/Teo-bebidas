<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="main-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Ventas del Día</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="date-stepper">
        <ion-button fill="clear" @click="cambiarFecha(-1)">
          <ion-icon :icon="chevronBackOutline" slot="icon-only"></ion-icon>
        </ion-button>
        
        <div class="date-info">
          <ion-icon :icon="calendarOutline"></ion-icon>
          <span>{{ fechaVisual }}</span>
        </div>

        <ion-button fill="clear" @click="cambiarFecha(1)">
          <ion-icon :icon="chevronForwardOutline" slot="icon-only"></ion-icon>
        </ion-button>
      </div>

      <div class="resumen-caja">
        <p>TOTAL COBRADO (EFECTIVO)</p>
        <h2 class="monto-total">S/ {{ totalCobrado.toFixed(2) }}</h2>
        <ion-badge color="success">Pagos Confirmados</ion-badge>
      </div>

      <h2 class="section-title">Productos Vendidos</h2>
      
      <ion-list lines="none" class="transparent-list">
        <ion-item v-for="venta in ventasReales" :key="venta.id" class="venta-item">
          <ion-label>
            <h2 class="prod-name">{{ venta.cliente }}</h2>
            <p class="prod-info">Estado: {{ venta.estado }}</p>
          </ion-label>
          <div slot="end" class="precio-container">
            <p class="monto-unitario">S/ {{ venta.total.toFixed(2) }}</p>
            <ion-badge :color="venta.estado === 'cancelado' ? 'success' : 'warning'" class="mini-badge">
              {{ venta.estado }}
            </ion-badge>
          </div>
        </ion-item>
      </ion-list>

      <div v-if="ventasReales.length === 0" class="empty-state">
        <ion-icon :icon="cartOutline"></ion-icon>
        <p>No hay registros para este día</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, 
  IonItem, IonLabel, IonBadge, IonButtons, IonBackButton, IonIcon, IonButton 
} from '@ionic/vue';
import { cartOutline, chevronBackOutline, chevronForwardOutline, calendarOutline } from 'ionicons/icons';
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../supabase'; //

const fechaSeleccionada = ref(new Date());
const ventasReales = ref<any[]>([]);

// Formato bonito para el título: "viernes, 10 de abril"
const fechaVisual = computed(() => {
  return fechaSeleccionada.value.toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long'
  });
});

const cambiarFecha = (dias: number) => {
  const nuevaFecha = new Date(fechaSeleccionada.value);
  nuevaFecha.setDate(nuevaFecha.getDate() + dias);
  fechaSeleccionada.value = nuevaFecha;
  cargarVentas(); // Recarga los datos al cambiar fecha
};

const cargarVentas = async () => {
  // Definimos el rango: desde las 00:00:00 hasta las 23:59:59 del día elegido
  const inicio = new Date(fechaSeleccionada.value);
  inicio.setHours(0, 0, 0, 0);
  
  const fin = new Date(fechaSeleccionada.value);
  fin.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('ventas')
    .select('*')
    .gte('fecha', inicio.toISOString()) //
    .lte('fecha', fin.toISOString())
    .order('fecha', { ascending: false });

  if (error) {
    console.error(error);
  } else {
    ventasReales.value = data || [];
  }
};

const totalCobrado = computed(() => {
  return ventasReales.value
    .filter(v => v.estado === 'cancelado') // Solo suma los pagados
    .reduce((acc, v) => acc + v.total, 0);
});

const cobrarDeuda = async (ventaId: number) => {
  // Captura la fecha y hora de este preciso momento (Sábado 11)
  const ahora = new Date().toISOString(); 

  const { error } = await supabase
    .from('ventas')
    .update({ 
      estado: 'cancelado', // El cliente ya no debe
      fecha_pago: ahora    // ESTA ES LA CLAVE: El dinero entra a caja hoy
    })
    .eq('id', ventaId);

  if (!error) {
    alert("¡Dinero sumado a la caja de hoy!");
    cargarVentas(); // Recarga la lista para ver el nombre y el monto
  }
};
onMounted(() => {
  cargarVentas();
});

// Ejemplo de consulta para el total mensual
const obtenerTotalMes = async () => {
  const ahora = new Date();
  const primerDiaMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();

  const { data } = await supabase
    .from('ventas')
    .select('total')
    .gte('fecha', primerDiaMes)
    .eq('estado', 'cancelado'); // Solo sumamos lo cobrado en efectivo

  if (data) {
    const mensual = data.reduce((acc, v) => acc + v.total, 0);
    console.log("Ganancia del mes: S/", mensual);
  }
};
</script>

<style scoped>
/* ... tus otros estilos ... */

.date-stepper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #1a1a1a;
  border-radius: 12px;
  margin-bottom: 20px;
  padding: 5px;
}

.date-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-weight: bold;
  text-transform: capitalize;
  font-size: 0.9rem;
}

.date-info ion-icon {
  color: #3880ff;
}

.date-stepper ion-button {
  --color: white;
}
</style>