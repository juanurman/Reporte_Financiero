import time
import csv
from playwright.sync_api import sync_playwright

def scraping_historico_zonaprop():
    URL_LOOKER_STUDIO = "https://datastudio.google.com/u/0/reporting/4c3f2f77-8384-4b7d-995b-5f3317386432/page/Ibx9"
    
    with sync_playwright() as p:
        # IMPORTANTE: headless=False y slow_mo para poder ver qué hace el navegador en tiempo real 
        # y entender por qué falla el click o si está tardando mucho en cargar.
        browser = p.chromium.launch(headless=False, slow_mo=500)
        page = browser.new_page()
        
        print("Conectando con Looker Studio...")
        page.goto(URL_LOOKER_STUDIO, timeout=60000)
        
        # Espera crítica: Looker Studio tarda en renderizar sus componentes internos
        page.wait_for_selector("text=PRECIOS POR BARRIO", timeout=20000)
        time.sleep(5)  # Margen de seguridad para carga de scripts internos
        
        # 1. Identificar y abrir el selector "MES A CONSULTAR"
        # Usamos una búsqueda directa al texto
        selector_meses = page.locator('text="MES A CONSULTAR"').first
        
        if not selector_meses.is_visible():
            print("No se pudo encontrar el selector de meses. Verifica la página.")
            return
            
        # Hacemos scroll hacia el elemento por si estaba escondido
        selector_meses.scroll_into_view_if_needed()
        time.sleep(2)
        
        # Guardaremos todas las filas consolidadas aquí
        datos_historicos = []
        barrios_procesados = set() # Set para evitar duplicados al hacer scroll
        meses_procesados = set() # Para llevar registro de los meses extraídos
        
        print("Iniciando extracción dinámica de TODOS los meses (con auto-scroll)...")
        
        while True:
            try:
                # 1. Aseguramos que el menú de meses esté abierto
                if not page.locator(".item-single").first.is_visible():
                    selector_meses.click(force=True)
                    try:
                        page.wait_for_selector(".item-single", state="visible", timeout=10000)
                    except Exception:
                        print("⚠️ Reintentando abrir el menú...")
                        page.keyboard.press("Escape")
                        time.sleep(1)
                        continue
                    time.sleep(1.5)
                    
                # 2. Revisamos qué meses hay visibles ahora mismo en la pantalla
                opciones_nodos = page.locator(".item-single").all()
                mes_encontrado = False
                nombre_mes = ""
                
                for nodo in opciones_nodos:
                    texto_mes = nodo.inner_text().strip()
                    if texto_mes and texto_mes not in meses_procesados:
                        nombre_mes = texto_mes
                        print(f"[{len(meses_procesados) + 1}] Extrayendo datos de: {nombre_mes}")
                        nodo.scroll_into_view_if_needed()
                        nodo.click()
                        mes_encontrado = True
                        meses_procesados.add(nombre_mes)
                        break  # Rompemos el for para procesar la tabla con este mes
                
                if mes_encontrado:
                    # El click cierra el menú, cerramos por las dudas si sigue abierto
                    if page.locator(".item-single").first.is_visible():
                        page.keyboard.press("Escape")
                        
                    # Esperar a que la tabla se refresque con los datos nuevos
                    time.sleep(4) 
                    
                    # 3. Extraer los datos de la tabla haciendo scroll (Virtual Scrolling)
                    table_body = page.locator('.tableBody').first
                    if table_body.is_visible():
                        # Llevamos el scroll de la tabla arriba del todo por si quedó abajo del mes anterior
                        table_body.evaluate("el => el.scrollTo(0, 0)")
                        time.sleep(1)
                        
                        for _ in range(8):  # 8 iteraciones = ~40-50 barrios
                            filas_tabla = page.locator(".centerColsContainer .row").all()
                            
                            for fila in filas_tabla:
                                celdas = fila.locator(".cell").all_inner_texts()
                                
                                if len(celdas) >= 5:
                                    celdas = [c.strip() for c in celdas]
                                    barrio = celdas[1]
                                    
                                    clave_unica = f"{nombre_mes}_{barrio}"
                                    if clave_unica not in barrios_procesados:
                                        barrios_procesados.add(clave_unica)
                                        datos_historicos.append({
                                            "Periodo": nombre_mes,
                                            "Ranking": celdas[0].replace('.', '').strip(),
                                            "Barrio": barrio,
                                            "Estrenar": celdas[2],
                                            "Pozo": celdas[3],
                                            "Index": celdas[4],
                                            "Usado": celdas[5] if len(celdas) > 5 else ""
                                        })
                            
                            # Bajar el scroll 500px de la TABLA para cargar más barrios
                            table_body.evaluate("el => el.scrollBy(0, 500)")
                            time.sleep(0.5)
                            
                else:
                    # 4. Si no encontramos meses nuevos, SCROLLEAMOS EL MENÚ DE MESES
                    scroller = page.locator(".md-virtual-repeat-scroller").first
                    
                    # Verificamos si llegamos al final
                    is_bottom = scroller.evaluate("(el) => el.scrollTop + el.clientHeight >= el.scrollHeight - 5")
                    
                    if is_bottom:
                        print(f"✅ Se alcanzó el final del historial. Total de meses procesados: {len(meses_procesados)}")
                        break # TERMINAMOS EL BUCLE PRINCIPAL
                        
                    # Bajamos la ruedita en el menú de meses
                    scroller.evaluate("el => el.scrollBy(0, 400)")
                    time.sleep(1)
                    
            except Exception as e:
                print(f"Error en el ciclo principal: {e}")
                page.keyboard.press("Escape")
                time.sleep(2)
                continue
        
        # 4. Volcar toda la lista consolidada en el archivo CSV definitivo
        campos = ["Periodo", "Ranking", "Barrio", "Estrenar", "Pozo", "Index", "Usado"]
        archivo_salida = "zonaprop_index_historico_total.csv"
        
        with open(archivo_salida, mode="w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=campos)
            writer.writeheader()
            writer.writerows(datos_historicos)
            
        print(f"¡Proceso finalizado con éxito! Datos guardados en '{archivo_salida}'")
        browser.close()

if __name__ == "__main__":
    scraping_historico_zonaprop()