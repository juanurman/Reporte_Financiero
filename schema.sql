-- Creamos la base de datos y la seleccionamos
CREATE DATABASE IF NOT EXISTS finanzas;
USE finanzas;

-- Tabla de activos
CREATE TABLE IF NOT EXISTS activos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    simbolo VARCHAR(50) NOT NULL UNIQUE,
    categoria VARCHAR(50),
    emoji VARCHAR(20)
);

-- Tabla de precios históricos
CREATE TABLE IF NOT EXISTS precios_historicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activo_id INT NOT NULL,
    fecha DATE NOT NULL,
    valor DECIMAL(15, 4) NOT NULL,
    UNIQUE KEY uk_activo_fecha (activo_id, fecha),
    CONSTRAINT fk_activo FOREIGN KEY (activo_id) REFERENCES activos(id) ON DELETE CASCADE
);

-- Limpiamos los activos locales viejos para reemplazarlos por los ADRs en Wall Street
DELETE FROM activos WHERE simbolo LIKE '%.BA';

-- Inserts iniciales de los activos
INSERT INTO activos (nombre, simbolo, categoria, emoji) VALUES
    ('Dólar Oficial', 'DOLAR_OFICIAL', 'Moneda', '💵'),
    ('Dólar Blue', 'DOLAR_BLUE', 'Moneda', '💵'),
    ('Dólar MEP', 'DOLAR_MEP', 'Moneda', '💵'),
    ('Dólar CCL', 'DOLAR_CCL', 'Moneda', '💵'),
    ('SPDR S&P 500 ETF Trust', 'SPY', 'Índice/ETF', '📈'),
    ('Apple Inc.', 'AAPL', 'Wall Street', '🍎'),
    ('Alphabet Inc.', 'GOOGL', 'Wall Street', '🔍'),
    ('Microsoft Corporation', 'MSFT', 'Wall Street', '🪟'),
    ('Nvidia Corporation', 'NVDA', 'Wall Street', '🟩'),
    ('Meta Platforms', 'META', 'Wall Street', '🌐'),
    ('Amazon.com Inc.', 'AMZN', 'Wall Street', '📦'),
    ('YPF S.A. (ADR)', 'YPF', 'Merval', '🛢️'),
    ('Grupo Financiero Galicia (ADR)', 'GGAL', 'Merval', '🏦'),
    ('Pampa Energía (ADR)', 'PAM', 'Merval', '⚡'),
    ('Banco Macro (ADR)', 'BMA', 'Merval', '🏛️'),
    ('IRSA Inmuebles (ADR)', 'IRS', 'Real Estate', '🏢'),
    ('Cresud (ADR)', 'CRESY', 'Real Estate', '🏗️'),
    ('M2 Núñez', 'M2_NUN', 'Real Estate', '📍'),
    ('M2 Belgrano', 'M2_BEL', 'Real Estate', '📍'),
    ('M2 Palermo', 'M2_PAL', 'Real Estate', '📍'),
    ('M2 Recoleta', 'M2_REC', 'Real Estate', '📍'),
    ('Rendimiento Alquiler', 'ALQ_YIELD', 'Real Estate', '🏠')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), categoria = VALUES(categoria), emoji = VALUES(emoji);