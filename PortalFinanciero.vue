<template>
  <div :class="isDarkMode ? 'dark' : ''">
    <div class="min-h-screen dark:bg-slate-950 bg-slate-50 dark:text-slate-200 text-slate-800 p-4 md:p-8 font-sans transition-colors duration-300">
      <div class="max-w-6xl mx-auto space-y-10">
      
      <!-- Header -->
      <header class="text-center space-y-4 relative">
        <button @click="isDarkMode = !isDarkMode" class="absolute right-0 top-0 p-3 rounded-full dark:bg-slate-800 bg-white shadow-md border dark:border-white/5 border-slate-200 hover:scale-110 transition-transform">
          {{ isDarkMode ? '☀️' : '🌙' }}
        </button>
        <h1 class="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
          Portal Financiero Argento
        </h1>
        <p class="text-lg md:text-xl dark:text-slate-400 text-slate-600 font-medium">
          Rendimientos, timba y la cruda realidad de tus ahorros.
        </p>
      </header>

      <!-- El Delorean Financiero -->
      <section class="dark:bg-slate-900/80 bg-white border dark:border-white/10 border-slate-200 rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden dark:text-white text-slate-900 transition-all duration-300">
        <div class="absolute top-0 right-0 -mt-10 -mr-10 opacity-10 text-9xl pointer-events-none">🚗⚡</div>
        
        <!-- Cabecera colapsable -->
        <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 cursor-pointer select-none" @click="showCalculator = !showCalculator">
          <h2 class="text-2xl md:text-3xl font-bold flex items-center gap-2 md:gap-3 leading-tight">
            <span>⏱️</span> El Delorean Financiero
          </h2>
          <button class="dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:bg-slate-800 bg-slate-100 border dark:border-white/5 border-slate-300 px-4 py-2 rounded-xl transition text-sm font-bold w-full sm:w-fit" @click.stop="showCalculator = !showCalculator">
            {{ showCalculator ? 'Ocultar Calculadora ⬆️' : 'Abrir Calculadora ⬇️' }}
          </button>
        </div>

        <div v-show="showCalculator" class="relative z-10 animate-fade-in">
          <p class="dark:text-slate-400 text-slate-600 mb-8 max-w-2xl">
            ¿Qué hubiera pasado si no te la patinabas? Ingresá un monto, elegí en qué momento del pasado te bajaste de la máquina del tiempo, y mirá cómo te hubiera ido hoy.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <!-- Monto -->
            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500">Monto Inicial</label>
              <div class="flex">
                <select v-model="currency" @change="handleCurrencyChange" class="dark:bg-slate-950 bg-slate-50 border dark:border-slate-700 border-slate-300 dark:text-white text-slate-900 rounded-l-xl px-2 sm:px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 w-24 sm:w-auto font-bold">
                  <option value="USD">U$D</option>
                  <option value="ARS">AR$</option>
                </select>
                <input type="number" v-model.number="amount" class="w-full dark:bg-slate-950 bg-slate-50 border border-l-0 dark:border-slate-700 border-slate-300 dark:text-white text-slate-900 rounded-r-xl px-3 sm:px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" placeholder="1000" />
              </div>
            </div>

            <!-- Años -->
            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500">¿Hace cuánto?</label>
              <select v-model="selectedPeriod" @change="calculateTravel" class="dark:bg-slate-950 bg-slate-50 border dark:border-slate-700 border-slate-300 dark:text-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
                <option value="1w">Hace 1 semana</option>
                <option value="1m">Hace 1 mes</option>
                <option value="3m">Hace 3 meses</option>
                <option value="6m">Hace 6 meses</option>
                <option value="1y">Hace 1 año (Fiebre pre-electoral)</option>
                <option value="3y">Hace 3 años (Plena post-pandemia)</option>
                <option value="5y">Hace 5 años (Pre-pandemia 2019)</option>
              </select>
            </div>

            <!-- Botón -->
            <div class="flex items-end">
              <button @click="calculateTravel" class="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-slate-900 font-black text-lg py-[11px] px-6 rounded-xl transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:shadow-[0_0_30px_rgba(251,191,36,0.7)]">
                Viajar al Presente ⚡
              </button>
            </div>
          </div>

          <!-- Resultados del Delorean -->
          <div v-if="results.length > 0" class="mt-10 dark:bg-slate-950/50 bg-slate-50 rounded-2xl p-6 border dark:border-slate-800 border-slate-200 backdrop-blur-sm animate-fade-in">
            <h3 class="text-lg md:text-xl font-bold mb-6 text-center text-yellow-400 leading-relaxed">
              {{ funnyPhrase }}
              <div v-if="equivalencyText" class="block mt-3 text-sm md:text-base font-bold dark:text-slate-300 text-slate-700 bg-white/5 rounded-lg py-2">
                {{ equivalencyText }}
              </div>
            </h3>
            
            <div class="space-y-4">
              <div v-for="(result, index) in results" :key="result.id" 
                   class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl transition-all duration-300"
                   :class="[index === 0 ? 'bg-gradient-to-r dark:from-emerald-900/30 dark:to-green-900/10 from-emerald-100 to-green-50 border border-emerald-500/50 p-6 shadow-[0_0_30px_rgba(16,185,129,0.15)] transform scale-[1.02]' : result.id === 'efectivo' ? 'dark:bg-red-950/20 bg-red-50 border border-red-500/30 p-4 opacity-90' : 'dark:bg-slate-800/40 bg-white border dark:border-white/5 border-slate-200 shadow-sm p-4']">
                <div class="flex items-center gap-4">
                  <span :class="index === 0 ? 'text-4xl md:text-5xl' : 'text-3xl'">{{ result.emoji }}</span>
                  <div>
                    <h4 class="font-bold text-base md:text-lg" :class="index === 0 ? 'dark:text-emerald-300 text-emerald-700' : result.id === 'efectivo' ? 'dark:text-red-300 text-red-700' : 'dark:text-white text-slate-800'">{{ result.name }}</h4>
                    <span class="text-xs sm:text-sm font-bold tracking-wide" :class="result.returnPercent >= 0 ? 'dark:text-emerald-400 text-emerald-600' : 'dark:text-red-400 text-red-600'">RENDIMIENTO: {{ result.returnPercent >= 0 ? '+' : '' }}{{ result.returnPercent }}%</span>
                  </div>
                </div>
                <div class="flex flex-row sm:flex-col items-center sm:items-end justify-between border-t dark:border-slate-700/50 border-slate-200 sm:border-0 pt-3 sm:pt-0 w-full sm:w-auto">
                  <div class="flex flex-col items-start sm:items-end">
                    <div class="text-[10px] sm:text-xs dark:text-slate-400 text-slate-500 uppercase font-bold tracking-wider mb-0 sm:mb-1">Total Acumulado</div>
                    <p class="font-black mb-0 sm:mb-1 drop-shadow-md" :class="index === 0 ? 'text-3xl sm:text-4xl dark:text-emerald-400 text-emerald-600' : 'text-xl sm:text-2xl dark:text-white text-slate-800'">
                      {{ formatMoney(result.finalAmount) }}
                    </p>
                  </div>
                  <div class="text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg mt-0 sm:mt-2 shadow-inner" :class="result.profit >= 0 ? 'dark:bg-emerald-500/20 bg-emerald-100 dark:text-emerald-400 text-emerald-700 border border-emerald-500/30' : 'dark:bg-red-500/20 bg-red-100 dark:text-red-400 text-red-700 border border-red-500/30'">
                    {{ result.profit >= 0 ? 'Ganancia:' : 'Pérdida:' }} {{ formatMoney(Math.abs(result.profit)) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Explorador de Mercados (Categorías Dinámicas) -->
      <section>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 class="text-3xl font-bold dark:text-white text-slate-800 flex items-center gap-3">
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Explorar Mercados en Vivo
          </h2>
          <div class="flex items-center gap-2">
            <label class="text-sm font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500">Variación:</label>
            <select v-model="marketPeriod" class="dark:bg-slate-900 bg-white border dark:border-slate-700 border-slate-300 dark:text-white text-slate-900 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm">
              <option value="1w">1 Semana</option>
              <option value="1m">1 Mes</option>
              <option value="3m">3 Meses</option>
              <option value="6m">6 Meses</option>
              <option value="1y">1 Año</option>
              <option value="3y">3 Años</option>
              <option value="5y">5 Años</option>
            </select>
          </div>
        </div>
        
        <div v-if="livePrices.length === 0" class="dark:text-slate-400 text-slate-500 italic font-medium mb-6">⏳ Cargando cotizaciones en vivo...</div>
        
        <!-- Grid de Categorías -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="(assets, categoryName) in groupedAssets" :key="categoryName" 
               @click="selectedCategory = categoryName"
               class="cursor-pointer dark:bg-slate-900 bg-white border dark:border-white/5 border-slate-200 rounded-[2rem] p-8 dark:text-white text-slate-800 shadow-xl transform transition hover:-translate-y-2 hover:shadow-2xl flex flex-col justify-between group"
               :class="`hover:border-opacity-50 dark:hover:${categoryMeta[categoryName]?.borderHighlight} hover:border-slate-400`">
            <div>
              <div class="text-5xl mb-4 group-hover:scale-110 transition-transform origin-left">{{ categoryMeta[categoryName]?.emoji || '📊' }}</div>
              <h3 class="text-2xl font-bold mb-2">{{ categoryName }}</h3>
              <p class="font-medium mb-6 opacity-90">{{ categoryMeta[categoryName]?.desc || 'Ver activos de esta categoría' }}</p>
            </div>
            <div class="flex items-center justify-between text-sm font-bold dark:bg-black/30 bg-slate-100 rounded-xl p-3 mt-auto border dark:border-white/5 border-slate-200">
              <span>{{ assets.length }} activos listados</span>
              <span>Ver detalle ➔</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Modal de Detalle de Categoría -->
      <Transition name="modal-fade">
      <div v-if="selectedCategory" class="fixed inset-0 z-50 flex items-center justify-center p-4 dark:bg-black/80 bg-slate-900/60 backdrop-blur-md" @click.self="selectedCategory = null">
        <div class="dark:bg-slate-900 bg-white border dark:border-slate-700 border-slate-200 rounded-[2rem] w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          <!-- Header Modal -->
          <div class="p-6 md:p-8 dark:text-white text-slate-900 flex justify-between items-center border-b dark:border-white/10 border-slate-200" :class="`bg-gradient-to-r ${categoryMeta[selectedCategory]?.gradient || 'dark:from-slate-800 dark:to-slate-900 from-slate-100 to-white'}`">
            <div class="flex items-center gap-4">
              <span class="text-4xl">{{ categoryMeta[selectedCategory]?.emoji }}</span>
              <h2 class="text-3xl font-bold">{{ selectedCategory }}</h2>
            </div>
            <button @click="selectedCategory = null" class="dark:text-white/80 text-slate-500 dark:hover:text-white hover:text-slate-900 dark:bg-black/30 bg-black/5 dark:hover:bg-black/50 hover:bg-black/10 rounded-full w-10 h-10 flex items-center justify-center transition text-xl font-bold shadow-inner">
              ✕
            </button>
          </div>
          
          <!-- Panel Resumen de Real Estate -->
          <div v-if="selectedCategory === 'Real Estate'" class="dark:bg-slate-950 bg-slate-50 p-4 md:p-6 border-b dark:border-slate-800 border-slate-200 flex justify-around dark:text-white text-slate-800">
            <div class="text-center">
              <div class="text-xs md:text-sm font-bold dark:text-slate-400 text-slate-500 uppercase">M2 Promedio (Top 4)</div>
              <div class="text-2xl md:text-3xl font-black dark:text-emerald-400 text-emerald-600">US$ {{ m2AveragePrice.toLocaleString('es-AR') }}</div>
            </div>
            <div class="text-center">
              <div class="text-xs md:text-sm font-bold dark:text-slate-400 text-slate-500 uppercase">Alquiler Promedio</div>
              <div class="text-2xl md:text-3xl font-black dark:text-amber-400 text-amber-600">{{ rentYield }}% <span class="text-sm dark:text-slate-500 text-slate-400 font-bold">anual</span></div>
            </div>
          </div>

          <!-- Lista de Activos dentro de la categoría -->
          <div class="p-6 md:p-8 overflow-y-auto dark:bg-slate-950/50 bg-slate-100/50">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div v-for="activo in groupedAssets[selectedCategory]" :key="activo.id" 
                   class="dark:bg-slate-900 bg-white p-5 rounded-2xl border dark:border-slate-800 border-slate-200 shadow-sm dark:hover:border-slate-600 hover:border-slate-400 transition flex items-center gap-4 group">
                <div class="text-4xl dark:bg-slate-950 bg-slate-50 p-3 rounded-xl border dark:border-white/5 border-slate-200 group-hover:scale-110 transition-transform">{{ activo.emoji }}</div>
                <div class="flex-1 min-w-0">
                  <div class="text-[10px] dark:text-slate-500 text-slate-400 font-bold tracking-widest uppercase">{{ activo.simbolo }}</div>
                  <div class="font-bold dark:text-white text-slate-800 leading-tight mb-1 truncate" :title="activo.nombre">{{ activo.nombre }}</div>
                  <div class="text-xl font-black" :class="activo.categoria === 'Moneda' ? 'dark:text-amber-400 text-amber-600' : 'dark:text-emerald-400 text-emerald-600'">{{ formatAssetPrice(activo) }}</div>
                  <div :class="activo.variaciones[marketPeriod] >= 0 ? 'dark:text-emerald-500 text-emerald-600' : 'dark:text-red-500 text-red-600'" class="text-sm font-bold mt-1">{{ activo.variaciones[marketPeriod] >= 0 ? '▲' : '▼' }} {{ Math.abs(activo.variaciones[marketPeriod]) }}% <span class="dark:text-slate-500 text-slate-400 font-normal text-xs">({{ marketPeriodLabels[marketPeriod] }})</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </Transition>

    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

const isDarkMode = ref(true);
const showCalculator = ref(true);
const amount = ref(1000);
const currency = ref('USD');
const lastCurrency = ref('USD');
const selectedPeriod = ref('1y');
const results = ref([]);
const funnyPhrase = ref('');
const equivalencyText = ref('');
const periodLabels = { '1w': 'semanal', '1m': 'mensual', '3m': 'trimestral', '6m': 'semestral', '1y': 'Fiebre electoral', '3y': 'Post-pandemia', '5y': 'Pre-pandemia' };
const marketPeriod = ref('1m');
const marketPeriodLabels = { '1w': '1 Semana', '1m': '1 Mes', '3m': '3 Meses', '6m': '6 Meses', '1y': '1 Año', '3y': '3 Años', '5y': '5 Años' };

const handleCurrencyChange = () => {
  // Buscamos el Dólar Oficial de los precios en vivo (si ya cargaron)
  const oficial = livePrices.value.find(a => a.simbolo === 'DOLAR_OFICIAL');
  const rate = oficial ? Number(oficial.precio) : 1000;
  
  // Convertimos el valor actual al cambiar de moneda usando el tipo de cambio oficial
  if (currency.value === 'ARS' && lastCurrency.value === 'USD') {
    amount.value = Math.round(amount.value * rate);
  } else if (currency.value === 'USD' && lastCurrency.value === 'ARS') {
    amount.value = Math.round(amount.value / rate);
  }
  lastCurrency.value = currency.value;
  
  if (results.value.length > 0) calculateTravel();
};

const calculateTravel = () => {
  if (livePrices.value.length === 0) {
    alert('⏳ Aún estamos cargando los datos reales desde la base de datos. Intentá en unos segundos.');
    return;
  }

  const avgM2Symbols = ['M2_NUN', 'M2_BEL', 'M2_PAL', 'M2_REC'];
  const getVariation = (simbolo) => Number(livePrices.value.find(a => a.simbolo === simbolo)?.variaciones[selectedPeriod.value] || 0);
  const getAvgVariation = (categoria) => {
    const items = livePrices.value.filter(a => a.categoria === categoria);
    return items.length ? items.reduce((acc, a) => acc + Number(a.variaciones[selectedPeriod.value]), 0) / items.length : 0;
  };

  // Lógica Cuantitativa Real: Impacto de Moneda e Inflación
  const varMEP = getVariation('DOLAR_MEP');
  
  // Extraemos los años base elegidos por el usuario (o fracción)
  const selectedNum = parseInt(selectedPeriod.value[0]);
  const yearsNum = selectedPeriod.value.endsWith('y') ? selectedNum : (selectedPeriod.value.endsWith('m') ? selectedNum / 12 : 7 / 365);
  
  // Inflación US ~3% anual. (Un activo dólar quieto pierde 3% por año frente al índice de precios yanqui)
  const inflacionUS = -3 * yearsNum;
  
  // Proxies para el Peso: Asumimos que la inflación real es aprox la devaluación del MEP más un desfasaje (ej 15%).
  const inflacionAR_acumulada = ((1 + varMEP / 100) * 1.15) - 1; 
  const poderCompraPesos = ((1 / (1 + inflacionAR_acumulada)) - 1) * 100;

  const dynamicAssets = [
    { id: 'merval', name: 'Merval (Promedio)', emoji: '🎢', varUSD: getAvgVariation('Merval') },
    { id: 'sp500', name: 'S&P 500 (SPY)', emoji: '📈', varUSD: getVariation('SPY') },
    { id: 'big6', name: 'Big 6 (Tecnológicas)', emoji: '🦅', varUSD: getAvgVariation('Wall Street') },
    { id: 'mep', name: 'Dólar MEP / Efectivo', emoji: '💵', varUSD: inflacionUS }, // El MEP en base USD solo sufre la inflación de USA
    { id: 'realestate', name: 'Real Estate (Acciones)', emoji: '🏢', varUSD: getAvgVariation('Real Estate') },
    { id: 'efectivo', name: 'Efectivo bajo el colchón (Pesos)', emoji: '💸', varUSD: ((1 / (1 + varMEP / 100)) - 1) * 100 } 
  ];

  const calculated = dynamicAssets.map(asset => {
    let returnPercent = 0;

    // Cálculos cruzados según la moneda base elegida para visualizar
    if (currency.value === 'USD') {
      returnPercent = asset.varUSD;
    } else { // ARS
      if (asset.id === 'mep') returnPercent = varMEP;
      else if (asset.id === 'efectivo') returnPercent = poderCompraPesos; // Depreciación catastrófica
      else returnPercent = (((1 + asset.varUSD / 100) * (1 + varMEP / 100)) - 1) * 100;
    }

    // Forzamos el porcentaje a un máximo de 2 decimales limpios
    returnPercent = Number(returnPercent.toFixed(2));

    const finalAmount = amount.value * (1 + returnPercent / 100);
    const profit = finalAmount - amount.value;
    return { ...asset, returnPercent, finalAmount, profit };
  });
  
  // Ordenamos de mayor a menor ganancia final
  results.value = calculated.sort((a, b) => b.finalAmount - a.finalAmount);

  // Asignamos una frase picante dependiendo del ganador
  const winner = results.value[0].id;
  if (winner === 'merval') funnyPhrase.value = '¡Mervalazo pa! 🚀 Sos el lobo de Wall Street versión San Martín.';
  else if (winner === 'mep') funnyPhrase.value = 'El colchón manda. 💵 Lloran los plazos fijos. Refugio de valor y paz mental.';
  else if (winner === 'sp500') funnyPhrase.value = 'A lo Warren Buffett. 👴 Tranquilidad mental, la tuya está trabajando sola.';
  else if (winner === 'big6') funnyPhrase.value = '¡El futuro es hoy, oíste viejo! 🤖 Las tecnológicas imprimen billetes.';
  else funnyPhrase.value = 'El ladrillo nunca te abandona. 🏢 Lento pero seguro, como buen conservador.';

  // Costo de Oportunidad a Bienes Reales
  const bestProfit = results.value[0].profit;
  equivalencyText.value = '';
  
  if (bestProfit > 0) {
    if (currency.value === 'ARS') {
      const asados = Math.floor(bestProfit / 45000);
      const alquileres = Math.floor(bestProfit / 350000);
      if (alquileres >= 1) equivalencyText.value = `💡 Costo de Oportunidad: Te hubieras pagado ${alquileres} meses de alquiler en CABA.`;
      else if (asados >= 1) equivalencyText.value = `💡 Costo de Oportunidad: Te perdiste de invitar ${asados} asados a todo trapo para 10 personas. 🥩`;
      else equivalencyText.value = `💡 Costo de Oportunidad: Equivalente a comprar ${(bestProfit / 2500).toFixed(0)} alfajores. 🍫`;
    } else {
      const iphones = Math.floor(bestProfit / 1200);
      const brasil = Math.floor(bestProfit / 800);
      if (iphones >= 1) equivalencyText.value = `💡 Costo de Oportunidad: Esa ganancia equivale a ${iphones} iPhones 15 Pro Max nuevitos. 📱`;
      else if (brasil >= 1) equivalencyText.value = `💡 Costo de Oportunidad: Podrías haberte ido ${brasil} veces a Brasil todo pago. 🏖️`;
      else equivalencyText.value = `💡 Costo de Oportunidad: Son como ${(bestProfit / 5).toFixed(0)} cafés grandes en Starbucks. ☕`;
    }
  } else {
    equivalencyText.value = '💀 El mercado te pasó por encima o la inflación de USA hizo lo suyo. Acá no hay asado ni iPhone para vos.';
  }
  
};

const formatMoney = (value) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency.value, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
};

const formatAssetPrice = (activo) => {
  const val = Number(activo.precio);
  if (activo.simbolo === 'ALQ_YIELD') return `${val.toFixed(2)}%`;
  if (activo.categoria === 'Moneda') return `AR$ ${val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (activo.simbolo.startsWith('M2_')) return `US$ ${val.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
  return `US$ ${val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Integración con la API Express (Base de Datos)
const livePrices = ref([]);
const selectedCategory = ref(null);

const categoryMeta = {
  'Merval': { emoji: '🇦🇷', gradient: 'dark:from-indigo-900/50 dark:to-purple-900/50 from-indigo-100 to-purple-100', borderHighlight: 'border-indigo-500/50', desc: 'Acciones locales y ADRs.' },
  'Wall Street': { emoji: '🦅', gradient: 'dark:from-blue-900/50 dark:to-cyan-900/50 from-blue-100 to-cyan-100', borderHighlight: 'border-blue-500/50', desc: 'Las gigantes tecnológicas globales.' },
  'Moneda': { emoji: '💵', gradient: 'dark:from-emerald-900/50 dark:to-green-900/50 from-emerald-100 to-green-100', borderHighlight: 'border-emerald-500/50', desc: 'Cotizaciones del dólar en el país.' },
  'Índice/ETF': { emoji: '📈', gradient: 'dark:from-amber-900/50 dark:to-orange-900/50 from-amber-100 to-orange-100', borderHighlight: 'border-amber-500/50', desc: 'Rendimiento del mercado.' },
  'Bonos': { emoji: '📜', gradient: 'dark:from-red-900/50 dark:to-pink-900/50 from-red-100 to-pink-100', borderHighlight: 'border-red-500/50', desc: 'Deuda e instrumentos de renta fija.' },
  'Real Estate': { emoji: '🏢', gradient: 'dark:from-orange-900/50 dark:to-red-900/50 from-orange-100 to-red-100', borderHighlight: 'border-orange-500/50', desc: 'Inmobiliarias, M2 y construcción.' }
};

const groupedAssets = computed(() => {
  const groups = {};
  livePrices.value.forEach(asset => {
    if (!groups[asset.categoria]) groups[asset.categoria] = [];
    groups[asset.categoria].push(asset);
  });
  return groups;
});

const m2AveragePrice = computed(() => {
  const symbols = ['M2_NUN', 'M2_BEL', 'M2_PAL', 'M2_REC'];
  const items = livePrices.value.filter(a => symbols.includes(a.simbolo));
  if (!items.length) return 0;
  const avg = items.reduce((acc, a) => acc + Number(a.precio), 0) / items.length;
  return Math.round(avg);
});

const rentYield = computed(() => {
  const item = livePrices.value.find(a => a.simbolo === 'ALQ_YIELD');
  return item ? Number(item.precio).toFixed(2) : 0;
});

const fetchLivePrices = async () => {
  try {
    // En producción (GitHub Pages) lee el JSON ultrarrápido; en tu PC usa tu server.js local
    const apiUrl = import.meta.env.PROD ? './precios.json' : 'http://localhost:4000/api/precios';
    const response = await fetch(apiUrl);
    livePrices.value = await response.json();
  } catch (error) {
    console.error('Error al conectar con la API:', error);
  }
};

onMounted(fetchLivePrices);
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>