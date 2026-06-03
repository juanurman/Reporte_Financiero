<template>
  <div :class="isDarkMode ? 'dark' : ''">
    <div class="min-h-screen dark:bg-slate-950 bg-slate-50 dark:text-slate-200 text-slate-800 p-4 md:p-8 font-sans transition-colors duration-300">
      <div class="max-w-6xl mx-auto space-y-10">
      
      <!-- Header -->
      <header class="text-center space-y-4 relative">
        <button @click="isDarkMode = !isDarkMode" class="absolute right-0 top-0 p-3 rounded-full dark:bg-slate-800 bg-white shadow-md border dark:border-white/5 border-slate-200 hover:scale-110 transition-transform">
          {{ isDarkMode ? '☀️' : '🌙' }}
        </button>
        <h1 class="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 pb-2 leading-tight">
          Portal Financiero Argento
        </h1>
        <p class="text-lg md:text-xl dark:text-slate-400 text-slate-600 font-medium">
          Rendimientos, timba y la cruda realidad de tus ahorros.
        </p>
        <div class="inline-flex items-center justify-center gap-2 bg-slate-200/50 dark:bg-slate-800/50 px-4 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 shadow-sm mt-2">
          <span class="relative flex h-2.5 w-2.5">
            <span v-if="livePrices.length > 0" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5" :class="livePrices.length > 0 ? 'bg-emerald-500' : 'bg-amber-500'"></span>
          </span>
          <span class="text-xs md:text-sm font-bold dark:text-slate-500 text-slate-600">
            Actualizado al: <span class="dark:text-slate-300 text-slate-800">{{ lastUpdatedDate }}</span>
          </span>
        </div>
      </header>

      <!-- Navegación de Pestañas -->
      <div class="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 bg-slate-200 dark:bg-slate-800/50 p-1.5 rounded-2xl w-fit mx-auto backdrop-blur-sm border border-slate-300 dark:border-slate-700">
        <button @click="currentTab = 'mercados'" :class="currentTab === 'mercados' ? 'bg-white dark:bg-slate-700 shadow-md text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'" class="px-6 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2">
          📈 Mercados
        </button>
        <button @click="currentTab = 'calculadora'" :class="currentTab === 'calculadora' ? 'bg-white dark:bg-slate-700 shadow-md text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'" class="px-6 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2">
          ⏱️ Calculadora
        </button>
        <button @click="currentTab = 'cartera'" :class="currentTab === 'cartera' ? 'bg-white dark:bg-slate-700 shadow-md text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'" class="px-6 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2">
          💼 Mi Cartera
        </button>
        <button v-if="isAdmin" @click="currentTab = 'add_ticker'" :class="currentTab === 'add_ticker' ? 'bg-white dark:bg-slate-700 shadow-md text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'" class="px-6 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2">
          ➕ Base de Datos
        </button>
      </div>

      <!-- PESTAÑA: MERCADOS -->
      <div v-if="currentTab === 'mercados'" class="space-y-10 animate-fade-in">

      <!-- Explorador de Mercados (Categorías Dinámicas) -->
      <section class="animate-fade-in relative z-10">
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
              <option value="ytd">YTD (Desde enero)</option>
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
              <div class="flex justify-between items-start mb-4">
                <div class="text-5xl group-hover:scale-110 transition-transform origin-left">{{ categoryMeta[categoryName]?.emoji || '📊' }}</div>
                <div v-if="categoryPerformance[categoryName] !== undefined" 
                     class="text-lg font-black px-3 py-1 rounded-xl shadow-inner"
                     :class="Number(categoryPerformance[categoryName]) >= 0 ? 'dark:bg-emerald-500/20 bg-emerald-100 dark:text-emerald-400 text-emerald-700' : 'dark:bg-red-500/20 bg-red-100 dark:text-red-400 text-red-700'">
                  {{ Number(categoryPerformance[categoryName]) >= 0 ? '▲' : '▼' }} {{ Math.abs(Number(categoryPerformance[categoryName])).toFixed(2) }}%
                </div>
              </div>
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
      
      </div> <!-- Fin Pestaña Mercados -->

      <!-- PESTAÑA: CALCULADORA -->
      <div v-if="currentTab === 'calculadora'" class="space-y-10 animate-fade-in">
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
                <option value="ytd">YTD (Desde enero)</option>
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

      </div> <!-- Fin Pestaña Calculadora -->

      <!-- PESTAÑA: PORTAFOLIO -->
      <div v-if="currentTab === 'cartera'" class="space-y-10 animate-fade-in">
        <!-- Pantalla de Bloqueo -->
        <div v-if="!isPortfolioUnlocked" class="flex flex-col items-center justify-center py-10 md:py-20 animate-fade-in relative z-10">
          <div class="dark:bg-slate-900 bg-white p-8 rounded-[2rem] shadow-2xl border dark:border-slate-800 border-slate-200 max-w-md w-full text-center relative overflow-hidden">
            <div class="absolute top-0 right-0 -mt-8 -mr-8 opacity-5 text-8xl pointer-events-none">🔒</div>
            <div class="text-6xl mb-6 relative z-10">🤫</div>
            <h2 class="text-2xl font-bold dark:text-white text-slate-800 mb-2 relative z-10">Área Privada</h2>
            <p class="dark:text-slate-400 text-slate-500 mb-8 relative z-10">Ingresá tu usuario y contraseña.</p>
            <form @submit.prevent="unlockPortfolio" class="flex flex-col gap-4 relative z-10">
              <input type="text" v-model="loginUser" required placeholder="Usuario" class="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-700 border-slate-300 dark:text-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-center font-bold" />
              <input type="password" v-model="portfolioPassword" required placeholder="Contraseña" class="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-700 border-slate-300 dark:text-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-center font-bold tracking-widest" />
              <p v-if="portfolioError" class="text-red-500 text-sm font-bold animate-pulse">{{ portfolioError }}</p>
              <button type="submit" class="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-lg py-3 rounded-xl transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                Desbloquear
              </button>
            </form>
          </div>
        </div>

        <!-- Mi Cartera (Dashboard de Inversión) -->
        <section v-else class="animate-fade-in relative z-10">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 class="text-3xl font-bold dark:text-white text-slate-800 flex items-center gap-3">
              💼 Mi Cartera <span class="text-sm dark:bg-slate-800 bg-slate-200 px-3 py-1 rounded-full dark:text-slate-300 text-slate-600 font-semibold tracking-widest uppercase">Tech & AI</span>
            </h2>
            <div class="flex items-center gap-2 bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm">
              <span class="text-sm font-bold dark:text-slate-400 text-slate-600 pl-2">👤 Perfil: <span class="text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{{ currentUser }}</span></span>
              <button @click="logoutPortfolio" class="bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg font-bold text-xs transition ml-2">Cerrar Sesión</button>
            </div>
          </div>
          
          <!-- KPI Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <!-- Tarjeta 1: Valor Consolidado -->
            <div class="dark:bg-slate-800/50 bg-white backdrop-blur border dark:border-slate-700 border-slate-200 rounded-2xl p-6 shadow-xl flex flex-col justify-center transform transition-transform hover:-translate-y-1">
              <div class="text-sm font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-2">Valor Consolidado</div>
              <div class="font-mono font-black text-3xl md:text-4xl dark:text-white text-slate-900 tracking-tight">
                {{ formatUSD(portfolioTotalValue) }}
              </div>
            </div>
            
            <!-- Tarjeta 2: P&L Histórico -->
            <div class="dark:bg-slate-800/50 bg-white backdrop-blur border dark:border-slate-700 border-slate-200 rounded-2xl p-6 shadow-xl flex flex-col justify-center transform transition-transform hover:-translate-y-1">
              <div class="text-sm font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-2">P&L Histórico</div>
              <div class="font-black text-2xl md:text-3xl flex items-center gap-2" :class="portfolioTotalPL >= 0 ? 'text-emerald-400' : 'text-red-400'">
                <span>{{ portfolioTotalPL >= 0 ? '▲' : '▼' }} {{ formatUSD(Math.abs(portfolioTotalPL)) }}</span>
                <span class="text-lg opacity-80 font-bold bg-current/10 px-2 py-1 rounded-lg">
                  {{ portfolioTotalPLPercent >= 0 ? '+' : '' }}{{ portfolioTotalPLPercent.toFixed(2) }}%
                </span>
              </div>
            </div>
            
            <!-- Tarjeta 3: Asignación de Activos -->
            <div class="dark:bg-slate-800/50 bg-white backdrop-blur border dark:border-slate-700 border-slate-200 rounded-2xl p-6 shadow-xl flex flex-col justify-center transform transition-transform hover:-translate-y-1">
              <div class="text-sm font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-2">Asignación de Activos</div>
              <div class="flex items-center gap-3">
                <div class="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden flex">
                  <div class="bg-indigo-500 w-[55%]" title="Semiconductores"></div>
                  <div class="bg-cyan-400 w-[45%]" title="Software & AI"></div>
                </div>
              </div>
              <div class="mt-3 flex justify-between text-[11px] font-bold dark:text-slate-300 text-slate-600 uppercase tracking-wider">
                <span>🧠 Hardware (55%)</span>
                <span>💻 Software AI (45%)</span>
              </div>
            </div>
          </div>

          <!-- Gráfico de Evolución Temporal -->
          <div class="dark:bg-slate-800/50 bg-white backdrop-blur border dark:border-slate-700 border-slate-200 rounded-2xl p-6 shadow-xl mb-6 h-72 relative">
             <canvas id="portfolioChart" ref="portfolioChartRef"></canvas>
          </div>

          <!-- Tabla de Tenencias -->
          <div class="dark:bg-slate-800/50 bg-white backdrop-blur border dark:border-slate-700 border-slate-200 rounded-2xl overflow-hidden shadow-xl overflow-x-auto mb-16">
            <table class="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr class="dark:bg-slate-800/80 bg-slate-100 border-b dark:border-slate-700 border-slate-200 text-xs uppercase tracking-wider dark:text-slate-400 text-slate-500 font-bold">
                  <th class="px-6 py-4">Activo</th>
                  <th class="px-6 py-4 text-right">Cantidad</th>
                  <th class="px-6 py-4 text-right">PPC</th>
                  <th class="px-6 py-4 text-right">Precio Actual</th>
                  <th class="px-6 py-4 text-right">Ganancia / Pérdida</th>
                </tr>
              </thead>
              <tbody class="divide-y dark:divide-slate-700/50 divide-slate-200">
                <tr v-for="asset in enrichedPortfolio" :key="asset.symbol" class="dark:hover:bg-slate-800/40 hover:bg-slate-50 transition-colors group cursor-pointer">
                  <td class="px-6 py-4 flex items-center gap-3">
                    <span class="text-2xl group-hover:scale-110 transition-transform">{{ asset.emoji }}</span>
                    <div>
                      <div class="font-bold dark:text-white text-slate-900">{{ asset.symbol }}</div>
                      <div class="text-xs dark:text-slate-400 text-slate-500 font-medium">{{ asset.name }}</div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-right font-medium dark:text-slate-300 text-slate-700">{{ asset.quantity }}</td>
                  <td class="px-6 py-4 text-right font-medium dark:text-slate-300 text-slate-700">{{ formatUSD(asset.avgPrice) }}</td>
                  <td class="px-6 py-4 text-right font-black dark:text-white text-slate-900">{{ formatUSD(asset.currentPrice) }}</td>
                  <td class="px-6 py-4 text-right">
                    <div class="font-black" :class="asset.profitLoss >= 0 ? 'text-emerald-500' : 'text-red-500'">
                       {{ asset.profitLoss >= 0 ? '+' : '-' }}{{ formatUSD(Math.abs(asset.profitLoss)) }}
                    </div>
                    <div class="text-[11px] font-bold mt-0.5 tracking-wider" :class="asset.profitLoss >= 0 ? 'text-emerald-400/80' : 'text-red-400/80'">
                       {{ asset.profitLoss >= 0 ? '▲' : '▼' }} {{ Math.abs(asset.profitLossPercent).toFixed(2) }}%
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div> <!-- Fin Pestaña Portafolio -->

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
              <div class="text-xs md:text-sm font-bold mt-1" :class="m2AverageVariation >= 0 ? 'dark:text-emerald-400 text-emerald-600' : 'dark:text-red-400 text-red-600'">
                {{ marketPeriodLabels[marketPeriod] }}: US$ {{ m2HistoricAveragePrice.toLocaleString('es-AR') }} 
                ({{ m2AverageVariation >= 0 ? '▲' : '▼' }} {{ Math.abs(m2AverageVariation) }}%)
              </div>
            </div>
            <div class="text-center">
              <div class="text-xs md:text-sm font-bold dark:text-slate-400 text-slate-500 uppercase">Alquiler Promedio</div>
              <div class="text-2xl md:text-3xl font-black dark:text-amber-400 text-amber-600">{{ rentYield }}% <span class="text-sm dark:text-slate-500 text-slate-400 font-bold">anual</span></div>
              <div class="text-xs md:text-sm font-bold mt-1" :class="rentYieldVariation >= 0 ? 'dark:text-emerald-400 text-emerald-600' : 'dark:text-red-400 text-red-600'">
                {{ marketPeriodLabels[marketPeriod] }}: {{ rentYieldHistoric }}% 
                ({{ rentYieldVariation >= 0 ? '▲' : '▼' }} {{ Math.abs(rentYieldVariation) }}%)
              </div>
            </div>
          </div>

          <!-- Lista de Activos dentro de la categoría -->
          <div class="p-6 md:p-8 overflow-y-auto custom-scrollbar dark:bg-slate-950/50 bg-slate-100/50">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div v-for="activo in groupedAssets[selectedCategory]" :key="activo.id" 
                   class="dark:bg-slate-900 bg-white p-5 rounded-2xl border shadow-sm transition flex flex-col justify-between group relative"
                   :class="isAdmin ? 'animate-jiggle dark:border-red-500/50 border-red-500/50 bg-red-50/10 dark:bg-red-900/10' : 'dark:border-slate-800 border-slate-200 dark:hover:border-slate-600 hover:border-slate-400'">
                
                <!-- Efecto iPhone "X" para Desinstalar (Solo Admin) -->
                <button v-if="isAdmin" @click.stop="deleteAsset(activo.simbolo)" class="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg z-20 hover:bg-red-600 hover:scale-110 transition-transform">✕</button>

                <div class="flex items-center gap-4 mb-4">
                  <div class="text-4xl dark:bg-slate-950 bg-slate-50 p-3 rounded-xl border dark:border-white/5 border-slate-200 group-hover:scale-110 transition-transform">{{ activo.emoji }}</div>
                  <div class="flex-1 min-w-0">
                    <div class="text-[10px] dark:text-slate-500 text-slate-400 font-bold tracking-widest uppercase">{{ activo.simbolo }}</div>
                    <div class="font-bold dark:text-white text-slate-800 leading-tight truncate" :title="activo.nombre">{{ activo.nombre }}</div>
                  </div>
                </div>
                <div class="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 relative">
                  <div class="flex justify-between items-end mb-2">
                     <span class="text-xs font-bold text-slate-500 dark:text-slate-400">Actual:</span>
                     <span class="text-lg font-black" :class="activo.categoria === 'Moneda' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'">{{ formatAssetPrice(activo) }}</span>
                  </div>
                  <div class="flex justify-between items-end mb-3">
                     <span class="text-xs font-bold text-slate-500 dark:text-slate-400">{{ marketPeriodLabels[marketPeriod] }}:</span>
                     <span class="text-sm font-bold text-slate-600 dark:text-slate-300">{{ getPastPriceFormatted(activo) }}</span>
                  </div>
                  <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                     <span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Rendimiento Real</span>
                     <div :class="getDynamicRendimiento(activo) >= 0 ? 'dark:text-emerald-500 text-emerald-600' : 'dark:text-red-500 text-red-600'" class="text-sm font-black bg-white dark:bg-slate-900 px-2 py-1 rounded-md shadow-sm border border-slate-100 dark:border-slate-700">
                       {{ getDynamicRendimiento(activo) >= 0 ? '▲' : '▼' }} {{ Math.abs(getDynamicRendimiento(activo)) }}%
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </Transition>

      <!-- PESTAÑA: BASE DE DATOS (Solo Admin) -->
      <div v-if="currentTab === 'add_ticker' && isAdmin" class="space-y-10 animate-fade-in relative z-10 py-8">
        <section class="dark:bg-slate-900 bg-white p-8 rounded-[2rem] shadow-2xl border dark:border-slate-800 border-slate-200 max-w-2xl mx-auto">
            <h2 class="text-3xl font-bold dark:text-white text-slate-800 flex items-center gap-3">
              ⚙️ Agregar Activo
            </h2>
          <p class="dark:text-slate-400 text-slate-500 mb-8">
            Añadí un nuevo Ticker a la base de datos de TiDB.
          </p>
          
          <form @submit.prevent="submitAdminForm" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-bold dark:text-slate-400 text-slate-500 mb-1">Símbolo (Ticker)</label>
                <input v-model="adminForm.simbolo" required placeholder="Ej: TSLA" class="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-700 border-slate-300 dark:text-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-bold" />
              </div>
              <div>
                <label class="block text-sm font-bold dark:text-slate-400 text-slate-500 mb-1">Nombre</label>
                <input v-model="adminForm.nombre" required placeholder="Ej: Tesla Inc." class="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-700 border-slate-300 dark:text-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
              </div>
              <div>
                <label class="block text-sm font-bold dark:text-slate-400 text-slate-500 mb-1">Categoría</label>
                <select v-model="adminForm.categoria" required class="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-700 border-slate-300 dark:text-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-bold appearance-none cursor-pointer">
                  <option value="Wall Street">🗽 Wall Street (Acciones de EE.UU.)</option>
                  <option value="Big Tech">🦅 Big Tech (Gigantes Tecnológicas)</option>
                  <option value="Cripto">₿ Cripto (Criptomonedas)</option>
                  <option value="Bonos">📜 Bonos (Deuda y Renta Fija)</option>
                  <option value="Merval">🇦🇷 Merval (Acciones Locales)</option>
                  <option value="Índice/ETF">📈 Índice/ETF (Fondos de Mercado)</option>
                  <option value="Real Estate">🏢 Real Estate (Bienes Raíces)</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-bold dark:text-slate-400 text-slate-500 mb-1">Emoji</label>
                <select v-model="adminForm.emoji" required class="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-700 border-slate-300 dark:text-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg appearance-none cursor-pointer">
                  <optgroup label="Finanzas y Cripto">
                    <option value="📈">📈 Gráfico Subiendo</option>
                    <option value="📉">📉 Gráfico Bajando</option>
                    <option value="💵">💵 Dólar / Dinero</option>
                    <option value="💸">💸 Efectivo / Dinero Volando</option>
                    <option value="🏦">🏦 Banco / Finanzas</option>
                    <option value="₿">₿ Bitcoin</option>
                    <option value="🪙">🪙 Cripto / Moneda</option>
                    <option value="💎">💎 Hold / Diamante</option>
                    <option value="🚀">🚀 To the moon</option>
                    <option value="📜">📜 Bono / Contrato</option>
                  </optgroup>
                  <optgroup label="Sectores y Empresas">
                    <option value="🍎">🍎 Apple</option>
                    <option value="🔍">🔍 Google</option>
                    <option value="💻">💻 Microsoft / Software</option>
                    <option value="📦">📦 Amazon / Envíos</option>
                    <option value="🌐">🌐 Meta / Redes</option>
                    <option value="🎮">🎮 Nvidia / Gaming</option>
                    <option value="📱">📱 Telecomunicaciones</option>
                    <option value="🚗">🚗 Tesla / Autos</option>
                    <option value="✈️">✈️ Turismo / Aviones</option>
                    <option value="🏭">🏭 Industria / TSM</option>
                    <option value="💾">💾 Micron / Hardware</option>
                    <option value="⚡">⚡ Energía</option>
                    <option value="🛢️">🛢️ Petróleo</option>
                    <option value="🌾">🌾 Agricultura</option>
                    <option value="🏢">🏢 Real Estate</option>
                    <option value="💊">💊 Salud / Farma</option>
                    <option value="🛒">🛒 Consumo / Supermercado</option>
                    <option value="🍔">🍔 Comida Rápida</option>
                    <option value="🥤">🥤 Bebidas</option>
                    <option value="🎬">🎬 Entretenimiento / Cine</option>
                  </optgroup>
                  <optgroup label="Países / Regiones">
                    <option value="🇦🇷">🇦🇷 Argentina</option>
                    <option value="🇺🇸">🇺🇸 EE.UU.</option>
                    <option value="🦅">🦅 Águila (Wall Street)</option>
                    <option value="🇨🇳">🇨🇳 China</option>
                    <option value="🇪🇺">🇪🇺 Europa</option>
                    <option value="🇧🇷">🇧🇷 Brasil</option>
                    <option value="🌎">🌎 Global</option>
                  </optgroup>
                </select>
              </div>
            </div>
            <button type="submit" :disabled="isSubmittingAdmin" class="w-full mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 text-white font-black text-lg py-3 rounded-xl transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              {{ isSubmittingAdmin ? 'Guardando...' : 'Guardar en Base de Datos' }}
            </button>
            <p v-if="adminError" class="text-red-500 font-bold text-center mt-4 bg-red-500/10 p-2 rounded-lg">{{ adminError }}</p>
            <p v-if="adminMessage" class="text-emerald-500 font-bold text-center mt-4 bg-emerald-500/10 p-2 rounded-lg">{{ adminMessage }}</p>
          </form>
        </section>
      </div>

      <!-- Footer sutil para acceder al Panel Admin -->
      <footer class="mt-20 pt-8 pb-4 text-center opacity-30 hover:opacity-100 transition-opacity duration-300 relative z-10">
        <button v-if="!isAdmin" @click="showAdminLoginModal = true" class="text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 mx-auto dark:text-slate-400 text-slate-500 hover:text-indigo-500 transition-colors">
          ⚙️ Acceso Administrador
        </button>
        <button v-else @click="logoutAdmin" class="text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 mx-auto text-red-500 hover:text-red-600 transition-colors">
          🔴 Cerrar Sesión Admin
        </button>
      </footer>

      <!-- Modal Global de Login Administrador -->
      <Transition name="modal-fade">
        <div v-if="showAdminLoginModal && !isAdmin" class="fixed inset-0 z-50 flex items-center justify-center p-4 dark:bg-black/80 bg-slate-900/60 backdrop-blur-md" @click.self="showAdminLoginModal = false">
          <div class="dark:bg-slate-900 bg-white p-8 rounded-[2rem] shadow-2xl border dark:border-slate-800 border-slate-200 max-w-md w-full mx-auto text-center relative">
            <button @click="showAdminLoginModal = false" class="absolute top-4 right-4 dark:text-white/80 text-slate-500 dark:hover:text-white hover:text-slate-900 bg-slate-100 dark:bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center transition font-bold">✕</button>
            <div class="text-6xl mb-6">🔐</div>
            <h2 class="text-3xl font-bold dark:text-white text-slate-800 mb-2">Modo Dios</h2>
            <p class="dark:text-slate-400 text-slate-500 mb-8">Gestión de la base de datos de TiDB.</p>
            <form @submit.prevent="loginAdmin" class="flex flex-col gap-4">
              <input type="text" v-model="adminLoginUser" required placeholder="Usuario" class="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-700 border-slate-300 dark:text-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-center font-bold" />
              <input type="password" v-model="adminLoginPass" required placeholder="Contraseña" class="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-700 border-slate-300 dark:text-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-center font-bold tracking-widest" />
              <p v-if="adminLoginError" class="text-red-500 text-sm font-bold animate-pulse">{{ adminLoginError }}</p>
              <button type="submit" class="w-full bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-600 hover:to-slate-800 text-white font-black text-lg py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg">
                Ingresar
              </button>
            </form>
          </div>
        </div>
      </Transition>

    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';

