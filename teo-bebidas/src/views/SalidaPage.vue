<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="main-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" text="ATRÁS"></ion-back-button>
        </ion-buttons>
        <ion-title>GENERAR VENTA</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding content-dark">
      <div id="boleta-imprimible" class="ticket-container">
        
        <div class="ticket-header">
          <h1 class="brand-name">TEO BEBIDAS</h1>
          <p class="brand-sub">Venta de Bebidas </p>
          <div class="divider-dashed"></div>
          <h2 class="document-type">BOLETA ELECTRÓNICA</h2>
          <div class="datetime-container">
            <p>{{ fechaActual }}</p>
            <p>{{ horaActual }}</p>
          </div>
        </div>

        <div class="ticket-body">
          <div class="info-row">
            <span class="label">CLIENTE:</span>
            <ion-select 
              class="boleta-select-modern" 
              interface="popover" 
              placeholder="Seleccionar Cliente" 
              v-model="venta.cliente">
              <ion-select-option v-for="c in clientes" :key="c" :value="c">{{ c }}</ion-select-option>
            </ion-select>
          </div>

          <div class="divider-dashed"></div>

          <div class="add-section">
            <ion-select 
              class="boleta-select-modern full-width" 
              interface="popover" 
              placeholder="Elegir Producto" 
              v-model="tempProducto">
              <ion-select-option v-for="p in listaProductos" :key="p.id" :value="p">
                {{ p.nombre }}
              </ion-select-option>
            </ion-select>
            
            <div class="qty-row">
              <ion-input type="number" class="boleta-input-modern" v-model="tempCantidad" placeholder="Cant."></ion-input>
              <ion-button class="btn-add-circle" @click="agregarAlCarrito">
                AGREGAR +
              </ion-button>
            </div>
            <p class="unit-price-label" v-if="tempProducto">
              Precio Unit: <strong>S/ {{ tempProducto.precio.toFixed(2) }}</strong> | 
              Stock: <strong :style="{ color: tempProducto.stock_actual <= 5 ? 'red' : 'green' }">{{ tempProducto.stock_actual }}</strong>
            </p>
          </div>

          <div class="tabla-container" v-if="carrito.length > 0">
            <div class="tabla-header">
              <span class="col-prod">DESCRIPCIÓN</span>
              <span class="col-cant">CANT.</span>
              <span class="col-sub">TOTAL</span>
            </div>
            <div class="tabla-row" v-for="(item, index) in carrito" :key="index">
              <span class="col-prod">{{ item.nombre }}</span>
              <span class="col-cant">{{ item.cantidad }}</span>
              <span class="col-sub">S/ {{ (item.precio * item.cantidad).toFixed(2) }}</span>
              <ion-icon :icon="trashOutline" class="delete-icon" @click="eliminarItem(index)"></ion-icon>
            </div>
          </div>

          <div class="divider-dashed"></div>

          <div class="payment-section">
            <div class="payment-options">
              <div :class="['pay-btn-sm', venta.estado === 'cancelado' ? 'active-pay' : '']" @click="venta.estado = 'cancelado'">
                CANCELADO
              </div>
              <div :class="['pay-btn-sm', venta.estado === 'credito' ? 'active-debt' : '']" @click="venta.estado = 'credito'">
                A CRÉDITO
              </div>
            </div>
          </div>
        </div>

        <div class="ticket-footer">
          <p class="total-text-sm">TOTAL A PAGAR</p>
          <h1 class="total-amount-reduced">S/ {{ totalDinero.toFixed(2) }}</h1>
          <p class="footer-msg" v-if="venta.estado === 'credito'">*** CUENTA POR COBRAR ***</p>
        </div>
      </div>

      <div class="action-footer">
        <div class="button-row">
          <ion-button class="btn-save-main" @click="confirmarVenta" :disabled="carrito.length === 0">
            FINALIZAR VENTA
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, 
  IonBackButton, IonSelect, IonSelectOption, IonInput, IonButton, IonIcon 
} from '@ionic/vue';
import { trashOutline } from 'ionicons/icons';
import { ref, computed, onMounted, onUnmounted } from 'vue'; 
import { supabase } from '../supabase';

const fechaActual = ref('');
const horaActual = ref('');
const clientes = ref<any[]>([]);
const listaProductos = ref<any[]>([]);
const venta = ref({ cliente: '', estado: 'cancelado' });
const carrito = ref<any[]>([]);
const tempProducto = ref<any>(null);
const tempCantidad = ref<number | null>(null);

const cargarDatos = async () => {
  const { data: prodData } = await supabase.from('productos').select('*').order('nombre');
  if (prodData) listaProductos.value = prodData;

  const { data: cliData } = await supabase.from('clientes').select('nombre');
  if (cliData) clientes.value = cliData.map(c => c.nombre);
};

const totalDinero = computed(() => {
  return carrito.value.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
});

const agregarAlCarrito = () => {
  if (tempProducto.value && tempCantidad.value && tempCantidad.value > 0) {
    const cantInput = Number(tempCantidad.value);

    // --- ALERTA DE STOCK ---
    if (cantInput > tempProducto.value.stock_actual) {
      alert(`¡STOCK INSUFICIENTE! 🛑\nSolo quedan ${tempProducto.value.stock_actual} unidades.`);
      return;
    }

    const existe = carrito.value.find(item => item.id === tempProducto.value.id);
    if (existe) {
      if ((existe.cantidad + cantInput) > tempProducto.value.stock_actual) {
        alert("No puedes agregar más; superarías el stock disponible.");
        return;
      }
      existe.cantidad += cantInput;
    } else {
      carrito.value.push({ 
        ...tempProducto.value, 
        cantidad: cantInput 
      });
    }
    tempProducto.value = null;
    tempCantidad.value = null;
  } else {
    alert("Selecciona un producto y cantidad válida");
  }
};

