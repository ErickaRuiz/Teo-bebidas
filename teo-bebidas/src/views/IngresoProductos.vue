<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="main-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" text="ATRÁS"></ion-back-button>
        </ion-buttons>
        <ion-title>Ingreso de Stock</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="form-wrapper">
        
        <ion-button 
          v-if="idProductoSeleccionado" 
          expand="block" 
          fill="outline" 
          class="btn-modificar"
          @click="activarModoEdicion"
        >
          <ion-icon slot="start" :icon="createOutline"></ion-icon>
          MODIFICAR PRODUCTO SELECCIONADO
        </ion-button>

        <h2 class="form-title">Detalle del producto</h2>

        <ion-item fill="outline" mode="md" class="custom-item select-item">
          <ion-label position="stacked">Seleccionar Existente (Opcional)</ion-label>
          <ion-select 
            placeholder="Toca para elegir" 
            @ionChange="cargarDatosProducto($event)"
            interface="popover" 
            class="select-producto"
            :interface-options="{ cssClass: 'my-custom-popover' }"
          >
            <ion-select-option v-for="p in listaProductos" :key="p.id" :value="p">
              {{ p.nombre }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item fill="outline" mode="md" class="custom-item">
          <ion-label position="stacked">Nombre del Producto</ion-label>
          <ion-input v-model="nombre" type="text" placeholder="Ej. Cerveza Pilsen"></ion-input>
        </ion-item>

        <ion-item fill="outline" mode="md" class="custom-item">
          <ion-label position="stacked">Precio del producto</ion-label>
          <div class="input-row">
            <span class="currency-symbol">S/.</span>
            <ion-input 
              v-model="precio" 
              type="number" 
              placeholder="0.00" 
              @ionBlur="formatearPrecio" 
              class="price-input"
            ></ion-input>
          </div>
        </ion-item>

        <div v-if="!esModoEdicion">
          <ion-item fill="outline" mode="md" class="custom-item">
            <ion-label position="floating">Unidades Sueltas</ion-label>
            <ion-input v-model="cantidad" type="number" placeholder="0"></ion-input>
          </ion-item>

          <ion-item fill="outline" mode="md" class="custom-item">
            <ion-label position="floating">¿Cuántas cajas entran?</ion-label>
            <ion-input v-model="cantidadCajas" type="number" placeholder="0"></ion-input>
          </ion-item>

          <div class="info-section" v-if="cantidadCajas > 0">
            <p class="date-label">Equivale a:</p>
            <p class="date-value">{{ (cantidadCajas || 0) * 12 }} Unidades totales</p>
          </div>
        </div>

        <ion-button expand="block" shape="round" class="btn-save" @click="procesarAccion">
          {{ esModoEdicion ? 'Actualizar Datos' : 'Registrar Ingreso' }}
        </ion-button>

        <ion-button v-if="esModoEdicion" expand="block" fill="clear" color="danger" @click="cancelarEdicion">
          Cancelar Modificación
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonItem, IonLabel, IonInput, IonButton, IonButtons, 
  IonBackButton, IonSelect, IonSelectOption, IonIcon 
} from '@ionic/vue';
import { createOutline } from 'ionicons/icons';
import { ref, onMounted } from 'vue';
import { supabase } from '../supabase';
import { useRouter } from 'vue-router';

const router = useRouter();
const nombre = ref('');
const precio = ref<any>(null);
const cantidad = ref();
const cantidadCajas = ref();
const listaProductos = ref<any[]>([]);
const idProductoSeleccionado = ref<any>(null);
const esModoEdicion = ref(false);

// Variable para controlar el reset visual del select
const productoModel = ref(null);

// 1. CARGAR CATÁLOGO AL INICIAR
const obtenerProductos = async () => {
  const { data } = await supabase
    .from('productos')
    .select('id, nombre, precio')
    .order('nombre', { ascending: true });
  if (data) listaProductos.value = data;
};

// 2. AUTOCOMPLETAR AL SELECCIONAR UN PRODUCTO
const cargarDatosProducto = (ev: any) => {
  const p = ev.detail.value;
  if (p) {
    idProductoSeleccionado.value = p.id;
    nombre.value = p.nombre;
    precio.value = p.precio.toFixed(2);
    // Limpiamos cantidades para evitar errores de registros anteriores
    cantidad.value = null;
    cantidadCajas.value = null;
    esModoEdicion.value = false;
  }
};

const activarModoEdicion = () => {
  esModoEdicion.value = true;
};

// 3. LIMPIEZA TOTAL DEL FORMULARIO
const limpiarFormulario = () => {
  nombre.value = '';
  precio.value = null;
  cantidad.value = null;
  cantidadCajas.value = null;
  idProductoSeleccionado.value = null;
  productoModel.value = null; // Limpia el selector visualmente
  esModoEdicion.value = false;
};

