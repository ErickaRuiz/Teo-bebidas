import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginPage.vue') // Cambiado @ por .. para evitar fallos de ruta
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/HomePage.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterPage.vue')
  },
  {
    path: '/ingreso',
    name: 'IngresoProductos',
    component: () => import('../views/IngresoProductos.vue')
  },
  {
    path: '/salida',
    name: 'Salida',
    component: () => import('../views/SalidaPage.vue')
  },
  {
    path: '/cuentas-cobrar',
    name: 'CuentasCobrar',
    component: () => import('../views/CuentasCobrar.vue')
  },
  {
    path: '/agregar-cliente',
    name: 'AgregarCliente',
    component: () => import('../views/AgregarCliente.vue')
  },
  {
  path: '/ventas-hoy',
  name: 'VentasHoy',
  // Asegúrate de que aquí diga exactamente el nombre de tu archivo
  component: () => import('../views/VentasHoy.vue') 
},
{
  path: '/stock',
  name: 'Stock',
  // Si tu archivo de Stock también está en mayúsculas, cámbialo aquí:
  component: () => import('../views/stock.vue') 
},
{
    path: '/reporte-ventas',
    name: 'reporte',
    component: () => import('../views/reporteVentas.vue') // El archivo que acabas de crear
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router