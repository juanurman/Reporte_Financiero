import urllib.request
import os

def download_cpi():
    url = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=CPIAUCSL"
    print(f"Descargando datos de IPC de EE.UU. (CPIAUCSL) desde FRED: {url}")
    
    # FRED requiere un User-Agent para evitar errores 403
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            content = response.read().decode('utf-8')
            
        lines = content.strip().split('\n')
        header = lines[0].strip()
        
        filtered_lines = [header]
        count = 0
        
        for line in lines[1:]:
            parts = line.strip().split(',')
            if len(parts) == 2:
                date, val = parts
                # Filtramos desde el 1 de enero de 2021
                if date >= "2021-01-01":
                    # FRED a veces reporta '.' para datos no publicados o errores, filtramos esos
                    if val != ".":
                        filtered_lines.append(f"{date},{val}")
                        count += 1
                        
        output_path = "us_cpi_historical.csv"
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(filtered_lines) + "\n")
            
        print(f"✅ Se guardaron {count} registros mensuales desde 2021 en {os.path.abspath(output_path)}")
        
    except Exception as e:
        print(f"❌ Error al descargar o guardar los datos: {e}")

if __name__ == "__main__":
    download_cpi()
