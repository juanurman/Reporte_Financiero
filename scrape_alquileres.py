import time
import csv
from playwright.sync_api import sync_playwright

def scraping_historico_alquileres():
    URL_LOOKER_STUDIO = "https://datastudio.google.com/u/0/reporting/17f8fee8-1a1e-42e2-b20a-9e9f2350ac28/page/Ibx9"
    
    with sync_playwright() as p:
        # Lanzamos el navegador sin slow_mo para que vaya a máxima velocidad
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        print("Conectando con Looker Studio (Alquileres)...")
        page.goto(URL_LOOKER_STUDIO, timeout=60000)
        
        # Espera a que cargue el título característico de la sección
        print("Esperando renderización de componentes...")
        page.wait_for_selector("text=$/MES 2 AMB", timeout=30000)
        time.sleep(5)  # Margen de seguridad
        
        # Identificar selector de meses
        selector_meses = page.locator('text="MES A CONSULTAR"').first
        
        if not selector_meses.is_visible():
            print("No se pudo encontrar el selector de meses ('MES A CONSULTAR').")
            return
            
        selector_meses.scroll_into_view_if_needed()
        time.sleep(2)
        
        datos_historicos = []
        barrios_procesados = set()
        meses_procesados = set()
        consecutive_scrolls_no_new_month = 0
        consecutive_errors = 0
        
        print("Iniciando extracción dinámica de alquileres...")
        
        try:
            while True:
                try:
                    # Asegurar que el menú de meses esté abierto
                    if not page.locator(".item-single").first.is_visible():
                        selector_meses.click(force=True)
                        try:
                            page.wait_for_selector(".item-single", state="visible", timeout=10000)
                        except Exception:
                            print("⚠️ Reintentando abrir el menú de meses...")
                            page.keyboard.press("Escape")
                            time.sleep(1)
                            continue
                        time.sleep(1.5)
                    
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
                            break
                    
                    if mes_encontrado:
                        consecutive_scrolls_no_new_month = 0
                        consecutive_errors = 0
                        if page.locator(".item-single").first.is_visible():
                            page.keyboard.press("Escape")
                            
                        # Esperar actualización de la tabla (3 segundos es suficiente sin slow_mo)
                        time.sleep(3)
                        
                        # Extraer datos de la tabla con scroll interno
                        table_body = page.locator('.tableBody').first
                        if table_body.is_visible():
                            table_body.evaluate("el => el.scrollTo(0, 0)")
                            time.sleep(0.5)
                            
                            for _ in range(8):  # ~40-50 barrios por mes
                                filas_tabla = page.locator(".centerColsContainer .row").all()
                                
                                for fila in filas_tabla:
                                    celdas = fila.locator(".cell").all_inner_texts()
                                    
                                    # La estructura en alquileres es de 5 columnas:
                                    # [Ranking, Barrio, Estrenar, Index, Usado]
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
                                                "Index": celdas[3],
                                                "Usado": celdas[4] if len(celdas) > 4 else ""
                                            })
                                
                                # Scroll de la tabla
                                table_body.evaluate("el => el.scrollBy(0, 500)")
                                time.sleep(0.3)
                    else:
                        # Scrollear el selector de meses si no hay nuevos a la vista
                        scroller = page.locator(".md-virtual-repeat-scroller").first
                        is_bottom = scroller.evaluate("(el) => el.scrollTop + el.clientHeight >= el.scrollHeight - 5")
                        
                        consecutive_scrolls_no_new_month += 1
                        if is_bottom or consecutive_scrolls_no_new_month >= 8:
                            if is_bottom:
                                print(f"✅ Se alcanzó el final del menú por scroll (bottom). Total meses: {len(meses_procesados)}")
                            else:
                                print(f"⚠️ Se alcanzó el límite de intentos de scroll sin meses nuevos. Asumiendo final de lista. Total meses: {len(meses_procesados)}")
                            break
                            
                        scroller.evaluate("el => el.scrollBy(0, 400)")
                        time.sleep(1)
                        
                except Exception as e:
                    print(f"Error en el ciclo principal: {e}")
                    consecutive_errors += 1
                    if consecutive_errors >= 5:
                        print("⚠️ Demasiados errores consecutivos en el ciclo. Guardando avance...")
                        break
                    page.keyboard.press("Escape")
                    time.sleep(2)
                    continue
        except KeyboardInterrupt:
            print("\n⚠️ Proceso cancelado manualmente por el usuario. Guardando los datos recolectados hasta ahora...")
        
        # Volcar datos a CSV (siempre se ejecuta, incluso si se cancela con Ctrl+C)
        campos = ["Periodo", "Ranking", "Barrio", "Estrenar", "Index", "Usado"]
        archivo_salida = "zonaprop_alquileres_historico_total.csv"
        
        with open(archivo_salida, mode="w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=campos)
            writer.writeheader()
            writer.writerows(datos_historicos)
            
        print(f"¡Proceso finalizado! Datos guardados en '{archivo_salida}'")
        browser.close()

if __name__ == "__main__":
    scraping_historico_alquileres()