const cancelarEdicion = () => {
  limpiarFormulario();
};

const formatearPrecio = () => {
  if (precio.value !== null && precio.value !== '') {
    precio.value = parseFloat(precio.value).toFixed(2);
  }
};

const procesarAccion = async () => {
  if (esModoEdicion.value) {
    await actualizarProducto();
  } else {
    await guardarIngreso();
  }
};

// 4. ACTUALIZAR PRODUCTO (MODO EDICIÓN)
const actualizarProducto = async () => {
  try {
    const { error } = await supabase
      .from('productos')
      .update({
        nombre: nombre.value.trim(),
        precio: parseFloat(precio.value)
      })
      .eq('id', idProductoSeleccionado.value);

    if (error) throw error;
    
    alert("Producto actualizado correctamente");
    
    // Limpieza y refresco
    limpiarFormulario();
    await obtenerProductos(); 
    
  } catch (err: any) {
    alert("Error: " + err.message);
  }
};

// 5. GUARDAR INGRESO (MODO REGISTRO/SUMA)
const guardarIngreso = async () => {
  const numCajas = parseInt(cantidadCajas.value) || 0;
  const numUnidadesSueltas = parseInt(cantidad.value) || 0;
  const unidadesNuevas = numCajas > 0 ? numCajas * 12 : numUnidadesSueltas;

  if (!nombre.value || unidadesNuevas <= 0 || !precio.value) {
    alert("Por favor, completa el nombre, precio y cantidad.");
    return;
  }

  try {
    const { data: productoExistente } = await supabase
      .from('productos')
      .select('id, stock_actual')
      .eq('nombre', nombre.value.trim())
      .maybeSingle();

    let stockFinal = unidadesNuevas;

    if (productoExistente) {
      stockFinal = (productoExistente.stock_actual || 0) + unidadesNuevas;
      const { error } = await supabase
        .from('productos')
        .update({ 
          stock_actual: stockFinal, 
          precio: parseFloat(precio.value) 
        })
        .eq('id', productoExistente.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('productos')
        .insert([{ 
          nombre: nombre.value.trim(), 
          precio: parseFloat(precio.value), 
          stock_actual: unidadesNuevas 
        }]);
      if (error) throw error;
    }

    alert(`¡Stock actualizado! Total ahora: ${stockFinal}`);
    router.back();

  } catch (err: any) {
    alert("Error al guardar: " + err.message);
  }
};

onMounted(() => {
  obtenerProductos();
});
</script>

<style scoped>
/* ESTILOS ORIGINALES MANTENIDOS */
ion-content { --background: #f7f9fc !important; }
.main-toolbar { --background: #002e5d; --color: white; }
ion-back-button { --color: white !important; }
.form-wrapper { padding: 30px 20px; display: flex; flex-direction: column; gap: 15px; }
.form-title { color: #002e5d; font-size: 1.3rem; font-weight: 800; margin-bottom: 10px; }

.custom-item {
  --background: #ffffff;
  --border-radius: 12px;
  --padding-start: 15px;
  margin-bottom: 5px;
  box-shadow: 0 4px 12px rgba(0, 46, 93, 0.06); 
  border: 1px solid #edf2f7;
}

.select-producto {
  color: #000 !important;
  --placeholder-color: #666;
  --placeholder-opacity: 1;
  padding-top: 15px !important;
  min-height: 55px;
  display: flex;
  align-items: center;
  font-weight: 500;
}

ion-label { color: #002e5d !important; font-weight: 700 !important; font-size: 0.95rem; }
ion-input { --color: #000 !important; font-weight: 500; margin-top: 10px; margin-bottom: 10px; }

.info-section {
  text-align: center; margin: 15px 0; padding: 15px;
  background: #eef2f7; border-radius: 12px; border: 1px dashed #002e5d;
}

.date-label { color: #556b8d; font-size: 0.75rem; text-transform: uppercase; }
.date-value { color: #002e5d; font-weight: bold; }

.btn-save {
  --background: #002e5d !important;
  margin-top: 15px; height: 60px; font-weight: bold;
  border-radius: 12px; box-shadow: 0 6px 16px rgba(0, 46, 93, 0.2);
}

/* ESTILO DEL NUEVO BOTÓN MODIFICAR */
.btn-modificar {
  --color: #f70909;
  --border-color: #f70909;
  margin-bottom: 10px;
  font-weight: bold;
  text-transform: uppercase;
}

.input-row { display: flex; align-items: center; margin-top: 10px; }
.currency-symbol { color: #002e5d; font-weight: bold; font-size: 1.1rem; margin-right: 5px; }
.price-input { flex: 1; }
.select-item { --padding-top: 10px; --padding-bottom: 10px; }
.select-item ion-label { margin-bottom: 10px !important; }
</style>