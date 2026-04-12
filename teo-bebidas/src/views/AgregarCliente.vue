<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="main-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" text="ATRÁS"></ion-back-button>
        </ion-buttons>
        <ion-title>NUEVO CLIENTE</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding content-dark">
      <div class="form-card">
        <div class="header-section">
          <div class="icon-circle">
            <ion-icon :icon="personAddOutline"></ion-icon>
          </div>
          <h2 class="form-title">DATOS</h2>
          <div class="divider-dashed"></div>
        </div>
        
        <div class="form-body">
          <div class="input-group">
            <label class="custom-label">Nombre / Razón Social</label>
            <div class="input-container">
              <ion-icon :icon="businessOutline" class="field-icon"></ion-icon>
              <ion-input v-model="cliente.nombre" placeholder="Ej. Juan Pérez" class="custom-input"></ion-input>
            </div>
          </div>

        

          <div class="input-group">
           <label class="custom-label">Número de Celular</label>
           <div class="input-container">
           <ion-icon :icon="callOutline" class="field-icon"></ion-icon>
          <ion-input 
  v-model="cliente.telefono" 
  type="tel" 
  placeholder="900 000 000" 
  class="custom-input"
  :maxlength="11" 
  @ionInput="formatearTelefono($event)"
></ion-input>
  </div>
</div>

          <div class="input-group">
            <label class="custom-label">Dirección (Opcional)</label>
            <div class="input-container">
              <ion-icon :icon="locationOutline" class="field-icon"></ion-icon>
              <ion-input v-model="cliente.direccion" placeholder="Calle, Manzana o Lote" class="custom-input"></ion-input>
            </div>
          </div>
        </div>

        <div class="divider-dashed"></div>

        <div class="action-section">
          <ion-button expand="block" class="btn-save-modern" @click="registrarCliente">
            GUARDAR CLIENTE
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonInput, IonButton, IonButtons, 
  IonBackButton, IonIcon 
} from '@ionic/vue';
import { 
  personAddOutline, businessOutline, cardOutline, 
  callOutline, locationOutline 
} from 'ionicons/icons';
import { ref } from 'vue';
import { supabase } from '../supabase';
import { useRouter } from 'vue-router';

const router = useRouter();
const cliente = ref({
  nombre: '',
  telefono: '',
  direccion: '',
  deuda: 0
});



const registrarCliente = async () => {
  if (!cliente.value.nombre.trim()) {
    alert("El nombre es obligatorio");
    return;
  }

  // LIMPIEZA CRÍTICA: Quitamos todos los espacios para comparar puramente los números
  const celularLimpio = cliente.value.telefono.replace(/\s+/g, '').trim();

  try {
    if (celularLimpio !== '') {
      // Buscamos en la base de datos quitando espacios también allá
      const { data: existeCelular, error: errBusqueda } = await supabase
        .from('clientes')
        .select('nombre, telefono')
        .or(`telefono.eq.${cliente.value.telefono}, telefono.eq.${celularLimpio}`) // Busca con y sin espacios
        .maybeSingle();

      if (existeCelular) {
        alert(`¡BLOQUEADO! El número ${cliente.value.telefono} ya pertenece a: ${existeCelular.nombre}`);
        return; 
      }
    }

    // Si llegó aquí, el número es nuevo
    const { error } = await supabase.from('clientes').insert([
      { 
        nombre: cliente.value.nombre,
        telefono: cliente.value.telefono.trim(), // Lo guarda con el formato 900 000 000
        direccion: cliente.value.direccion,
        deuda_total: 0 
      }
    ]);

    if (error) throw error;

    alert("¡Cliente guardado con éxito!");
    router.back();

  } catch (err: any) {
    alert("Error al validar: " + err.message);
  }
};

const formatearTelefono = (event: any) => {
  // 1. Solo deja números
  let valor = event.target.value.replace(/\D/g, '');
  
  // 2. Corta a máximo 9 dígitos antes de poner espacios
  if (valor.length > 9) {
    valor = valor.substring(0, 9);
  }

  // 3. Pone los espacios de 3 en 3
  let formateado = valor;
  if (valor.length > 3 && valor.length <= 6) {
    formateado = valor.replace(/(\d{3})(\d+)/, '$1 $2');
  } else if (valor.length > 6) {
    formateado = valor.replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3');
  }

  // 4. Actualiza el modelo y la vista
  cliente.value.telefono = formateado;
};
</script>

<style scoped>
/* Estilo Base Dark */
.content-dark { --background: #0d0d0d !important; }
.main-toolbar { --background: #002e5d; --color: white; }

/* Tarjeta del Formulario similar a la Boleta */
.form-card {
  background: white;
  border-radius: 8px;
  padding: 25px 20px;
  margin-top: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

.header-section { text-align: center; margin-bottom: 20px; }

.icon-circle {
  background: #f0f4f8;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px;
  color: #002e5d;
  font-size: 2rem;
}

.form-title {
  color: #002e5d;
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: 1px;
  margin: 0 0 15px;
}

.divider-dashed { border-top: 2px dashed #ddd; margin: 15px 0; }

/* Estilo de los campos de entrada */
.input-group { margin-bottom: 18px; }

.custom-label {
  color: #666;
  font-size: 0.7rem;
  font-weight: 800;
  display: block;
  margin-bottom: 6px;
  margin-left: 5px;
  text-transform: uppercase;
}

.input-container {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 5px 15px;
  transition: all 0.3s ease;
}

.input-container:focus-within {
  border-color: #002e5d;
  background: white;
  box-shadow: 0 4px 12px rgba(0,46,93,0.1);
}

.field-icon { color: #8ba3ba; font-size: 1.2rem; margin-right: 10px; }

.custom-input {
  --padding-start: 0;
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

/* Botón de Guardar Premium */
.btn-save-modern {
  --background: #002e5d;
  --border-radius: 12px;
  --color: white;
  font-weight: bold;
  height: 56px;
  margin: 0;
  font-size: 1rem;
  box-shadow: 0 4px 15px rgba(0,46,93,0.3);
}
</style>