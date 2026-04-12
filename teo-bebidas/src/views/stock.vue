<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="main-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" text="ATRÁS"></ion-back-button>
        </ion-buttons>
        <ion-title>Inventario Total</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-searchbar v-model="busqueda" placeholder="Buscar producto..." class="custom-search"></ion-searchbar>

      <div class="inventory-container">
        <div class="inventory-header">
          <span>Producto</span>
          <span>Cantidad</span>
        </div>

        <ion-list lines="none" class="transparent-list">
          <ion-item-sliding v-for="p in productosFiltrados" :key="p.id">
            
            <ion-item class="inventory-item">
              <ion-avatar slot="start" class="product-icon">
                <ion-icon :icon="waterOutline"></ion-icon>
              </ion-avatar>
              
              <ion-label>
                <h2 class="product-name">{{ p.nombre }}</h2>
                <p class="product-detail">Precio: S/. {{ p.precio.toFixed(2) }}</p>
              </ion-label>

              <div slot="end" class="stock-badge-container">
                <ion-badge :color="p.stock_actual <= 5 ? 'danger' : 'success'" class="stock-number">
                  {{ p.stock_actual }}
                </ion-badge>
              </div>
            </ion-item>

            
            
          </ion-item-sliding>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, 
  IonItem, IonLabel, IonBadge, IonSearchbar, IonButtons, 
  IonBackButton, IonAvatar, IonIcon, IonItemSliding, 
  IonItemOptions, IonItemOption, alertController 
} from '@ionic/vue';
import { waterOutline, createOutline, trashOutline } from 'ionicons/icons';
import { ref, onMounted, computed } from 'vue';
import { supabase } from '../supabase';
import { useRouter } from 'vue-router';

const router = useRouter();
const busqueda = ref('');
const productos = ref<any[]>([]);

const cargarProductosDesdeBaseDeDatos = async () => {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('nombre', { ascending: true });
  if (!error) productos.value = data;
};

// Función para borrar con confirmación
const eliminarProducto = async (p: any) => {
  const alert = await alertController.create({
    header: 'Confirmar',
    message: `¿Seguro que quieres eliminar ${p.nombre}?`,
    buttons: [
      { text: 'No', role: 'cancel' },
      { 
        text: 'Sí, borrar', 
        handler: async () => {
          const { error } = await supabase.from('productos').delete().eq('id', p.id);
          if (!error) cargarProductosDesdeBaseDeDatos();
        }
      }
    ]
  });
  await alert.present();
};

// Función para ir a la pantalla de edición
const editarProducto = (p: any) => {
  // Aquí puedes redirigir a tu formulario de ingreso pero en modo edición
  console.log("Editando:", p.nombre);
};

onMounted(() => { cargarProductosDesdeBaseDeDatos(); });

const productosFiltrados = computed(() => {
  return productos.value.filter(p => p.nombre.toLowerCase().includes(busqueda.value.toLowerCase()));
});
</script>

<style scoped>
ion-content { --background: #0b0b0b !important; }
.main-toolbar { --background: #002e5d; --color: white; }

.custom-search {
  --background: #1a1a1a;
  --color: white;
  --placeholder-color: #888;
  --border-radius: 12px;
}

.inventory-header {
  display: flex;
  justify-content: space-between;
  padding: 10px 15px;
  color: #a1a1a1;
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
}

.inventory-item {
  --background: #1a1a1a;
  --border-radius: 14px;
  margin-bottom: 8px;
  --padding-start: 10px;
}

.product-icon {
  background: #002e5d;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.product-name { color: white !important; font-weight: bold; font-size: 0.95rem; }
.product-detail { color: #888; font-size: 0.8rem; }

.stock-number {
  font-size: 1rem;
  padding: 8px 12px;
  border-radius: 8px;
  min-width: 45px;
}

.transparent-list { background: transparent; }

/* Estilo para los botones de deslizamiento */
ion-item-option {
  --border-radius: 12px;
  margin: 5px;
  width: 55px;
}

/* Mantener el diseño de tus tarjetas */
.inventory-item {
  --background: #1a1a1a;
  --border-radius: 14px;
  margin-bottom: 8px;
  --padding-start: 10px;
}
</style>