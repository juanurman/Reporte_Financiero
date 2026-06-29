import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const downloadCPI = () => {
  const url = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=CPIAUCSL";
  console.log(`Descargando datos de IPC de EE.UU. (CPIAUCSL) desde FRED: ${url}`);
  
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  };

  https.get(url, options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const lines = data.trim().split('\n');
        const header = lines[0].trim();
        
        const filteredLines = [header];
        let count = 0;
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          const parts = line.split(',');
          if (parts.length === 2) {
            const [date, val] = parts;
            if (date >= "2021-01-01" && val !== ".") {
              filteredLines.push(line);
              count++;
            }
          }
        }
        
        const outputPath = path.join(__dirname, 'us_cpi_historical.csv');
        fs.writeFileSync(outputPath, filteredLines.join('\n') + '\n', 'utf-8');
        console.log(`✅ Se guardaron ${count} registros mensuales desde 2021 en ${outputPath}`);
      } catch (err) {
        console.error(`❌ Error al procesar los datos: ${err.message}`);
      }
    });
  }).on('error', (err) => {
    console.error(`❌ Error en la descarga: ${err.message}`);
  });
};

downloadCPI();
