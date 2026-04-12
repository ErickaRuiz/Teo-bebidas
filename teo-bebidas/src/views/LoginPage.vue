<template>
  <ion-page>
    <ion-content class="ion-no-padding">
      <div class="header-blue">
        <div class="logo-wrapper">
          <img src="/public/teobebidas.png" alt="Teo Bebidas Logo" class="clean-logo">
        </div>
      </div>

      <div class="login-container">
        <div class="login-card">
          <h2 class="welcome-text">¡Bienvenido!</h2>
          <p class="instruction-text">Inicia sesión para gestionar tu inventario</p>

          <ion-item lines="none" class="custom-input">
            <ion-icon :icon="personOutline" slot="start"></ion-icon>
            <ion-input v-model="user" type="text" placeholder="Usuario"></ion-input>
          </ion-item>

          <ion-item lines="none" class="custom-input ion-margin-top">
            <ion-icon :icon="lockClosedOutline" slot="start"></ion-icon>
            <ion-input v-model="pass" type="password" placeholder="Contraseña"></ion-input>
          </ion-item>

          <ion-button expand="block" shape="round" class="btn-login" @click="entrar">
            Entrar
          </ion-button>

          <div v-if="mensajeError" class="error-container">
            <p class="error-msg">{{ mensajeError }}</p>
            <p class="no-account-text">¿Aún no tienes una cuenta?</p>
            <ion-button fill="clear" size="small" class="btn-register" @click="irARegistro">
              Regístrate ahora
            </ion-button>
          </div>

          <p class="forgot-pass">¿Olvidaste tu contraseña?</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent, IonItem, IonInput, IonButton, IonIcon } from '@ionic/vue';
import { personOutline, lockClosedOutline } from 'ionicons/icons';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

// ESTA ES LA LÍNEA QUE TE FALTA (Importante para conectar con tu base de datos)
import { supabase } from '../supabase'; 

const router = useRouter();
const user = ref('');
const pass = ref('');
const mensajeError = ref('');

const entrar = async () => {
  // Ahora el código sí reconocerá "supabase"
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('username', user.value)
    .eq('password', pass.value)
    .single();

  if (data) {
    mensajeError.value = '';
    router.push('/home');
  } else {
    mensajeError.value = 'Usuario o contraseña incorrectos.';
  }
};

const irARegistro = () => {
  router.push('/register');
};
</script>

<style scoped>
ion-content {
  --background: #f4f5f8 !important;
}

.header-blue {
  background: #002e5d !important;
  height: 45vh;
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom-left-radius: 60px;
  border-bottom-right-radius: 60px;
}

.logo-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}

.clean-logo {
  max-width: 250px;
  height: auto;
  mix-blend-mode: screen; 
  filter: contrast(1.1) brightness(1.1);
}

.login-container {
  padding: 0 30px;
  margin-top: -100px;
}

.login-card {
  background: white !important;
  border-radius: 30px;
  padding: 35px 25px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.15);
  text-align: center;
}

.welcome-text {
  color: #333 !important;
  font-weight: 800;
  font-size: 1.6rem;
  margin-bottom: 5px;
}

.instruction-text {
  color: #777 !important;
  font-size: 0.95rem;
  margin-bottom: 30px;
}

.custom-input {
  --background: #f0f2f5 !important;
  --border-radius: 12px;
  --color: #333 !important;
  margin-bottom: 12px;
}

.custom-input ion-icon {
  color: #002e5d;
  font-size: 22px;
}

.btn-login {
  --background: #002e5d !important;
  --color: white !important;
  --border-radius: 12px;
  margin-top: 25px;
  height: 55px;
  font-weight: bold;
}

/* ESTILOS DEL REGISTRO CUANDO HAY ERROR */
.error-container {
  margin-top: 20px;
  background: #fff5f5;
  padding: 10px;
  border-radius: 15px;
  border: 1px solid #fed7d7;
}

.error-msg {
  color: #d9534f;
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
}

.no-account-text {
  color: #555;
  font-size: 0.85rem;
  margin-top: 8px;
  margin-bottom: 0;
}

.btn-register {
  --color: #002e5d;
  font-weight: bold;
  text-transform: none;
  font-size: 0.9rem;
}

.forgot-pass {
  color: #002e5d;
  font-size: 0.85rem;
  margin-top: 20px;
  opacity: 0.7;
}
</style>