import fs from 'fs';
const data = JSON.parse(fs.readFileSync('C:/Users/JUAN/Escritorio/Reporte_Financiero/public/precios.json', 'utf8'));

const mep = data.find(a => a.simbolo === 'DOLAR_MEP');
const blue = data.find(a => a.simbolo === 'DOLAR_BLUE');

console.log("MEP variations:", mep ? { simbolo: mep.simbolo, variaciones: mep.variaciones } : "None");
console.log("BLUE variations:", blue ? { simbolo: blue.simbolo, variaciones: blue.variaciones } : "None");
