<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="main-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Cuentas por Cobrar</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="search-container">
        <ion-item class="custom-select-item">
          <ion-label position="stacked">Seleccionar Cliente para Reporte</ion-label>
          <ion-select v-model="clienteSeleccionado" placeholder="Elija un cliente" @ionChange="generarReporteDesdeSelector">
            <ion-select-option v-for="nombre in nombresUnicos" :key="nombre" :value="nombre">
              {{ nombre }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        
        <ion-button fill="clear" @click="generarReporteDesdeSelector">
          <img src="/pdf.png" alt="PDF" class="pdf-icon" />
        </ion-button>
      </div>

      <ion-searchbar v-model="filtro" placeholder="Filtrar lista de pagos..." class="custom-search"></ion-searchbar>

      <div class="list-container">
        <h2 class="section-title">Pendientes de Pago</h2>
        <ion-list lines="none" class="transparent-list">
          <ion-item v-for="c in clientesFiltrados" :key="c.id" class="debt-item">
  <ion-label>
    <h2 class="client-name">{{ c.cliente }}</h2>
    <p class="debt-date">Fecha: {{ new Date(c.fecha).toLocaleDateString('es-PE') }}</p>
  </ion-label>
  <div slot="end" class="debt-info">
    <span class="amount">S/ {{ c.total.toFixed(2) }}</span>
    
    <ion-button fill="clear" @click="descargarPDFIndividual(c)">
      <img src="/pdf.png" style="width: 25px; height: 25px;" />
    </ion-button>
    
    <ion-button fill="clear" @click="marcarComoPagado(c)">
      <ion-icon :icon="checkmarkCircleOutline" class="big-check"></ion-icon>
    </ion-button>
  </div>
</ion-item>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonSelect, IonSelectOption,
  IonItem, IonLabel, IonButton, IonIcon, IonSearchbar, IonButtons, IonBackButton 
} from '@ionic/vue';
import { checkmarkCircleOutline, happyOutline } from 'ionicons/icons';
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../supabase'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const filtro = ref('');
const clienteSeleccionado = ref('');
const clientesConDeuda = ref<any[]>([]);

// Lógica para el Selector: Filtra nombres únicos para no repetir a Ericka Ruiz
const nombresUnicos = computed(() => {
  const nombres = clientesConDeuda.value.map(c => c.cliente);
  return [...new Set(nombres)].sort();
});

const cargarDeudas = async () => {
  const { data, error } = await supabase.from('ventas').select('*').eq('estado', 'credito').order('fecha', { ascending: false });
  if (!error) clientesConDeuda.value = data || [];
};

onMounted(cargarDeudas);

const clientesFiltrados = computed(() => {
  return clientesConDeuda.value.filter(c => c.cliente.toLowerCase().includes(filtro.value.toLowerCase()));
});