const eliminarItem = (i: number) => {
  carrito.value.splice(i, 1);
};

const confirmarVenta = async () => {
  if (!venta.value.cliente || carrito.value.length === 0) {
    alert("Por favor, selecciona un cliente y añade productos.");
    return;
  }

  try {
    // 1. Insertar la venta
    const { error: ventaError } = await supabase
      .from('ventas')
      .insert([
        {
          cliente: venta.value.cliente,
          productos: carrito.value,
          total: totalDinero.value,
          estado: venta.value.estado,
          fecha: new Date().toISOString(),
          fecha_pago: venta.value.estado === 'cancelado' ? new Date().toISOString() : null
        }
      ]);

    if (ventaError) throw ventaError;

    // 2. REDUCIR STOCK AUTOMÁTICAMENTE
    for (const item of carrito.value) {
      const nuevoStock = item.stock_actual - item.cantidad;
      
      const { error: stockError } = await supabase
        .from('productos')
        .update({ stock_actual: nuevoStock })
        .eq('id', item.id);

      if (stockError) console.error(`Error en stock de ${item.nombre}`);
    }

    alert("¡Venta guardada y stock actualizado! ✅");
    
    carrito.value = [];
    venta.value.cliente = '';
    await cargarDatos(); // Refresca la lista con los nuevos stocks

  } catch (err: any) {
    alert("Error: " + err.message);
  }
};

const actualizarReloj = () => {
  const ahora = new Date();
  fechaActual.value = ahora.toLocaleDateString('es-PE');
  horaActual.value = ahora.toLocaleTimeString('es-PE');
};

let intervalo: any;
onMounted(() => {
  cargarDatos();
  actualizarReloj();
  intervalo = setInterval(actualizarReloj, 1000);
});
onUnmounted(() => {
  clearInterval(intervalo);
});
</script>

<style scoped>
.content-dark { --background: #0d0d0d !important; }
.main-toolbar { --background: #002e5d; --color: white; }

.ticket-container {
  background: white;
  border-radius: 4px;
  padding: 30px 15px;
  color: #1a1a1a;
  box-shadow: 0 5px 20px rgba(0,0,0,0.8);
  font-family: 'Inter', sans-serif;
}

.ticket-header { text-align: center; }
.brand-name { font-size: 1.8rem; font-weight: 900; color: #002e5d; margin: 0; }
.brand-sub { font-size: 0.7rem; color: #666; margin-top: 5px; }
.document-type { font-size: 0.85rem; font-weight: 700; margin-top: 15px; letter-spacing: 1px; }

.divider-dashed { border-top: 2px dashed #ddd; margin: 15px 0; }

.info-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 10px; }
.label { font-weight: 800; font-size: 0.8rem; color: #333; }
.boleta-select-modern { 
  --background: #f8f9fa; 
  border: 1px solid #e0e0e0; 
  border-radius: 8px;
  font-weight: 600;
  flex: 1;
}

.add-section { margin-top: 15px; display: flex; flex-direction: column; gap: 10px; }
.qty-row { display: flex; gap: 10px; align-items: center; }
.boleta-input-modern { --background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; width: 80px; text-align: center; font-weight: 700; height: 40px; }
.btn-add-circle { --background: #002e5d; --border-radius: 8px; flex: 1; font-weight: bold; margin: 0; color: white; }

.unit-price-label { font-size: 0.85rem; color: #002e5d; margin: 0 5px; }

.tabla-container { margin-top: 20px; }
.tabla-header { display: grid; grid-template-columns: 2fr 1fr 1fr 30px; font-weight: 900; font-size: 0.75rem; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 5px; }
.tabla-row { display: grid; grid-template-columns: 2fr 1fr 1fr 30px; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee; font-size: 0.85rem; font-weight: 600; }
.delete-icon { font-size: 1.2rem; color: #ff4961; cursor: pointer; }

.payment-section { margin-top: 15px; }
.payment-options { display: flex; gap: 10px; justify-content: center; }
.pay-btn-sm {
  flex: 1;
  max-width: 140px;
  padding: 10px;
  border-radius: 8px;
  text-align: center;
  font-weight: 800;
  font-size: 0.75rem;
  border: 2px solid #f0f0f0;
  color: #666;
  cursor: pointer;
}
.active-pay { background: #00c853; color: white; border-color: #00c853; }
.active-debt { background: #e60000; color: white; border-color: #e60000; }

.ticket-footer { text-align: center; margin-top: 20px; border-top: 2px dashed #ddd; padding-top: 15px; }
.total-text-sm { font-weight: 800; color: #888; margin: 0; font-size: 0.7rem; }
.total-amount-reduced { font-size: 2.4rem; font-weight: 900; color: #002e5d; margin: 5px 0 0 0; }
.footer-msg { font-size: 0.7rem; color: #ff4961; font-weight:bold; }

.action-footer { margin-top: 25px; padding: 0 5px; }
.button-row { display: flex; gap: 12px; align-items: center; }

.btn-save-main {
  flex: 1;
  --background: #002e5d;
  --color: #ffffff !important; /* Blanco puro */
  --border-radius: 12px;
  font-weight: 800; /* Texto más grueso */
  height: 56px;
  margin: 0;
  font-size: 1.1rem; /* Un poco más grande */
  letter-spacing: 1px;
}
.btn-save-main[disabled] {
  --color: rgba(255, 255, 255, 0.5); /* Blanco semi-transparente */
  opacity: 0.7;
}
.datetime-container {
  margin-top: 10px;
  font-size: 0.8rem;
  color: #555;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
}
</style>