const isDarkMode = ref(true);
const currentTab = ref('mercados');
const showCalculator = ref(true);
const amount = ref(1000);
const currency = ref('USD');
const lastCurrency = ref('USD');
const selectedPeriod = ref('1y');
const results = ref([]);
const funnyPhrase = ref('');
const showAdminLoginModal = ref(false);
const equivalencyText = ref('');
const periodLabels = { '1w': 'semanal', '1m': 'mensual', '3m': 'trimestral', '6m': 'semestral', 'ytd': 'Desde enero', '1y': 'Fiebre electoral', '3y': 'Post-pandemia', '5y': 'Pre-pandemia' };
const marketPeriod = ref('1y');
const marketPeriodLabels = { '1w': '1 Semana', '1m': '1 Mes', '3m': '3 Meses', '6m': '6 Meses', 'ytd': 'YTD', '1y': '1 Año', '3y': '3 Años', '5y': '5 Años' };

watch(selectedPeriod, (newVal) => {
  if (marketPeriod.value !== newVal) marketPeriod.value = newVal;
});

watch(marketPeriod, (newVal) => {
  if (selectedPeriod.value !== newVal) {
    selectedPeriod.value = newVal;
    if (results.value.length > 0) calculateTravel();
  }
});

watch(currentTab, async (newTab) => {
  if (newTab === 'cartera' && isPortfolioUnlocked.value) {
    await nextTick();
    renderChart();
  }
});

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
  let yearsNum = 0;
  if (selectedPeriod.value === 'ytd') {
    const now = new Date();
    yearsNum = (now - new Date(now.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24 * 365);
  } else {
    const selectedNum = parseInt(selectedPeriod.value[0]);
    yearsNum = selectedPeriod.value.endsWith('y') ? selectedNum : (selectedPeriod.value.endsWith('m') ? selectedNum / 12 : 7 / 365);
  }
  
  // Inflación US ~3% anual. (Un activo dólar quieto pierde 3% por año frente al índice de precios yanqui)
  const inflacionUS = -3 * yearsNum;
  
  // Proxies para el Peso: Asumimos que la inflación real es aprox la devaluación del MEP más un desfasaje (ej 15%).
  const inflacionAR_acumulada = ((1 + varMEP / 100) * 1.15) - 1; 
  const poderCompraPesos = ((1 / (1 + inflacionAR_acumulada)) - 1) * 100;

  const dynamicAssets = [
    { id: 'merval', name: 'Merval (Promedio)', emoji: '🎢', varUSD: getAvgVariation('Merval') },
    { id: 'sp500', name: 'S&P 500 (SPY)', emoji: '📈', varUSD: getVariation('SPY') },
    { id: 'big6', name: 'Big 6 (Tecnológicas)', emoji: '🦅', varUSD: getAvgVariation('Big Tech') },
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

const formatUSD = (value) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const formatAssetPrice = (activo) => {
  const val = Number(activo.precio);
  if (activo.simbolo === 'ALQ_YIELD') return `${val.toFixed(2)}%`;
  if (activo.categoria === 'Moneda' || activo.simbolo.endsWith('.BA') || activo.nombre.includes('AR$')) return `AR$ ${val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (activo.simbolo.startsWith('M2_')) return `US$ ${val.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
  return `US$ ${val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// --- CONFIGURACIÓN DE API ---
// Si estamos en producción, apunta a Vercel. Si no, a localhost.
// Asegúrate de que esta URL sea la "Production Deployment" de tu dashboard de Vercel
const API_BASE_URL = import.meta.env.PROD ? 'https://reporte-financiero-juanurman-6276s-projects.vercel.app' : 'http://localhost:5000';

// Integración con la API Express (Base de Datos)
const livePrices = ref([]);
const selectedCategory = ref(null);
const portfolioChartRef = ref(null);

// Lógica de Bloqueo de Portafolio
const isPortfolioUnlocked = ref(false);
const loginUser = ref('');
const portfolioPassword = ref('');
const portfolioError = ref('');

const unlockPortfolio = async () => {
  // NOTA: Acá validamos contra '1234' para entrar a mirar, la seguridad fuerte está al registrar compras en backend
  if (portfolioPassword.value === 'Colin') { 
    currentUser.value = loginUser.value || 'Diego';
    isPortfolioUnlocked.value = true;
    portfolioError.value = '';
    await fetchPortfolio();
  } else {
    portfolioError.value = 'Contraseña incorrecta';
  }
};

const logoutPortfolio = () => {
  isPortfolioUnlocked.value = false;
  portfolioPassword.value = '';
};

const lastUpdatedDate = computed(() => {
  if (livePrices.value.length === 0) return 'Cargando...';
  
  // Tomamos la fecha del primer activo devuelto por la API
  const rawDate = livePrices.value[0]?.fecha;
  if (!rawDate) return 'Desconocida';
  
  // Extraemos YYYY, MM, DD para evitar problemas de desfase horario (UTC)
  const datePart = rawDate.split('T')[0];
  const [year, month, day] = datePart.split('-');
  const dateObj = new Date(year, month - 1, day);
  return dateObj.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
});

// Lógica y Estado de "Mi Cartera"
const currentUser = ref('');
const portfolioHoldings = ref([]);

const fetchPortfolio = async () => {
  try {
    let data = null;
    try {
      const resLocal = await fetch(`${API_BASE_URL}/api/cartera?usuario=${currentUser.value}`);
      if (resLocal.ok) data = await resLocal.json();
    } catch (e) {}

    if (!data) {
      const apiUrl = import.meta.env.PROD ? `${import.meta.env.BASE_URL}cartera.json?t=${Date.now()}` : './cartera.json';
      const response = await fetch(apiUrl);
      if (response.ok) data = await response.json();
    }

    if (data && Array.isArray(data)) {
      portfolioHoldings.value = data.map(item => ({
        symbol: item.simbolo,
        name: item.nombre,
        emoji: item.emoji,
        quantity: Number(item.cantidad),
        avgPrice: Number(item.avgPrice || 0),
        totalComisiones: Number(item.totalComisiones || 0),
        fallbackPrice: 0,
        // Protegemos contra fechas que no son strings
        purchaseDate: item.purchaseDate ? 
          (typeof item.purchaseDate === 'string' ? item.purchaseDate.split('T')[0] : new Date(item.purchaseDate).toISOString().split('T')[0]) 
          : new Date().toISOString().split('T')[0]
      }));
      if (currentTab.value === 'cartera' && isPortfolioUnlocked.value) setTimeout(renderChart, 150);
    }
  } catch (err) { console.error('Error al cargar la cartera:', err); }
};

const enrichedPortfolio = computed(() => {
  return portfolioHoldings.value.map(holding => {
    const liveData = livePrices.value.find(p => p.simbolo === holding.symbol);
    const currentPrice = liveData ? Number(liveData.precio) : holding.fallbackPrice;
    const totalValue = currentPrice * holding.quantity;
    const totalCost = (holding.avgPrice * holding.quantity) + holding.totalComisiones;
    const profitLoss = totalValue - totalCost;
    const profitLossPercent = (profitLoss / totalCost) * 100;
    
    return { ...holding, currentPrice, totalValue, totalCost, profitLoss, profitLossPercent };
  });
});

const portfolioTotalValue = computed(() => enrichedPortfolio.value.reduce((acc, h) => acc + h.totalValue, 0));
const portfolioTotalCost = computed(() => enrichedPortfolio.value.reduce((acc, h) => acc + h.totalCost, 0)); // Suma exacta = 5492.58
const portfolioTotalPL = computed(() => portfolioTotalValue.value - portfolioTotalCost.value);
const portfolioTotalPLPercent = computed(() => portfolioTotalCost.value === 0 ? 0 : (portfolioTotalPL.value / portfolioTotalCost.value) * 100);

// Inyección de Chart.js y renderizado "Clean"
const loadChartJs = () => {
  return new Promise((resolve) => {
    if (window.Chart) return resolve(window.Chart);
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => resolve(window.Chart);
    document.head.appendChild(script);
  });
};

const renderChart = async () => {
  if (!portfolioChartRef.value) return;
  const ChartJS = await loadChartJs();
  
  // Ordenamos los intervalos dinámicamente para que la línea de tiempo del gráfico nunca se rompa según el mes actual
  const now = new Date();
  const daysYTD = Math.floor((now - new Date(now.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24));
  const allIntervals = [
    { id: '5y', label: 'Hace 5 Años', days: 1825 }, { id: '3y', label: 'Hace 3 Años', days: 1095 },
    { id: '1y', label: 'Hace 1 Año', days: 365 }, { id: 'ytd', label: 'YTD', days: daysYTD },
    { id: '9m', label: 'Hace 9 Meses', days: 270 }, { id: '6m', label: 'Hace 6 Meses', days: 180 },
    { id: '3m', label: 'Hace 3 Meses', days: 90 }, { id: '1m', label: 'Hace 1 Mes', days: 30 },
    { id: '1w', label: 'Hace 1 Sem', days: 7 }, { id: 'Hoy', label: 'Hoy', days: 0 }
  ].sort((a, b) => b.days - a.days); // Orden cronológico perfecto de más viejo a más nuevo

  const intervals = allIntervals.map(i => i.id);
  const labels = allIntervals.map(i => i.label);
  const intervalsDays = {};
  allIntervals.forEach(i => intervalsDays[i.id] = i.days);
  
  const colors = ['#06b6d4', '#eab308', '#818cf8', '#10b981']; // MU (cyan), GOOGL (yellow), MSFT (indigo), TSM (emerald)
  
  const datasets = portfolioHoldings.value.map((holding, index) => {
    const liveData = livePrices.value.find(p => p.simbolo === holding.symbol);
    let dataPoints = [];
    
    if (liveData && liveData.variaciones) {
      const current = Number(liveData.precio);
      const now = new Date();
      const purchase = new Date(holding.purchaseDate + 'T00:00:00'); // Forzamos medianoche local
      
      dataPoints = intervals.map(inter => {
        if (inter === 'Hoy') return ((current - holding.avgPrice) / holding.avgPrice) * 100;
        
        const daysAgo = intervalsDays[inter];
        const intervalDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        
        // Si la fecha del intervalo en el gráfico es anterior a cuando compraste, no tenías el activo
        if (intervalDate < purchase) {
          return null; // Chart.js no dibujará línea aquí
        }
        
        const v = liveData.variaciones[inter] || 0;
        const pastPrice = current / (1 + (v / 100));
        return ((pastPrice - holding.avgPrice) / holding.avgPrice) * 100; // Evolución desde TU precio de compra
      });
    } else {
      // Efecto visual limpio fallback en caso de no poder conectar a la API
      const endVal = holding.profitLossPercent || 0;
      dataPoints = intervals.map((_, i) => (endVal / 8) * i * (1 + (Math.random() * 0.1 - 0.05)));
    }
    
    return {
      label: holding.symbol,
      data: dataPoints,
      borderColor: colors[index],
      backgroundColor: 'transparent',
      borderWidth: 3,
      tension: 0.4, // Curva suavizada requerida
      pointBackgroundColor: colors[index],
      pointRadius: 4,
      pointHoverRadius: 8,
      spanGaps: true // Si hay un null (antes de comprar), Chart.js simplemente empieza a dibujar en el primer punto válido
    };
  });

  if (window.portfolioChartInstance) window.portfolioChartInstance.destroy();
  const ctx = portfolioChartRef.value.getContext('2d');
  
  window.portfolioChartInstance = new ChartJS(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: true, position: 'top', labels: { color: '#cbd5e1', font: { family: 'monospace', weight: 'bold' } } }, 
        tooltip: { 
          mode: 'index', 
          intersect: false, 
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#fff',
          bodyColor: '#e2e8f0',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context) {
              return ` ${context.dataset.label}: ${context.parsed.y > 0 ? '+' : ''}${context.parsed.y.toFixed(2)}%`;
            }
          }
        } 
      },
      scales: { 
        x: { grid: { display: false }, ticks: { color: '#64748b', font: { family: 'monospace', weight: 'bold' } } }, 
        y: { grid: { color: 'rgba(51, 65, 85, 0.5)' }, ticks: { color: '#64748b', font: { family: 'monospace' }, callback: function(value) { return value + '%'; } } } 
      },
      interaction: { mode: 'nearest', axis: 'x', intersect: false }
    }
  });
};

const categoryMeta = {
  'Merval': { emoji: '🇦🇷', gradient: 'dark:from-indigo-900/50 dark:to-purple-900/50 from-indigo-100 to-purple-100', borderHighlight: 'border-indigo-500/50', desc: 'Acciones locales y ADRs.' },
  'Big Tech': { emoji: '🦅', gradient: 'dark:from-blue-900/50 dark:to-cyan-900/50 from-blue-100 to-cyan-100', borderHighlight: 'border-blue-500/50', desc: 'Las gigantes tecnológicas globales.' },
  'Wall Street': { emoji: '🗽', gradient: 'dark:from-slate-700/50 dark:to-slate-800/50 from-slate-200 to-slate-300', borderHighlight: 'border-slate-500/50', desc: 'Otras acciones del mercado de EE.UU.' },
  'Moneda': { emoji: '💵', gradient: 'dark:from-emerald-900/50 dark:to-green-900/50 from-emerald-100 to-green-100', borderHighlight: 'border-emerald-500/50', desc: 'Cotizaciones del dólar en el país.' },
  'Índice/ETF': { emoji: '📈', gradient: 'dark:from-amber-900/50 dark:to-orange-900/50 from-amber-100 to-orange-100', borderHighlight: 'border-amber-500/50', desc: 'Rendimiento del mercado.' },
  'Bonos': { emoji: '📜', gradient: 'dark:from-red-900/50 dark:to-pink-900/50 from-red-100 to-pink-100', borderHighlight: 'border-red-500/50', desc: 'Deuda e instrumentos de renta fija.' },
  'Real Estate': { emoji: '🏢', gradient: 'dark:from-orange-900/50 dark:to-red-900/50 from-orange-100 to-red-100', borderHighlight: 'border-orange-500/50', desc: 'Inmobiliarias, M2 y construcción.' },
  // Agrega aquí cualquier categoría nueva que vayas a inventar en el add-ticker.js
  'Cripto': { emoji: '₿', gradient: 'dark:from-yellow-900/50 dark:to-orange-900/50 from-yellow-100 to-orange-100', borderHighlight: 'border-yellow-500/50', desc: 'Criptomonedas y activos digitales.' }
};

const groupedAssets = computed(() => {
  const groups = {};
  livePrices.value.forEach(asset => {
    if (!groups[asset.categoria]) groups[asset.categoria] = [];
    groups[asset.categoria].push(asset);
  });
  return groups;
});

const categoryPerformance = computed(() => {
  const result = {};
  if (livePrices.value.length === 0) return result;

  const getVariation = (simbolo) => Number(livePrices.value.find(a => a.simbolo === simbolo)?.variaciones[marketPeriod.value] || 0);
  const getAvgVariation = (categoria, filterFn = null) => {
    let items = livePrices.value.filter(a => a.categoria === categoria);
    if (filterFn) items = items.filter(filterFn);
    return items.length ? items.reduce((acc, a) => acc + Number(a.variaciones[marketPeriod.value] || 0), 0) / items.length : 0;
  };

  Object.keys(groupedAssets.value).forEach(categoryName => {
    let val = 0;
    if (categoryName === 'Moneda') {
      val = getVariation('DOLAR_OFICIAL');
    } else if (categoryName === 'Wall Street') {
      val = getVariation('SPY') || getAvgVariation('Wall Street');
    } else if (categoryName === 'Índice/ETF') {
      val = getAvgVariation('Índice/ETF');
    } else if (categoryName === 'Big Tech') {
      val = getAvgVariation(categoryName);
    } else if (categoryName === 'Merval') {
      val = getAvgVariation('Merval');
    } else if (categoryName === 'Real Estate') {
      val = getAvgVariation('Real Estate', a => a.simbolo.startsWith('M2_'));
    } else {
      val = getAvgVariation(categoryName);
    }
    result[categoryName] = Number(val).toFixed(2);
  });

  return result;
});

const getDynamicRendimiento = (activo) => {
  const varAPI = activo.variaciones[marketPeriod.value] || 0;
  const current = Number(activo.precio);
  const past = current / (1 + varAPI / 100);
  if (!past || past === 0) return 0;
  const rendimiento = ((current - past) / past) * 100;
  return Number(rendimiento.toFixed(2));
};

const getPastPriceFormatted = (activo) => {
  const varAPI = activo.variaciones[marketPeriod.value] || 0;
  const pastPrice = Number(activo.precio) / (1 + varAPI / 100);
  if (activo.simbolo === 'ALQ_YIELD') return `${pastPrice.toFixed(2)}%`;
  if (activo.categoria === 'Moneda' || activo.simbolo.endsWith('.BA') || activo.nombre.includes('AR$')) return `AR$ ${pastPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (activo.simbolo.startsWith('M2_')) return `US$ ${pastPrice.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
  return `US$ ${pastPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const m2HistoricAveragePrice = computed(() => {
  const symbols = ['M2_NUN', 'M2_BEL', 'M2_PAL', 'M2_REC'];
  const items = livePrices.value.filter(a => symbols.includes(a.simbolo));
  if (!items.length) return 0;
  
  const avg = items.reduce((acc, a) => {
    const varAPI = a.variaciones[marketPeriod.value] || 0;
    const past = Number(a.precio) / (1 + varAPI / 100);
    return acc + past;
  }, 0) / items.length;
  
  return Math.round(avg);
});

const m2AverageVariation = computed(() => {
  const past = m2HistoricAveragePrice.value;
  const current = m2AveragePrice.value;
  if (!past) return 0;
  return Number((((current - past) / past) * 100).toFixed(2));
});

const m2AveragePrice = computed(() => {
  const symbols = ['M2_NUN', 'M2_BEL', 'M2_PAL', 'M2_REC'];
  const items = livePrices.value.filter(a => symbols.includes(a.simbolo));
  if (!items.length) return 0;
  const avg = items.reduce((acc, a) => acc + Number(a.precio), 0) / items.length;
  return Math.round(avg);
});

// --- Lógica de la sección Admin ---
const isAdmin = ref(false);
const adminLoginUser = ref('');
const adminLoginPass = ref('');
const adminLoginError = ref('');
const adminForm = ref({ simbolo: '', nombre: '', categoria: 'Wall Street', emoji: '📈' });
const adminError = ref('');
const adminMessage = ref('');
const isSubmittingAdmin = ref(false);

const loginAdmin = () => {
  if (adminLoginUser.value === 'admin' && adminLoginPass.value === 'admin') {
    isAdmin.value = true;
    adminLoginError.value = '';
    showAdminLoginModal.value = false;
    currentTab.value = 'mercados'; // Fuerza la redirección al Home
  } else {
    adminLoginError.value = 'Credenciales incorrectas.';
  }
};

const logoutAdmin = () => {
  isAdmin.value = false;
  adminLoginUser.value = '';
  adminLoginPass.value = '';
  adminError.value = '';
  adminMessage.value = '';
  if (currentTab.value === 'add_ticker') {
    currentTab.value = 'mercados'; // Lo sacamos de la pestaña prohibida
  }
};

const submitAdminForm = async () => {
  adminError.value = '';
  adminMessage.value = '';
  isSubmittingAdmin.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/api/activos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...adminForm.value, adminPassword: adminLoginPass.value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error de conexión.');
    adminMessage.value = data.message;
    adminForm.value = { simbolo: '', nombre: '', categoria: 'Wall Street', emoji: '📈' }; 
    
    // ¡EL IDA Y VUELTA! -> Disparamos la actualización del frontend instantáneamente
    await fetchLivePrices();

  } catch (err) {
    adminError.value = err.message === 'Failed to fetch' ? 'No se pudo conectar. Verifica que tu servidor local (node server.js) esté corriendo.' : err.message;
  } finally {
    isSubmittingAdmin.value = false;
  }
};

const deleteAsset = async (simbolo) => {
  if (!confirm(`¿Estás seguro de eliminar ${simbolo}? Esto no se puede deshacer.`)) return;
  try {
    const response = await fetch(`${API_BASE_URL}/api/activos/${simbolo}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword: adminLoginPass.value })
    });
    if (response.ok) {
      alert(`✅ Activo ${simbolo} eliminado con éxito.`);
      await fetchLivePrices(); // Refrescamos los precios y sacamos el activo de la lista
    } else {
      const data = await response.json();
      alert(`❌ Error: ${data.error || 'No se pudo eliminar el activo.'}`);
    }
  } catch (err) {
    alert('❌ Error al intentar conectar con el servidor.');
  }
};

const txForm = ref({ simbolo: '', cantidad: null, precio_compra: null, fecha: new Date().toISOString().split('T')[0], adminPassword: '' });
const txError = ref('');
const txMessage = ref('');
const isSubmittingTx = ref(false);

const submitTxForm = async () => {
  txError.value = '';
  txMessage.value = '';
  isSubmittingTx.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/api/cartera`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...txForm.value, usuario: currentUser.value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error de conexión.');
    txMessage.value = data.message;
    txForm.value = { simbolo: '', cantidad: null, precio_compra: null, fecha: new Date().toISOString().split('T')[0], adminPassword: txForm.value.adminPassword };
    await fetchPortfolio();
  } catch (err) {
    txError.value = err.message === 'Failed to fetch' ? 'No se pudo conectar al servidor local.' : err.message;
  } finally {
    isSubmittingTx.value = false;
  }
};

const rentYieldHistoric = computed(() => {
  const item = livePrices.value.find(a => a.simbolo === 'ALQ_YIELD');
  if (!item) return 0;
  const varAPI = item.variaciones[marketPeriod.value] || 0;
  const past = Number(item.precio) / (1 + varAPI / 100);
  return Number(past.toFixed(2));
});

const rentYieldVariation = computed(() => {
  const past = rentYieldHistoric.value;
  const current = Number(rentYield.value);
  if (!past) return 0;
  return Number((((current - past) / past) * 100).toFixed(2));
});

const rentYield = computed(() => {
  const item = livePrices.value.find(a => a.simbolo === 'ALQ_YIELD');
  return item ? Number(item.precio).toFixed(2) : 0;
});

const fetchLivePrices = async () => {
  try {
    let data = null;
    
    // TRUCO DE MAGIA: Si tenés el servidor local encendido en tu PC, intentamos leer la BD en vivo directamente
    try {
      const resLocal = await fetch(`${API_BASE_URL}/api/precios`);
      if (resLocal.ok) data = await resLocal.json();
    } catch (e) {
      // Falla silenciosamente si sos un usuario normal viendo la web (sin servidor local)
    }

    // Si el servidor local está apagado, leemos la foto estática de GitHub Pages
    if (!data) {
      const apiUrl = import.meta.env.PROD ? `${import.meta.env.BASE_URL}precios.json?t=${Date.now()}` : './precios.json';
      const response = await fetch(apiUrl);
      data = await response.json();
    }

    livePrices.value = data;
    if (currentTab.value === 'cartera') {
      setTimeout(renderChart, 150); 
    }
  } catch (error) {
    console.error('Error al conectar con la API:', error);
  }
};

onMounted(() => {
  fetchLivePrices();
  fetchPortfolio();
});
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

/* Custom Scrollbar elegante para las áreas con scroll (Modo Claro/Oscuro) */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.4);
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(71, 85, 105, 0.5);
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(71, 85, 105, 0.8);
}

/* Animación "Jiggle" estilo iPhone para desinstalar */
@keyframes jiggle {
  0% { transform: rotate(-1deg); }
  50% { transform: rotate(1.5deg); }
  100% { transform: rotate(-1deg); }
}
.animate-jiggle {
  animation: jiggle 0.3s infinite;
}
</style>