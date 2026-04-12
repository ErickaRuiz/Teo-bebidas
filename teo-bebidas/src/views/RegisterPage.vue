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
          <h2 class="welcome-text">Crear Cuenta</h2>
          <p class="instruction-text">Únete para gestionar tus bebidas</p>

          <ion-item lines="none" class="custom-input">
            <ion-icon :icon="personOutline" slot="start"></ion-icon>
            <ion-input v-model="newUser" type="text" placeholder="Nombre de usuario"></ion-input>
          </ion-item>

          <ion-item lines="none" class="custom-input ion-margin-top">
            <ion-icon :icon="mailOutline" slot="start"></ion-icon>
            <ion-input v-model="email" type="email" placeholder="Correo electrónico"></ion-input>
          </ion-item>

          <ion-item lines="none" class="custom-input ion-margin-top">
            <ion-icon :icon="lockClosedOutline" slot="start"></ion-icon>
            <ion-input v-model="newPass" type="password" placeholder="Contraseña"></ion-input>
          </ion-item>

          <ion-button expand="block" shape="round" class="btn-login" @click="registrar">
            Registrarse
          </ion-button>

          <p class="forgot-pass" @click="irAlLogin">
            ¿Ya tienes cuenta? <b>Inicia sesión</b>
          </p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent, IonItem, IonInput, IonButton, IonIcon } from '@ionic/vue';
import { personOutline, lockClosedOutline, mailOutline } from 'ionicons/icons';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
// Importamos la conexión que configuraste
import { supabase } from '../supabase';

const router = useRouter();
const newUser = ref('');
const email = ref('');
const newPass = ref('');

// Esta es la función que DEBES usar en el @click de tu botón
const registrar = async () => {
  // Validación básica para no enviar datos vacíos
  if (!newUser.value || !email.value || !newPass.value) {
    alert("Por favor, completa todos los campos");
    return;
  }

  const { data, error } = await supabase
    .from('usuarios') // Asegúrate de que tu tabla en Supabase se llame así
    .insert([
      { 
        username: newUser.value, 
        email: email.value, 
        password: newPass.value 
      }
    ]);

  if (error) {
    alert("Error al registrar: " + error.message);
  } else {
    alert("¡Usuario creado con éxito!");
    router.push('/login'); // Te manda al login para que entres
  }
};

const irAlLogin = () => {
  router.push('/login');
};
</script>
<style scoped>
ion-content {
  --background: #f4f5f8 !important;
}

.header-blue {
  background: #002e5d !important;
  height: 40vh; /* Ajustado para que quepa bien el formulario de registro */
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom-left-radius: 60px;
  border-bottom-right-radius: 60px;
}

.clean-logo {
  max-width: 200px;
  height: auto;
  mix-blend-mode: screen; 
  filter: contrast(1.1) brightness(1.1);
}

.login-container {
  padding: 0 30px;
  margin-top: -80px;
}

.login-card {
  background: white !important;
  border-radius: 30px;
  padding: 30px 25px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.15);
  text-align: center;
}

.welcome-text {
  color: #333 !important;
  font-weight: 800;
  font-size: 1.6rem;
}

.instruction-text {
  color: #777 !important;
  font-size: 0.9rem;
  margin-bottom: 25px;
}

.custom-input {
  --background: #f0f2f5 !important;
  --border-radius: 12px;
  --color: #333 !important;
  margin-bottom: 10px;
}

.custom-input ion-icon {
  color: #002e5d;
}

.btn-login {
  --background: #002e5d !important;
  --color: white !important;
  --border-radius: 12px;
  margin-top: 20px;
  height: 55px;
  font-weight: bold;
}

.forgot-pass {
  color: #002e5d;
  font-size: 0.9rem;
  margin-top: 20px;
  cursor: pointer;
}
</style>