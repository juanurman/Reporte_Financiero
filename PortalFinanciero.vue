<template>
  <div :class="isDarkMode ? 'dark' : ''">
    <div class="min-h-screen dark:bg-slate-950 bg-slate-50 dark:text-slate-200 text-slate-800 p-4 md:p-8 font-sans transition-colors duration-300">
      <div class="max-w-[95%] xl:max-w-[1600px] mx-auto space-y-10">
      
      <!-- Header -->
      <header class="text-center space-y-4 relative">
        <button @click="isDarkMode = !isDarkMode" class="absolute right-0 top-0 p-3 rounded-full dark:bg-slate-800 bg-white shadow-md border dark:border-white/5 border-slate-200 hover:scale-110 transition-transform">
          {{ isDarkMode ? '☀️' : '🌙' }}
        </button>
        <h1 class="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 pb-2 leading-tight">
          Portal Financiero Argentino
        </h1>
        <p class="text-lg md:text-xl dark:text-slate-400 text-slate-600 font-medium">
          Rendimientos históricos, análisis de riesgo y costo de oportunidad.
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
        <button @click="currentTab = 'comparador'" :class="currentTab === 'comparador' ? 'bg-white dark:bg-slate-700 shadow-md text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'" class="px-6 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2">
          ⚖️ ¿Qué conviene?
        </button>
        <button @click="currentTab = 'calculadora'" :class="currentTab === 'calculadora' ? 'bg-white dark:bg-slate-700 shadow-md text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'" class="px-6 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2">
          ⏱️ Calculadora Histórica
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
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
      <!-- Calculadora de Retorno Histórico -->
      <section class="dark:bg-slate-900/80 bg-white border dark:border-white/10 border-slate-200 rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden dark:text-white text-slate-900 transition-all duration-300">
        <div class="absolute top-0 right-0 -mt-10 -mr-10 opacity-10 text-9xl pointer-events-none">📊📈</div>
        
        <!-- Cabecera colapsable -->
        <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 cursor-pointer select-none" @click="showCalculator = !showCalculator">
          <h2 class="text-2xl md:text-3xl font-bold flex items-center gap-2 md:gap-3 leading-tight">
            <span>⏱️</span> Calculadora de Retorno Histórico
          </h2>
          <button class="dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:bg-slate-800 bg-slate-100 border dark:border-white/5 border-slate-300 px-4 py-2 rounded-xl transition text-sm font-bold w-full sm:w-fit" @click.stop="showCalculator = !showCalculator">
            {{ showCalculator ? 'Ocultar Calculadora ⬆️' : 'Abrir Calculadora ⬇️' }}
          </button>
        </div>

        <div v-show="showCalculator" class="relative z-10 animate-fade-in">
          <p class="dark:text-slate-400 text-slate-600 mb-8 max-w-2xl">
            Simula el rendimiento que habrían tenido tus fondos si los hubieses invertido en el pasado en diferentes clases de activos.
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
                <option value="1y">Hace 1 año (Período electoral)</option>
                <option value="3y">Hace 3 años (Mediano plazo)</option>
                <option value="5y">Hace 5 años (Largo plazo 2019)</option>
              </select>
            </div>

            <!-- Botón -->
            <div class="flex items-end">
              <button @click="calculateTravel" class="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-slate-900 font-black text-lg py-[11px] px-6 rounded-xl transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:shadow-[0_0_30px_rgba(251,191,36,0.7)]">
                Calcular Rendimiento 📊
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
      
      <!-- PESTAÑA: COMPARADOR DE INVERSIONES -->
      <div v-if="currentTab === 'comparador'" class="space-y-10 animate-fade-in">
        
        <!-- Perfil Patrimonial -->
        <section class="dark:bg-slate-900 bg-white border dark:border-white/5 border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="space-y-2 text-center md:text-left">
            <h2 class="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
              Perfil Patrimonial & Recomendaciones
            </h2>
            <p class="text-sm dark:text-slate-400 text-slate-500 font-medium">
              Selecciona tu prioridad estratégica para contrastar la rentabilidad frente a la seguridad.
            </p>
          </div>
          
          <div class="flex flex-wrap justify-center gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border dark:border-slate-800 border-slate-300">
            <button @click="userPreference = 'seguridad'" 
                    :class="userPreference === 'seguridad' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
                    class="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-2">
              🛡️ Priorizar Seguridad
            </button>
            <button @click="userPreference = 'balanceado'" 
                    :class="userPreference === 'balanceado' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
                    class="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-2">
              ⚖️ Perfil Balanceado
            </button>
            <button @click="userPreference = 'rendimiento'" 
                    :class="userPreference === 'rendimiento' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
                    class="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-2">
              📈 Priorizar Rendimiento
            </button>
          </div>
        </section>

        <!-- Contenido Principal en Dos Columnas -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <!-- Clasificación de Rendimientos (Columna Izquierda - 7/12) -->
          <div class="lg:col-span-7 space-y-6">
            <div class="flex justify-between items-center mb-2">
              <h3 class="text-xl font-bold dark:text-white text-slate-800">
                Clasificación de Rendimientos (USD)
              </h3>
              <span class="text-xs uppercase tracking-wider dark:text-slate-400 text-slate-500 font-bold">
                Medido en base al período seleccionado
              </span>
            </div>

            <div class="space-y-4">
              <div v-for="(asset, index) in comparisonData" :key="asset.id"
                   class="dark:bg-slate-900 bg-white border rounded-[2rem] p-5 md:p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 relative overflow-hidden"
                   :class="[
                     asset.id === bestMatchAsset?.id 
                       ? 'ring-2 ring-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)] transform scale-[1.01] dark:border-indigo-500/50 border-indigo-400' 
                       : 'dark:border-white/5 border-slate-200 hover:border-slate-300 dark:hover:border-slate-800'
                   ]">
                
                <!-- Badge de Activo Recomendado para el perfil -->
                <div v-if="asset.id === bestMatchAsset?.id" 
                     class="absolute top-0 right-0 bg-indigo-500 text-white font-extrabold text-[10px] uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-md">
                  ⭐ Recomendado para ti
                </div>

                <div class="flex items-start gap-4">
                  <span class="text-3xl md:text-4xl dark:bg-slate-950 bg-slate-50 p-2.5 rounded-xl border dark:border-white/5 border-slate-200">
                    {{ asset.emoji }}
                  </span>
                  <div class="space-y-1 max-w-[280px] sm:max-w-xs md:max-w-sm">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-black text-slate-400">#{{ index + 1 }}</span>
                      <h4 class="font-extrabold text-base md:text-lg dark:text-white text-slate-800 leading-tight">
                        {{ asset.name }}
                      </h4>
                    </div>
                    <p class="text-xs dark:text-slate-400 text-slate-500 font-semibold leading-relaxed">
                      {{ asset.desc }}
                    </p>
                    <div v-if="asset.detail" class="text-[10px] dark:text-slate-500 text-slate-400 font-bold bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded w-fit border dark:border-white/5 border-slate-200">
                      {{ asset.detail }}
                    </div>
                  </div>
                </div>

                <div class="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0 gap-3">
                  <div class="text-left sm:text-right">
                    <span class="block text-[10px] dark:text-slate-500 text-slate-400 font-black uppercase tracking-wider">Retorno Acumulado</span>
                    <span class="text-lg md:text-xl font-black" 
                          :class="asset.returnUSD >= 0 ? 'text-emerald-500' : 'text-red-500'">
                      {{ asset.returnUSD >= 0 ? '+' : '' }}{{ asset.returnUSD.toFixed(2) }}%
                    </span>
                  </div>
                  
                  <div class="flex flex-col items-end gap-1.5">
                    <span class="text-[10px] font-black px-2 py-1 rounded-lg border shadow-inner flex items-center gap-1"
                          :class="[
                            asset.matchScore >= 80 
                              ? 'dark:bg-emerald-500/20 bg-emerald-50 text-emerald-600 dark:text-emerald-400 dark:border-emerald-500/30 border-emerald-300' 
                              : asset.matchScore >= 50 
                                ? 'dark:bg-amber-500/20 bg-amber-50 text-amber-600 dark:text-amber-400 dark:border-amber-500/30 border-amber-300' 
                                : 'dark:bg-red-500/20 bg-red-50 text-red-600 dark:text-red-400 dark:border-red-500/30 border-red-300'
                          ]">
                      Compatibilidad: {{ asset.matchScore }}%
                    </span>
                    
                    <div class="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                      <span title="Seguridad (Paz Mental)">🛡️ {{ asset.safety }}/10</span>
                      <span>•</span>
                      <span title="Riesgo / Volatilidad">🎲 {{ asset.volatility }}/10</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <!-- Asesoramiento y Gráfico (Columna Derecha - 5/12) -->
          <div class="lg:col-span-5 space-y-8">
            
            <!-- Gráfico Comparativo -->
            <div class="dark:bg-slate-900 bg-white border dark:border-white/5 border-slate-200 rounded-[2rem] p-6 shadow-xl space-y-4">
              <h3 class="text-lg font-bold dark:text-white text-slate-800 flex items-center gap-2">
                📊 Rendimiento Visual Comparado (USD)
              </h3>
              <div class="h-64 relative">
                <canvas id="comparisonChart" ref="comparisonChartRef"></canvas>
              </div>
            </div>

            <!-- Veredicto AI Patrimonial -->
            <div class="dark:bg-slate-900 bg-white border dark:border-white/5 border-slate-200 rounded-[2rem] p-6 shadow-xl space-y-4 relative overflow-hidden">
              <div class="absolute top-0 right-0 -mt-6 -mr-6 opacity-5 text-7xl pointer-events-none">⚖️</div>
              <h3 class="text-lg font-bold dark:text-white text-slate-800 flex items-center gap-2">
                ⚖️ Asesoramiento Patrimonial
              </h3>
              <div class="space-y-3 text-sm dark:text-slate-300 text-slate-600 leading-relaxed font-medium">
                <p>
                  Para el período seleccionado de <span class="text-indigo-500 dark:text-indigo-400 font-bold">{{ marketPeriodLabels[marketPeriod] }}</span>, 
                  el activo con mejor rendimiento histórico absoluto es <span class="font-extrabold text-slate-800 dark:text-white">{{ comparisonData[0]?.name }}</span> con un retorno de <span class="font-black text-emerald-500">{{ comparisonData[0]?.returnUSD >= 0 ? '+' : '' }}{{ comparisonData[0]?.returnUSD.toFixed(2) }}%</span> en dólares.
                </p>
                <p>
                  Según tu preferencia por <span class="text-indigo-500 dark:text-indigo-400 font-bold">{{ userPreference === 'seguridad' ? 'minimizar riesgos (Seguridad)' : userPreference === 'rendimiento' ? 'maximizar ganancias (Rendimiento)' : 'un balance equilibrado' }}</span>, 
                  la inversión óptima sugerida para ti es <span class="font-extrabold text-slate-800 dark:text-white">{{ bestMatchAsset?.name }}</span> (Compatibilidad del {{ bestMatchAsset?.matchScore }}%).
                </p>
                <p class="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  💡 **Análisis de Bienes Raíces (Ladrillo)**: Aporta un retorno total compuesto de <span class="font-bold dark:text-slate-300 text-slate-700">{{ comparisonData.find(a => a.id === 'realestate')?.returnUSD.toFixed(2) }}% USD</span> en este horizonte. Al ser un activo de baja volatilidad histórica en comparación con la timba bursátil o criptográfica, representa una opción óptima para la preservación de riqueza y resguardo de capital.
                </p>
              </div>
            </div>

            <!-- Ranking Inmobiliario por Barrio -->
            <div class="dark:bg-slate-900 bg-white border dark:border-white/5 border-slate-200 rounded-[2rem] p-6 shadow-xl space-y-5">
              <div class="space-y-1">
                <h3 class="text-lg font-bold dark:text-white text-slate-800 flex items-center gap-2">
                  🏢 Rendimiento por Barrio (CABA)
                </h3>
                <p class="text-[10px] dark:text-slate-500 text-slate-400 font-bold uppercase tracking-wider">
                  Valores promedio para unidades estándar de 50 m²
                </p>
              </div>

              <div class="space-y-4">
                <!-- Top 3 Yield -->
                <div class="space-y-2">
                  <h4 class="text-xs font-black dark:text-emerald-400 text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                    ▲ Mayor Rentabilidad por Alquiler (Yield Anual)
                  </h4>
                  <div class="space-y-2">
                    <div v-for="(b, idx) in top3NeighborhoodYields" :key="b.code"
                         class="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/10 text-sm">
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-slate-400 text-xs">#{{ idx + 1 }}</span>
                        <span class="font-bold dark:text-white text-slate-800">{{ b.name }}</span>
                      </div>
                      <div class="text-right">
                        <span class="font-black dark:text-emerald-400 text-emerald-600 block">{{ b.yieldPercent }}% anual</span>
                        <span class="text-[10px] text-slate-400 font-semibold block">M2: US$ {{ b.priceM2.toLocaleString('es-AR') }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Bottom 3 Yield -->
                <div class="space-y-2">
                  <h4 class="text-xs font-black dark:text-red-400 text-red-600 uppercase tracking-widest flex items-center gap-1">
                    ▼ Menor Rentabilidad por Alquiler (Yield Anual)
                  </h4>
                  <div class="space-y-2">
                    <div v-for="(b, idx) in bottom3NeighborhoodYields" :key="b.code"
                         class="flex items-center justify-between p-3 rounded-xl bg-red-500/5 dark:bg-red-950/20 border border-red-500/10 text-sm">
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-slate-400 text-xs">#{{ idx + 1 }}</span>
                        <span class="font-bold dark:text-white text-slate-800">{{ b.name }}</span>
                      </div>
                      <div class="text-right">
                        <span class="font-black dark:text-red-400 text-red-600 block">{{ b.yieldPercent }}% anual</span>
                        <span class="text-[10px] text-slate-400 font-semibold block">M2: US$ {{ b.priceM2.toLocaleString('es-AR') }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p class="text-[10px] text-slate-500 dark:text-slate-500 font-semibold bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border dark:border-white/5 border-slate-200">
                ℹ️ **Nota metodológica**: El rendimiento anual se calcula proyectando los alquileres en pesos a USD MEP divididos por el valor total estimado de la unidad.
              </p>
            </div>

          </div>
        </div>
        
      </div> <!-- Fin Pestaña Comparador -->

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

          <!-- Formulario para Registrar Transacción -->
          <div id="tx-form-section" class="dark:bg-slate-800/50 bg-white backdrop-blur border dark:border-slate-700 border-slate-200 rounded-2xl p-6 shadow-xl mb-6 transition-all duration-300" :class="editingTxId ? 'ring-2 ring-indigo-500 shadow-indigo-500/20' : ''">
            <h3 class="text-lg font-bold dark:text-white text-slate-800 mb-4 flex items-center gap-2">
              {{ editingTxId ? '✏️ Editar Transacción' : '📝 Registrar Transacción' }}
            </h3>
            <form @submit.prevent="submitTxForm" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 items-end">
              <div>
                <label class="block text-xs font-bold dark:text-slate-400 text-slate-500 mb-1 uppercase tracking-wider">Activo</label>
                <input v-model="txForm.simbolo" required placeholder="Ej: AAPL" class="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-700 border-slate-300 dark:text-white text-slate-900 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-bold text-sm" />
              </div>
              <div>
                <label class="block text-xs font-bold dark:text-slate-400 text-slate-500 mb-1 uppercase tracking-wider">Tipo</label>
                <select v-model="txForm.tipo" required class="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-700 border-slate-300 dark:text-white text-slate-900 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm appearance-none cursor-pointer">
                  <option value="COMPRA">COMPRA</option>
                  <option value="VENTA">VENTA</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold dark:text-slate-400 text-slate-500 mb-1 uppercase tracking-wider">Cantidad</label>
                <input type="number" step="any" v-model.number="txForm.cantidad" required placeholder="0.00" class="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-700 border-slate-300 dark:text-white text-slate-900 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm" />
              </div>
              <div>
                <label class="block text-xs font-bold dark:text-slate-400 text-slate-500 mb-1 uppercase tracking-wider">Precio Unit. (USD)</label>
                <div class="relative">
                  <input type="number" step="any" v-model.number="txForm.precio_compra" required placeholder="0.00" :disabled="isFetchingPrice" class="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-700 border-slate-300 dark:text-white text-slate-900 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm disabled:opacity-50 disabled:cursor-wait transition-opacity" />
                  <div v-if="isFetchingPrice" class="absolute right-3 top-1/2 -translate-y-1/2">
                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-400"></div>
                  </div>
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold dark:text-slate-400 text-slate-500 mb-1 uppercase tracking-wider">Comisiones</label>
                <input type="number" step="any" v-model.number="txForm.comisiones" placeholder="0.00" class="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-700 border-slate-300 dark:text-white text-slate-900 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm" />
              </div>
              <div>
                <label class="block text-xs font-bold dark:text-slate-400 text-slate-500 mb-1 uppercase tracking-wider">Fecha</label>
                <input type="date" v-model="txForm.fecha" required class="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-700 border-slate-300 dark:text-white text-slate-900 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm cursor-pointer" />
              </div>
              <div class="lg:col-span-1 flex gap-2">
                <button v-if="editingTxId" @click="cancelEdit" type="button" class="w-full bg-slate-500 hover:bg-slate-400 text-white font-black text-sm py-2.5 px-2 rounded-xl transition-all transform hover:scale-105 shadow-md flex items-center justify-center" title="Cancelar Edición">
                  ✕
                </button>
                <button type="submit" :disabled="isSubmittingTx" class="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white font-black text-sm py-2.5 px-4 rounded-xl transition-all transform hover:scale-105 shadow-md flex items-center justify-center">
                  {{ isSubmittingTx ? '⏳' : (editingTxId ? 'Actualizar' : 'Guardar') }}
                </button>
              </div>
            </form>
            <div v-if="txError" class="text-red-500 bg-red-500/10 px-3 py-2 rounded-lg text-xs font-bold mt-3 text-center">{{ txError }}</div>
            <div v-if="txMessage" class="text-emerald-500 bg-emerald-500/10 px-3 py-2 rounded-lg text-xs font-bold mt-3 text-center">{{ txMessage }}</div>
          </div>

          <!-- Tabla de Tenencias -->
          <div class="dark:bg-slate-800/50 bg-white backdrop-blur border dark:border-slate-700 border-slate-200 rounded-2xl overflow-hidden shadow-xl overflow-x-auto mb-6">
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

          <!-- Historial de Transacciones -->
          <div class="dark:bg-slate-800/50 bg-white backdrop-blur border dark:border-slate-700 border-slate-200 rounded-2xl overflow-hidden shadow-xl overflow-x-auto mb-16">
            <div class="p-6 border-b dark:border-slate-700 border-slate-200 flex justify-between items-center">
              <h3 class="text-lg font-bold dark:text-white text-slate-800 flex items-center gap-2">⏱️ Historial de Movimientos</h3>
            </div>
            <table class="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr class="dark:bg-slate-800/80 bg-slate-100 border-b dark:border-slate-700 border-slate-200 text-xs uppercase tracking-wider dark:text-slate-400 text-slate-500 font-bold">
                  <th class="px-6 py-4">Fecha</th>
                  <th class="px-6 py-4">Operación</th>
                  <th class="px-6 py-4">Activo</th>
                  <th class="px-6 py-4 text-right">Cantidad</th>
                  <th class="px-6 py-4 text-right">Precio Unit.</th>
                  <th class="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y dark:divide-slate-700/50 divide-slate-200">
                <tr v-for="tx in transactionHistory" :key="tx.id" class="dark:hover:bg-slate-800/40 hover:bg-slate-50 transition-colors group" :class="editingTxId === tx.id ? 'dark:bg-indigo-900/20 bg-indigo-50' : ''">
                  <td class="px-6 py-4 font-medium dark:text-slate-300 text-slate-700">{{ formatDisplayDate(tx.fecha) }}</td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded text-xs font-bold" :class="tx.tipo === 'COMPRA' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'">{{ tx.tipo }}</span>
                  </td>
                  <td class="px-6 py-4 font-bold dark:text-white text-slate-900">{{ tx.simbolo }}</td>
                  <td class="px-6 py-4 text-right font-medium dark:text-slate-300 text-slate-700">{{ tx.cantidad }}</td>
                  <td class="px-6 py-4 text-right font-medium dark:text-slate-300 text-slate-700">{{ formatUSD(tx.precio_compra) }}</td>
                  <td class="px-6 py-4 flex justify-center gap-2">
                    <button @click="editTx(tx)" class="text-indigo-500 hover:text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded transition text-xs font-bold uppercase tracking-wider">Editar</button>
                    <button @click="deleteTx(tx.id)" class="text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded transition text-xs font-bold uppercase tracking-wider">Borrar</button>
                  </td>
                </tr>
                <tr v-if="transactionHistory.length === 0">
                  <td colspan="6" class="px-6 py-8 text-center dark:text-slate-500 text-slate-400 font-medium">No hay transacciones registradas.</td>
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
          <div class="p-6 md:p-8 dark:text-white text-slate-900 flex justify-between items-center border-b dark:border-white/10 border-slate-200 shrink-0" :class="`bg-gradient-to-r ${categoryMeta[selectedCategory]?.gradient || 'dark:from-slate-800 dark:to-slate-900 from-slate-100 to-white'}`">
            <div class="flex items-center gap-4">
              <span class="text-4xl">{{ categoryMeta[selectedCategory]?.emoji }}</span>
              <h2 class="text-3xl font-bold">{{ selectedCategory }}</h2>
            </div>
            <button @click="selectedCategory = null" class="dark:text-white/80 text-slate-500 dark:hover:text-white hover:text-slate-900 dark:bg-black/30 bg-black/5 dark:hover:bg-black/50 hover:bg-black/10 rounded-full w-10 h-10 flex items-center justify-center transition text-xl font-bold shadow-inner">
              ✕
            </button>
          </div>
          
          <!-- Panel Resumen de Real Estate -->
          <div v-if="selectedCategory === 'Real Estate'" class="dark:bg-slate-950 bg-slate-50 p-4 md:p-6 border-b dark:border-slate-800 border-slate-200 flex flex-col gap-4 dark:text-white text-slate-800 shrink-0">
            <!-- Tabs Internos -->
            <div class="flex justify-center gap-2">
              <button @click="realEstateTab = 'm2'" :class="realEstateTab === 'm2' ? 'bg-indigo-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'" class="px-4 py-2 rounded-lg font-bold text-sm transition-all">
                🏢 Valor M2
              </button>
              <button @click="realEstateTab = 'alquiler'" :class="realEstateTab === 'alquiler' ? 'bg-indigo-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'" class="px-4 py-2 rounded-lg font-bold text-sm transition-all">
                🔑 Rendimiento Alquiler
              </button>
            </div>
            
            <div v-if="realEstateTab === 'm2'" class="flex justify-around mt-2 animate-fade-in">
              <div class="text-center">
                <div class="text-xs md:text-sm font-bold dark:text-slate-400 text-slate-500 uppercase">M2 Promedio (CABA)</div>
                <div class="text-2xl md:text-3xl font-black dark:text-emerald-400 text-emerald-600">US$ {{ m2AveragePrice.toLocaleString('es-AR') }}</div>
                <div class="text-xs md:text-sm font-bold mt-1" :class="m2AverageVariation >= 0 ? 'dark:text-emerald-400 text-emerald-600' : 'dark:text-red-400 text-red-600'">
                  {{ marketPeriodLabels[marketPeriod] }}: US$ {{ m2HistoricAveragePrice.toLocaleString('es-AR') }} 
                  ({{ m2AverageVariation >= 0 ? '▲' : '▼' }} {{ Math.abs(m2AverageVariation) }}%)
                </div>
              </div>
            </div>
            
            <div v-if="realEstateTab === 'alquiler'" class="flex justify-around mt-2 animate-fade-in">
              <div class="text-center">
                <div class="text-xs md:text-sm font-bold dark:text-slate-400 text-slate-500 uppercase">Alquiler Promedio</div>
                <div class="text-2xl md:text-3xl font-black dark:text-amber-400 text-amber-600">{{ rentYield }}% <span class="text-sm dark:text-slate-500 text-slate-400 font-bold">anual</span></div>
                <div class="text-xs md:text-sm font-bold mt-1" :class="rentYieldVariation >= 0 ? 'dark:text-emerald-400 text-emerald-600' : 'dark:text-red-400 text-red-600'">
                  {{ marketPeriodLabels[marketPeriod] }}: {{ rentYieldHistoric }}% 
                  ({{ rentYieldVariation >= 0 ? '▲' : '▼' }} {{ Math.abs(rentYieldVariation) }}%)
                </div>
              </div>
            </div>
          </div>

          <!-- Lista de Activos dentro de la categoría -->
          <div class="p-6 md:p-8 overflow-y-auto custom-scrollbar dark:bg-slate-950/50 bg-slate-100/50 flex-1 min-h-0">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div v-if="filteredAssetsForCategory.length === 0" class="col-span-full text-center text-slate-500 dark:text-slate-400 py-8 font-medium">
                Todavía no hay datos cargados en esta sección.
              </div>
              <div v-for="activo in filteredAssetsForCategory" :key="activo.id" 
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
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          <!-- Columna 1: Agregar Activo -->
          <section class="dark:bg-slate-900 bg-white p-8 rounded-[2rem] shadow-2xl border dark:border-slate-800 border-slate-200 h-fit">
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

          <!-- Columna 2: Crear Usuario -->
          <section class="dark:bg-slate-900 bg-white p-8 rounded-[2rem] shadow-2xl border dark:border-slate-800 border-slate-200 h-fit">
            <h2 class="text-3xl font-bold dark:text-white text-slate-800 flex items-center gap-3 mb-2">
              👤 Crear Usuario
            </h2>
            <p class="dark:text-slate-400 text-slate-500 mb-8">
              Generá un acceso privado para un nuevo inversor.
            </p>
            <form @submit.prevent="submitUserForm" class="space-y-4">
              <div>
                <label class="block text-sm font-bold dark:text-slate-400 text-slate-500 mb-1">Nombre de Usuario</label>
                <input v-model="userForm.username" required placeholder="Ej: MATIAS" class="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-700 border-slate-300 dark:text-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-bold" />
              </div>
              <div>
                <label class="block text-sm font-bold dark:text-slate-400 text-slate-500 mb-1">Contraseña</label>
                <input type="password" v-model="userForm.password" required placeholder="Contraseña segura" class="w-full dark:bg-slate-950 bg-slate-50 border dark:border-slate-700 border-slate-300 dark:text-white text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-bold tracking-widest" />
              </div>
              <button type="submit" :disabled="isSubmittingUser" class="w-full mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white font-black text-lg py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg">
                {{ isSubmittingUser ? 'Guardando...' : 'Crear Usuario' }}
              </button>
              <p v-if="userError" class="text-red-500 font-bold text-center mt-4 bg-red-500/10 p-2 rounded-lg">{{ userError }}</p>
              <p v-if="userMessage" class="text-emerald-500 font-bold text-center mt-4 bg-emerald-500/10 p-2 rounded-lg">{{ userMessage }}</p>
            </form>
          </section>
          
          <!-- Fila inferior: Lista de Usuarios -->
          <div class="lg:col-span-2">
            <section class="dark:bg-slate-900 bg-white p-8 rounded-[2rem] shadow-2xl border dark:border-slate-800 border-slate-200">
              <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-bold dark:text-white text-slate-800 flex items-center gap-2">👥 Inversores Registrados</h3>
                <button @click="fetchUsers" class="text-sm font-bold bg-indigo-500/10 text-indigo-500 px-3 py-1.5 rounded-lg hover:bg-indigo-500/20 transition">↻ Actualizar</button>
              </div>
              <div v-if="usersList.length === 0" class="text-slate-500 font-medium text-center py-4">No hay usuarios creados aún en la base de datos.</div>
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div v-for="user in usersList" :key="user.id" class="flex justify-between items-center dark:bg-slate-950 bg-slate-50 p-4 rounded-xl border dark:border-slate-800 border-slate-200 shadow-sm transition hover:border-slate-400 dark:hover:border-slate-600">
                  <span class="font-bold dark:text-white text-slate-800 text-lg">👤 {{ user.username }}</span>
                  <div class="flex gap-2">
                    <button @click="viewUserPortfolio(user.username)" class="text-indigo-500 hover:text-indigo-600 font-bold bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors text-xs uppercase tracking-wider">Ver</button>
                    <button @click="deleteUser(user.username)" class="text-red-500 hover:text-red-600 font-bold bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors text-xs uppercase tracking-wider">Borrar</button>
                  </div>
                </div>
              </div>
            </section>
          </div>

        </div>
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

  const getM2AvgVariation = () => {
    const items = livePrices.value.filter(a => a.categoria === 'Real Estate' && a.simbolo.startsWith('M2_'));
    return items.length ? items.reduce((acc, a) => acc + Number(a.variaciones[selectedPeriod.value] || 0), 0) / items.length : 0;
  };

  const dynamicAssets = [
    { id: 'merval', name: 'Acciones Argentinas (Merval)', emoji: '🇦🇷', varUSD: getAvgVariation('Merval') },
    { id: 'sp500', name: 'S&P 500 (SPY)', emoji: '📈', varUSD: getVariation('SPY') },
    { id: 'big6', name: 'Big Tech (Tecnológicas)', emoji: '🦅', varUSD: getAvgVariation('Big Tech') },
    { id: 'mep', name: 'Dólar MEP (Efectivo)', emoji: '💵', varUSD: inflacionUS }, // El MEP en base USD solo sufre la devaluación del poder de compra del USD
    { id: 'realestate', name: 'Bienes Raíces (Apreciación M2)', emoji: '🏢', varUSD: getM2AvgVariation() },
    { id: 'efectivo', name: 'Efectivo en Pesos (ARS)', emoji: '💸', varUSD: ((1 / (1 + varMEP / 100)) - 1) * 100 } 
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

  // Asignamos una descripción analítica dependiendo del ganador
  const winner = results.value[0].id;
  if (winner === 'merval') funnyPhrase.value = 'La renta variable local lideró el rendimiento en este período, impulsada por una fuerte revalorización de los activos cotizados en el mercado de valores argentino.';
  else if (winner === 'mep') funnyPhrase.value = 'El dólar MEP conservó el poder de compra real, mitigando la volatilidad cambiaria propia de la moneda local.';
  else if (winner === 'sp500') funnyPhrase.value = 'El índice S&P 500 consolidó un retorno diversificado y de bajo riesgo en moneda dura, superando a la inflación estadounidense en el mediano/largo plazo.';
  else if (winner === 'big6') funnyPhrase.value = 'Las corporaciones tecnológicas globales generaron los retornos más elevados, apalancadas por el crecimiento del sector digital y de inteligencia artificial.';
  else funnyPhrase.value = 'Bienes Raíces demostró ser una inversión defensiva óptima, preservando el valor real del capital y brindando cobertura patrimonial de largo plazo.';

  // Costo de Oportunidad a Bienes Reales
  const bestProfit = results.value[0].profit;
  equivalencyText.value = '';
  
  if (bestProfit > 0) {
    if (currency.value === 'ARS') {
      const canastas = Math.floor(bestProfit / 120000);
      const alquileres = Math.floor(bestProfit / 350000);
      if (alquileres >= 1) equivalencyText.value = `💡 Costo de Oportunidad Real: El rendimiento obtenido equivale a cubrir el costo de ${alquileres} meses de alquiler promedio de un departamento de 2 ambientes en CABA. 🏢`;
      else if (canastas >= 1) equivalencyText.value = `💡 Costo de Oportunidad Real: La ganancia equivale a adquirir ${canastas} Canastas Básicas Alimentarias individuales de referencia. 🛒`;
      else equivalencyText.value = `💡 Costo de Oportunidad Real: El rendimiento es equivalente a comprar ${(bestProfit / 2500).toFixed(0)} unidades de consumo básico. 📦`;
    } else {
      const iphones = Math.floor(bestProfit / 1200);
      const viajes = Math.floor(bestProfit / 1500);
      if (viajes >= 1) equivalencyText.value = `💡 Costo de Oportunidad Real: Este retorno financiero es equivalente a costear ${viajes} viajes de vacaciones de mediano plazo al exterior. ✈️`;
      else if (iphones >= 1) equivalencyText.value = `💡 Costo de Oportunidad Real: El capital ganado equivale al valor de mercado de ${iphones} dispositivos móviles de alta gama (iPhones de referencia). 📱`;
      else equivalencyText.value = `💡 Costo de Oportunidad Real: Representa una ganancia de capital marginal equivalente a ${(bestProfit / 5).toFixed(0)} unidades de café de especialidad. ☕`;
    }
  } else {
    equivalencyText.value = '📉 El capital no ha superado la tasa de inflación en dólares o el costo de financiamiento en el período seleccionado.';
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
  if (activo.simbolo === 'ALQ_YIELD' || activo.simbolo === '^TNX' || activo.simbolo === '^TYX') return `${val.toFixed(2)}%`;
  if (activo.simbolo.startsWith('ALQ_') && activo.simbolo !== 'ALQ_YIELD') return `AR$ ${val.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
  if (activo.categoria === 'Moneda' || activo.simbolo.endsWith('.BA') || activo.nombre.includes('AR$')) return `AR$ ${val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (activo.simbolo.startsWith('M2_')) return `US$ ${val.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
  return `US$ ${val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// --- CONFIGURACIÓN DE API ---
// Usamos localhost automáticamente cuando programas, y Vercel cuando está en la web
const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:5000' : 'https://reporte-financiero-juanurman-6276s-projects.vercel.app';

// Integración con la API Express (Base de Datos)
const livePrices = ref([]);
const selectedCategory = ref(null);
const realEstateTab = ref('m2');
const portfolioChartRef = ref(null);

// --- SECCIÓN COMPARADOR DE INVERSIONES ---
const comparisonChartRef = ref(null);
const userPreference = ref('balanceado');

// Ponderaciones de Seguridad (safety) y Volatilidad/Riesgo (volatility) [1 a 10]
const assetMetrics = {
  realestate: { safety: 10, volatility: 2 },
  bonos:      { safety: 9,  volatility: 1 },
  sp500:      { safety: 8,  volatility: 4 },
  big6:       { safety: 7,  volatility: 5 },
  merval:     { safety: 4,  volatility: 8 },
  cripto:     { safety: 1,  volatility: 10 },
  efectivo:   { safety: 6,  volatility: 2 }
};

const assetDescriptions = {
  realestate: 'Apreciación M2 promedio en CABA + cobro de alquileres en USD.',
  bonos:      'Bono del Tesoro de EE.UU. a 10 años, rendimiento libre de riesgo acumulado.',
  sp500:      'Diversificación pasiva en las 500 corporaciones líderes de EE.UU. (SPY).',
  big6:       'Inversión concentrada en gigantes de tecnología e inteligencia artificial.',
  merval:     'Acciones argentinas líderes valuadas en USD (GGAL, YPF, PAM, BMA).',
  cripto:     'Bitcoin (BTC-USD), activo digital con alta volatilidad y retorno descentralizado.',
  efectivo:   'Dólar billete MEP/CCL en custodia. Pierde valor adquisitivo real por inflación en USD.'
};

const getYearsForPeriod = (period) => {
  if (period === 'ytd') {
    const now = new Date();
    return (now - new Date(now.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24 * 365);
  }
  if (period === '1w') return 7 / 365;
  if (period === '1m') return 1 / 12;
  if (period === '3m') return 3 / 12;
  if (period === '6m') return 6 / 12;
  const num = parseInt(period[0]);
  return period.endsWith('y') ? num : num / 12;
};

const comparisonData = computed(() => {
  if (livePrices.value.length === 0) return [];

  const getVar = (simbolo) => Number(livePrices.value.find(a => a.simbolo === simbolo)?.variaciones[marketPeriod.value] || 0);
  const getAvgVar = (categoria, filterFn = null) => {
    let items = livePrices.value.filter(a => a.categoria === categoria);
    if (filterFn) items = items.filter(filterFn);
    return items.length ? items.reduce((acc, a) => acc + Number(a.variaciones[marketPeriod.value] || 0), 0) / items.length : 0;
  };

  const years = getYearsForPeriod(marketPeriod.value);

  // 1. Real Estate (Ladrillo)
  const m2Appreciation = getAvgVar('Real Estate', a => a.simbolo.startsWith('M2_'));
  const yieldAsset = livePrices.value.find(a => a.simbolo === 'ALQ_YIELD');
  const annualYield = yieldAsset ? Number(yieldAsset.precio) : 4.5;
  const rentAccumulated = annualYield * years;
  const realEstateTotal = m2Appreciation + rentAccumulated;

  // 2. Merval en USD
  const mervalTotal = getAvgVar('Merval');

  // 3. S&P 500
  const sp500Total = getVar('SPY');

  // 4. Big Tech
  const bigTechTotal = getAvgVar('Big Tech');

  // 5. Cripto (Bitcoin)
  const criptoTotal = getVar('BTC-USD');

  // 6. Bonos EE.UU.
  const tnxAsset = livePrices.value.find(a => a.simbolo === '^TNX');
  const tnxYield = tnxAsset ? Number(tnxAsset.precio) : 4.2;
  const bonosTotal = tnxYield * years;

  // 7. Dólar Colchón
  const inflacionUSAnual = 3;
  const efectivoTotal = -inflacionUSAnual * years;

  const rawAssets = [
    { id: 'realestate', name: 'Bienes Raíces (Ladrillo CABA)', emoji: '🏢', returnUSD: realEstateTotal, detail: `Apreciación M2: ${m2Appreciation.toFixed(2)}% | Alquileres: ${rentAccumulated.toFixed(2)}%` },
    { id: 'merval', name: 'Acciones Argentinas (Merval)', emoji: '🇦🇷', returnUSD: mervalTotal, detail: `Promedio consolidado de ADRs argentinos líderes en USD.` },
    { id: 'sp500', name: 'S&P 500 (SPY)', emoji: '📈', returnUSD: sp500Total, detail: `ETF referencial de capitalización bursátil estadounidense.` },
    { id: 'big6', name: 'Big Tech (Tecnológicas)', emoji: '🦅', returnUSD: bigTechTotal, detail: `Índice de empresas de gran escala tecnológica en Wall Street.` },
    { id: 'cripto', name: 'Criptomonedas (Bitcoin)', emoji: '₿', returnUSD: criptoTotal, detail: `Cotización de Bitcoin (BTC) frente al Dólar.` },
    { id: 'bonos', name: 'Bonos del Tesoro EE.UU. (10Y)', emoji: '📜', returnUSD: bonosTotal, detail: `Rendimiento de renta fija libre de riesgo acumulado.` },
    { id: 'efectivo', name: 'Dólar Colchón (Efectivo)', emoji: '💵', returnUSD: efectivoTotal, detail: `Pérdida por inflación estadounidense acumulada.` }
  ];

  return rawAssets.map(asset => {
    const metrics = assetMetrics[asset.id];
    let matchScore = 0;

    if (userPreference.value === 'seguridad') {
      matchScore = 100 - (10 - metrics.safety) * 6 - (metrics.volatility - 1) * 4;
    } else if (userPreference.value === 'rendimiento') {
      matchScore = 100 - (metrics.safety - 1) * 2 - (10 - metrics.volatility) * 6;
    } else {
      const idealSafety = 7;
      const idealVolatility = 4;
      matchScore = 100 - Math.abs(metrics.safety - idealSafety) * 10 - Math.abs(metrics.volatility - idealVolatility) * 8;
    }

    matchScore = Math.max(0, Math.min(100, Math.round(matchScore)));

    return {
      ...asset,
      safety: metrics.safety,
      volatility: metrics.volatility,
      matchScore,
      desc: assetDescriptions[asset.id]
    };
  }).sort((a, b) => b.returnUSD - a.returnUSD);
});

const bestMatchAsset = computed(() => {
  if (comparisonData.value.length === 0) return null;
  return [...comparisonData.value].sort((a, b) => b.matchScore - a.matchScore || b.returnUSD - a.returnUSD)[0];
});

const neighborhoodYields = computed(() => {
  if (livePrices.value.length === 0) return [];

  const mepAsset = livePrices.value.find(a => a.simbolo === 'DOLAR_MEP');
  const mepRate = mepAsset ? Number(mepAsset.precio) : 1480;

  const yields = [];
  const m2Assets = livePrices.value.filter(a => a.simbolo.startsWith('M2_'));

  m2Assets.forEach(m2 => {
    const code = m2.simbolo.replace('M2_', '');
    const alq = livePrices.value.find(a => a.simbolo === `ALQ_${code}`);

    if (alq) {
      const priceM2 = Number(m2.precio);
      const rentARS = Number(alq.precio);
      const propValUSD = priceM2 * 50;
      const rentUSDYear = (rentARS * 12) / mepRate;
      const yieldPercent = (rentUSDYear / propValUSD) * 100;
      const appreciation = Number(m2.variaciones[marketPeriod.value] || 0);
      const rentAccumulated = yieldPercent * getYearsForPeriod(marketPeriod.value);
      const totalReturn = appreciation + rentAccumulated;
      const name = m2.nombre.replace('M2 ', '');

      yields.push({
        name,
        code,
        priceM2,
        rentARS,
        yieldPercent: Number(yieldPercent.toFixed(2)),
        appreciation: Number(appreciation.toFixed(2)),
        totalReturn: Number(totalReturn.toFixed(2))
      });
    }
  });

  return yields;
});

const top3NeighborhoodYields = computed(() => {
  return [...neighborhoodYields.value].sort((a, b) => b.yieldPercent - a.yieldPercent).slice(0, 3);
});

const bottom3NeighborhoodYields = computed(() => {
  return [...neighborhoodYields.value].sort((a, b) => a.yieldPercent - b.yieldPercent).slice(0, 3);
});

const renderComparisonChart = async () => {
  if (!comparisonChartRef.value) return;
  const ChartJS = await loadChartJs();

  const labels = comparisonData.value.map(a => a.emoji + ' ' + a.name.split(' (')[0]);
  const data = comparisonData.value.map(a => a.returnUSD);
  
  const recommendedId = bestMatchAsset.value?.id;
  const backgroundColors = comparisonData.value.map(a => 
    a.id === recommendedId 
      ? 'rgba(99, 102, 241, 0.85)' 
      : 'rgba(51, 65, 85, 0.6)'
  );
  const borderColors = comparisonData.value.map(a => 
    a.id === recommendedId 
      ? 'rgb(99, 102, 241)' 
      : 'rgb(71, 85, 105)'
  );

  if (window.comparisonChartInstance) window.comparisonChartInstance.destroy();
  const ctx = comparisonChartRef.value.getContext('2d');
  
  window.comparisonChartInstance = new ChartJS(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Retorno Total (USD %)',
        data,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1.5,
        borderRadius: 8
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#fff',
          bodyColor: '#e2e8f0',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function(context) {
              return ` Retorno: ${context.parsed.x >= 0 ? '+' : ''}${context.parsed.x.toFixed(2)}% USD`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(51, 65, 85, 0.3)' },
          ticks: {
            color: '#64748b',
            font: { family: 'monospace' },
            callback: function(value) { return value + '%'; }
          }
        },
        y: {
          grid: { display: false },
          ticks: {
            color: '#cbd5e1',
            font: { weight: 'bold' }
          }
        }
      }
    }
  });
};

watch(() => [currentTab.value, marketPeriod.value, userPreference.value, livePrices.value], () => {
  if (currentTab.value === 'comparador') {
    setTimeout(renderComparisonChart, 150);
  }
}, { deep: true });

// Lógica de Bloqueo de Portafolio
const isPortfolioUnlocked = ref(false);
const loginUser = ref('');
const portfolioPassword = ref('');
const portfolioError = ref('');

const unlockPortfolio = async () => {
  // NOTA: Acá validamos contra '1234' para entrar a mirar, la seguridad fuerte está al registrar compras en backend
  
  // Normalizamos el usuario ingresado (quitamos espacios extra y pasamos a mayúsculas)
  const inputUser = loginUser.value.trim().toUpperCase();
  
  if (!inputUser) {
    portfolioError.value = 'Por favor, ingresá un nombre de usuario.';
    return;
  }
  
  // Todos los usuarios consultan a la base de datos de forma segura
  try {
    const res = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: inputUser, password: portfolioPassword.value })
    });
    if (res.ok) {
      currentUser.value = inputUser;
      isPortfolioUnlocked.value = true;
      portfolioError.value = '';
      await fetchPortfolio();
    } else {
      const data = await res.json();
      portfolioError.value = data.error || 'Contraseña incorrecta';
    }
  } catch (e) {
    portfolioError.value = 'Error al conectar con la base de datos de usuarios';
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
const transactionHistory = ref([]);

const fetchPortfolio = async () => {
  try {
    let data = null;
    try {
      const targetUser = currentUser.value;
      const resLocal = await fetch(`${API_BASE_URL}/api/cartera?usuario=${targetUser}`);
      
      if (resLocal.ok) {
        data = await resLocal.json();
      } else {
        console.warn('⚠️ La API de cartera devolvió error:', resLocal.status);
      }
      
      // Consultar el historial individual
      try {
        const resHist = await fetch(`${API_BASE_URL}/api/historial?usuario=${targetUser}`);
        if (resHist.ok) {
          transactionHistory.value = await resHist.json();
        }
      } catch (e) {}

    } catch (e) {
      console.warn('⚠️ Error de red al consultar la API de cartera:', e.message);
    }

    if (!data) {
      if (import.meta.env.DEV) {
        data = []; // En modo local no usamos los respaldos .json
      } else {
        const apiUrl = `${import.meta.env.BASE_URL || '/'}cartera.json?t=${Date.now()}`;
        const response = await fetch(apiUrl);
        if (response.ok) {
          const text = await response.text();
          try { 
            data = JSON.parse(text); 
          } catch (e) { 
            console.warn('⚠️ El respaldo cartera.json devolvió HTML. Asumiendo cartera vacía.'); 
            data = []; 
          }
        }
      }
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
  
  // Forzamos a que las tasas de interés queden siempre primeras en la lista de Bonos
  if (groups['Bonos']) {
    groups['Bonos'].sort((a, b) => {
      const isRateA = a.simbolo === '^TNX' || a.simbolo === '^TYX';
      const isRateB = b.simbolo === '^TNX' || b.simbolo === '^TYX';
      if (isRateA && !isRateB) return -1;
      if (!isRateA && isRateB) return 1;
      return 0;
    });
  }

  return groups;
});

const filteredAssetsForCategory = computed(() => {
  if (!selectedCategory.value) return [];
  const items = groupedAssets.value[selectedCategory.value] || [];
  
  if (selectedCategory.value === 'Real Estate') {
    if (realEstateTab.value === 'm2') {
      return items.filter(a => a.simbolo.startsWith('M2_'));
    } else {
      // Retornamos todos los activos de alquiler y los ADRs (IRS, CRESY), ordenando los barrios en el mismo orden que el M2
      const alqAssets = items.filter(a => !a.simbolo.startsWith('M2_'));
      const m2OrderedTickers = items.filter(a => a.simbolo.startsWith('M2_')).map(a => a.simbolo.replace('M2_', ''));
      
      return alqAssets.sort((a, b) => {
        const isNeighA = a.simbolo.startsWith('ALQ_') && a.simbolo !== 'ALQ_YIELD';
        const isNeighB = b.simbolo.startsWith('ALQ_') && b.simbolo !== 'ALQ_YIELD';
        
        if (isNeighA && isNeighB) {
          const indexA = m2OrderedTickers.indexOf(a.simbolo.replace('ALQ_', ''));
          const indexB = m2OrderedTickers.indexOf(b.simbolo.replace('ALQ_', ''));
          const posA = indexA === -1 ? 999999 : indexA;
          const posB = indexB === -1 ? 999999 : indexB;
          return posA - posB;
        }
        
        // Colocamos los activos que no son de barrios (rendimiento general y acciones) al principio
        if (!isNeighA && isNeighB) return -1;
        if (isNeighA && !isNeighB) return 1;
        return 0;
      });
    }
  }
  
  return items;
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
  if (activo.simbolo === 'ALQ_YIELD' || activo.simbolo === '^TNX' || activo.simbolo === '^TYX') return `${pastPrice.toFixed(2)}%`;
  if (activo.simbolo.startsWith('ALQ_') && activo.simbolo !== 'ALQ_YIELD') return `AR$ ${pastPrice.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
  if (activo.categoria === 'Moneda' || activo.simbolo.endsWith('.BA') || activo.nombre.includes('AR$')) return `AR$ ${pastPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (activo.simbolo.startsWith('M2_')) return `US$ ${pastPrice.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
  return `US$ ${pastPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDisplayDate = (dateString) => {
  if (!dateString) return '';
  // Extrae y devuelve DD/MM/YYYY a prueba de zonas horarias
  const parts = typeof dateString === 'string' ? dateString.split('T')[0].split('-') : new Date(dateString).toISOString().split('T')[0].split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const m2HistoricAveragePrice = computed(() => {
  const items = livePrices.value.filter(a => a.simbolo.startsWith('M2_'));
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
  const items = livePrices.value.filter(a => a.simbolo.startsWith('M2_'));
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

// --- Lógica de la sub-sección de usuarios ---
const userForm = ref({ username: '', password: '' });
const userError = ref('');
const userMessage = ref('');
const isSubmittingUser = ref(false);

const submitUserForm = async () => {
  userError.value = '';
  userMessage.value = '';
  isSubmittingUser.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/api/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...userForm.value, adminPassword: adminLoginPass.value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error de conexión.');
    userMessage.value = data.message;
    userForm.value = { username: '', password: '' };
    await fetchUsers(); // Actualizamos la lista automáticamente al crear uno
  } catch (err) {
    userError.value = err.message === 'Failed to fetch' ? 'No se pudo conectar al servidor local.' : err.message;
  } finally {
    isSubmittingUser.value = false;
  }
};

const usersList = ref([]);

const fetchUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/usuarios?adminPassword=${adminLoginPass.value}`);
    if (response.ok) {
      usersList.value = await response.json();
    }
  } catch (e) {
    console.error('Error al obtener usuarios:', e);
  }
};

const viewUserPortfolio = async (username) => {
  currentUser.value = username;
  isPortfolioUnlocked.value = true;
  currentTab.value = 'cartera';
  await fetchPortfolio();
};

const deleteUser = async (username) => {
  if (!confirm(`¿Eliminar acceso para ${username}? Esto NO borra sus transacciones de la cartera, solo le impide iniciar sesión en el futuro.`)) return;
  try {
    const response = await fetch(`${API_BASE_URL}/api/usuarios/${username}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword: adminLoginPass.value })
    });
    if (response.ok) {
      await fetchUsers(); // Recargamos la lista
    } else {
      alert('Error al eliminar usuario');
    }
  } catch (e) {
    alert('Error de red al intentar eliminar al usuario');
  }
};

const loginAdmin = () => {
  if (adminLoginUser.value === 'admin' && adminLoginPass.value === 'admin') {
    isAdmin.value = true;
    adminLoginError.value = '';
    showAdminLoginModal.value = false;
    fetchUsers(); // Buscamos los usuarios en la BD apenas entra el admin
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

const txForm = ref({ simbolo: '', tipo: 'COMPRA', cantidad: null, precio_compra: null, comisiones: null, fecha: new Date().toISOString().split('T')[0] });
const txError = ref('');
const txMessage = ref('');
const isSubmittingTx = ref(false);
const isFetchingPrice = ref(false);
const editingTxId = ref(null);
let isSettingEditData = false;

const editTx = (tx) => {
  isSettingEditData = true;
  txError.value = '';
  txMessage.value = '';
  const dateString = typeof tx.fecha === 'string' ? tx.fecha.split('T')[0] : new Date(tx.fecha).toISOString().split('T')[0];
  
  txForm.value = {
    simbolo: tx.simbolo,
    tipo: tx.tipo,
    cantidad: Number(tx.cantidad),
    precio_compra: Number(tx.precio_compra),
    comisiones: Number(tx.comisiones),
    fecha: dateString
  };
  editingTxId.value = tx.id;
  
  setTimeout(() => { isSettingEditData = false; }, 100);
  window.scrollTo({ top: document.getElementById('tx-form-section').offsetTop - 20, behavior: 'smooth' });
};

const cancelEdit = () => {
  txForm.value = { simbolo: '', tipo: 'COMPRA', cantidad: null, precio_compra: null, comisiones: null, fecha: new Date().toISOString().split('T')[0] };
  editingTxId.value = null;
  txError.value = '';
  txMessage.value = '';
};

const deleteTx = async (id) => {
  if (!confirm('¿Estás seguro de eliminar esta transacción? Se recalculará tu cartera.')) return;
  try {
    const response = await fetch(`${API_BASE_URL}/api/cartera/${id}`, { method: 'DELETE' });
    if (response.ok) {
      await fetchPortfolio();
    } else {
      alert('Error al eliminar la transacción');
    }
  } catch (e) {
    alert('Error de conexión al eliminar');
  }
};

const submitTxForm = async () => {
  txError.value = '';
  txMessage.value = '';
  isSubmittingTx.value = true;
  try {
    let url = `${API_BASE_URL}/api/cartera`;
    let method = 'POST';
    
    if (editingTxId.value) {
      url = `${API_BASE_URL}/api/cartera/${editingTxId.value}`;
      method = 'PUT';
    }

    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...txForm.value, usuario: currentUser.value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error de conexión.');
    cancelEdit(); // Limpiamos el formulario y mensaje de éxito
    await fetchPortfolio();
  } catch (err) {
    txError.value = err.message === 'Failed to fetch' ? 'No se pudo conectar al servidor local.' : err.message;
  } finally {
    isSubmittingTx.value = false;
  }
};

let priceTimeout = null;
const fetchHistoricalPrice = async () => {
  if (txForm.value.simbolo && txForm.value.fecha) {
    isFetchingPrice.value = true;
    txError.value = ''; // Limpiamos errores previos
    
    // Reiniciamos el temporizador si el usuario sigue escribiendo
    if (priceTimeout) clearTimeout(priceTimeout);
    priceTimeout = setTimeout(async () => {
      try {
        const url = `${API_BASE_URL}/api/historical-price?simbolo=${txForm.value.simbolo}&fecha=${txForm.value.fecha}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
          txForm.value.precio_compra = null; // Dejamos que el usuario ingrese manualmente
        } else {
          txForm.value.precio_compra = Number(data.precio);
        }
      } catch (err) {
        console.error('Error al buscar precio histórico:', err);
        txForm.value.precio_compra = null; // Permitimos ingreso manual si la API falla
      } finally {
        isFetchingPrice.value = false;
      }
    }, 500); // Espera 500ms después de la última tecla pulsada
  }
};

// Watcher para auto-completar el precio
watch(() => [txForm.value.simbolo, txForm.value.fecha], () => {
  if (isSettingEditData) return; // No auto-completar si estamos dándole a "Editar"
  fetchHistoricalPrice();
}, { deep: true });

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
    // Si la API falla, leemos la foto estática (solo en producción)
    if (!data) {
      if (import.meta.env.DEV) {
        data = []; // En local fallamos silenciosamente si el server está apagado
      } else {
        const apiUrl = `${import.meta.env.BASE_URL || '/'}precios.json?t=${Date.now()}`;
        const response = await fetch(apiUrl);
        if (response.ok) {
          const text = await response.text();
          try {
            data = JSON.parse(text);
          } catch (e) {
            console.warn('⚠️ El respaldo precios.json devolvió HTML. Asumiendo vacío.');
            data = [];
          }
        } else {
          data = [];
        }
      }
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