// CuentasCobrar.vue
const cobrarDeuda = async (ventaId: number) => {
  const { error } = await supabase
    .from('ventas')
    .update({ 
      estado: 'cancelado',
      fecha_pago: new Date().toISOString() // INDISPENSABLE para que sume hoy
    })
    .eq('id', ventaId);
};
// Función para el nuevo selector
const generarReporteDesdeSelector = async () => {
  if (!clienteSeleccionado.value) return;

  const { data: ventas } = await supabase
    .from('ventas')
    .select('*')
    .eq('cliente', clienteSeleccionado.value)
    .eq('estado', 'credito');

  if (!ventas || ventas.length === 0) return;

  const doc = new jsPDF();
  
  // Encabezado Azul
  doc.setFillColor(0, 46, 93);
  doc.rect(0, 0, 210, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('ESTADO DE CUENTA TOTAL', 105, 15, { align: 'center' });

  // Información del Cliente
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text(`CLIENTE: ${clienteSeleccionado.value.toUpperCase()}`, 14, 35);

  // Procesamos las filas incluyendo la Fecha y limpiando la Cantidad
  const todasLasFilas = ventas.flatMap(v => {
    const fechaCompra = new Date(v.fecha).toLocaleDateString('es-PE');
    
    if (!v.productos || typeof v.productos !== 'object') {
      return [[fechaCompra, '1', 'Bebidas/Varios', '---', `S/ ${v.total.toFixed(2)}`]];
    }

    return Object.values(v.productos).map((p: any) => {
      const cant = p.cantidad || 1;
      const nombre = p.nombre || p.descripcion || 'Producto';
      const precioUni = p.precio || (p.total / cant) || 0;
      const subtotal = p.total || (cant * precioUni);

      return [
        fechaCompra, // Nueva columna de fecha
        cant.toString(), // Cantidad sin la "x"
        nombre, 
        `S/ ${precioUni.toFixed(2)}`, 
        `S/ ${subtotal.toFixed(2)}`
      ];
    });
  });

autoTable(doc, {
    startY: 40,
    head: [['FECHA', 'CANT', 'PRODUCTO', 'P. UNIT', 'SUBTOTAL']],
    body: todasLasFilas,
    headStyles: { 
      fillColor: [0, 46, 93], 
      halign: 'center',
      fontSize: 10,
      minCellHeight: 10 // Da más espacio al encabezado para evitar saltos
    },
    columnStyles: { 
      0: { halign: 'center', cellWidth: 30 }, // Fecha centrada
      1: { halign: 'center', cellWidth: 20 }, // CANT con más ancho para que no baje la 'T'
      2: { halign: 'center', cellWidth: 'auto' }, // PRODUCTO ahora centrado
      3: { halign: 'center', cellWidth: 30 }, // P. UNIT centrado
      4: { halign: 'right', cellWidth: 30 }   // SUBTOTAL a la derecha
    },
    styles: { 
      fontSize: 9, 
      cellPadding: 4,
      valign: 'middle' // Centra el contenido verticalmente
    },
    margin: { left: 15, right: 15 },
    theme: 'striped'
  });

  // Total Final
  const totalGeneral = ventas.reduce((acc, v) => acc + v.total, 0);
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setTextColor(255, 73, 97); // Rojo para el total
  doc.text(`TOTAL DEUDA PENDIENTE: S/ ${totalGeneral.toFixed(2)}`, 196, finalY, { align: 'right' });

  doc.save(`Estado_Cuenta_${clienteSeleccionado.value}.pdf`);
};
// Se mantiene la función de impresión con diseño azul
const imprimirReporteDirecto = (nombre: string) => {
  const deudas = clientesConDeuda.value.filter(c => c.cliente === nombre);
  if (deudas.length === 0) return;

  const doc = new jsPDF();
  doc.setFillColor(0, 46, 93); 
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('ESTADO DE CUENTA - TEO BEBIDAS', 105, 22, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text(`CLIENTE: ${nombre.toUpperCase()}`, 14, 45);
  doc.text(`FECHA DE EMISIÓN: ${new Date().toLocaleDateString('es-PE')}`, 14, 52);

  const filas = deudas.map(d => [
    new Date(d.fecha).toLocaleDateString('es-PE'),
    `S/ ${d.total.toFixed(2)}`,
    'PENDIENTE'
  ]);

  (doc as any).autoTable({
    startY: 60,
    head: [['FECHA DE COMPRA', 'MONTO ADEUDADO', 'ESTADO']],
    body: filas,
    headStyles: { fillStyle: [0, 46, 93] },
  });

  const total = deudas.reduce((acc, d) => acc + d.total, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL ACUMULADO A PAGAR: S/ ${total.toFixed(2)}`, 14, (doc as any).lastAutoTable.finalY + 15);

  doc.save(`Reporte_Deudas_${nombre}.pdf`);
};

const marcarComoPagado = async (venta: any) => {
  if (window.confirm(`¿Confirmar pago de S/ ${venta.total.toFixed(2)}?`)) {
    const { error } = await supabase
      .from('ventas')
      .update({ 
        estado: 'cancelado',
        // CRÍTICO: Registra el momento exacto del cobro para el Panel Principal
        fecha_pago: new Date().toISOString() 
      })
      .eq('id', venta.id);

    if (!error) { 
      alert("Pago registrado correctamente"); 
      cargarDeudas(); 
    } else {
      console.error("Error al actualizar pago:", error);
    }
  }
};

const descargarPDFIndividual = (deuda: any) => {
  const doc = new jsPDF();
  
  // Encabezado Azul
  doc.setFillColor(0, 46, 93);
  doc.rect(0, 0, 210, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('COMPROBANTE DE VENTA', 105, 15, { align: 'center' });

  // Datos de cabecera
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.text(`CLIENTE: ${deuda.cliente.toUpperCase()}`, 14, 35);

  // Procesar filas (Fecha, Cantidad sin x, Producto, P. Unit, Subtotal)
  const filas = obtenerFilasParaReporte(deuda);

  autoTable(doc, {
    startY: 40,
    head: [['FECHA', 'CANT', 'PRODUCTO', 'P. UNIT', 'SUBTOTAL']],
    body: filas,
    headStyles: { 
      fillColor: [0, 46, 93], 
      halign: 'center',
      minCellHeight: 10 
    },
    // Ajustes para centrar y evitar que "CANT" se rompa
    columnStyles: { 
      0: { halign: 'center', cellWidth: 30 }, // Fecha centrada
      1: { halign: 'center', cellWidth: 20 }, // CANT con espacio suficiente
      2: { halign: 'center', cellWidth: 'auto' }, // PRODUCTO centrado
      3: { halign: 'center', cellWidth: 30 }, // P. UNIT centrado
      4: { halign: 'right', cellWidth: 30 }   // SUBTOTAL a la derecha
    },
    styles: { 
      fontSize: 9, 
      cellPadding: 4,
      valign: 'middle' 
    },
    margin: { left: 15, right: 15 },
    theme: 'striped'
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`TOTAL A PAGAR: S/ ${deuda.total.toFixed(2)}`, 196, finalY, { align: 'right' });

  doc.save(`Ticket_${deuda.cliente.trim()}.pdf`);
};

const obtenerFilasParaReporte = (venta: any) => {
  const fecha = new Date(venta.fecha).toLocaleDateString('es-PE');
  
  if (!venta.productos || typeof venta.productos !== 'object') {
    return [[fecha, '1', 'Bebidas/Varios', '---', `S/ ${venta.total.toFixed(2)}`]];
  }

  return Object.values(venta.productos).map((p: any) => {
    const cant = p.cantidad || 1;
    const nombre = p.nombre || p.descripcion || 'Producto';
    const precioUni = p.precio || (p.total / cant) || 0;
    const subtotal = p.total || (cant * precioUni);

    return [
      fecha, 
      cant.toString(), // Cantidad limpia sin "x"
      nombre, 
      `S/ ${precioUni.toFixed(2)}`, 
      `S/ ${subtotal.toFixed(2)}`
    ];
  });
};
const obtenerDetalleLegible = (productos: any) => {
  if (!productos) return 'Bebidas/Varios';
  
  // Si el campo productos es un objeto o array
  if (typeof productos === 'object') {
    return Object.values(productos)
      .map((p: any) => {
        const cantidad = p.cantidad || 1;
        const nombre = p.nombre || p.descripcion || 'Producto';
        return `${cantidad}x ${nombre}`; // Formato: 2x Sporade 1.5 L
      })
      .join(', ');
  }
  return productos;
};

const obtenerFilasDetalladas = (productos: any) => {
  if (!productos || typeof productos !== 'object') {
    return [['1', 'Bebidas/Varios', '---', '---']];
  }

  // Convertimos el objeto de productos en filas para la tabla
  return Object.values(productos).map((p: any) => {
    const cant = p.cantidad || 1;
    const nombre = p.nombre || p.descripcion || 'Producto';
    const precioUni = p.precio || (p.total / cant) || 0;
    const subtotal = p.total || (cant * precioUni);

    return [
      `${cant}x`, 
      nombre, 
      `S/ ${precioUni.toFixed(2)}`, 
      `S/ ${subtotal.toFixed(2)}`
    ];
  });
};
</script>

<style scoped>
ion-content { --background: #0b0b0b !important; }
.main-toolbar { --background: #002e5d; --color: white; }
/* Estilo para el contenedor del selector */
.search-container { display: flex; align-items: flex-end; gap: 8px; margin-bottom: 15px; background: #1a1a1a; padding: 10px; border-radius: 12px; }
.custom-select-item { --background: transparent; color: white; flex: 1; }
.custom-search { --background: #1a1a1a; --color: white; margin-bottom: 10px; }
.pdf-icon { width: 38px; height: 38px; }
.debt-item { --background: #1a1a1a; --border-radius: 12px; margin-bottom: 8px; }
.client-name { color: white; font-weight: bold; }
.amount { color: #ff4961; font-weight: bold; font-size: 1.1rem; margin-right: 10px; }
.big-check { font-size: 2rem; color: #2dd36f; }
</style>