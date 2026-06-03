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

-- Tabla de transacciones (El historial real de compras/ventas)
CREATE TABLE IF NOT EXISTS cartera (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL,
    simbolo VARCHAR(50) NOT NULL,
    tipo ENUM('COMPRA', 'VENTA') DEFAULT 'COMPRA',
    cantidad DECIMAL(15, 4) NOT NULL, -- Siempre positiva
    precio_compra DECIMAL(15, 4) NOT NULL, -- Precio unitario en USD
    fecha DATE NOT NULL,
    comisiones DECIMAL(15, 4) DEFAULT 0,
    INDEX idx_usuario (usuario)
);

-- Limpiamos los activos locales viejos para reemplazarlos por los ADRs en Wall Street
DELETE FROM activos WHERE simbolo LIKE '%.BA';

-- Inserts iniciales de los activos
INSERT INTO activos (nombre, simbolo, categoria, emoji) VALUES
    ('Dólar Oficial', 'DOLAR_OFICIAL', 'Moneda', '💵'),
    ('Dólar Blue', 'DOLAR_BLUE', 'Moneda', '💵'),
    ('Dólar MEP', 'DOLAR_MEP', 'Moneda', '💵'),
    ('Dólar CCL', 'DOLAR_CCL', 'Moneda', '💵'),
    ('SPDR S&P 500 ETF Trust', 'SPY', 'Wall Street', '📈'),
    ('Apple Inc.', 'AAPL', 'Big Tech', '🍎'),
    ('Alphabet Inc.', 'GOOGL', 'Big Tech', '🔍'),
    ('Microsoft Corporation', 'MSFT', 'Big Tech', '🪟'),
    ('Nvidia Corporation', 'NVDA', 'Big Tech', '🟩'),
    ('Meta Platforms', 'META', 'Big Tech', '🌐'),
    ('Amazon.com Inc.', 'AMZN', 'Big Tech', '📦'),
    ('Micron Technology', 'MU', 'Big Tech', '💾'),
    ('Taiwan Semiconductor', 'TSM', 'Big Tech', '🏭'),
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

-- Datos iniciales de cartera para Diego (Ejemplo)
INSERT INTO cartera (usuario, simbolo, cantidad, precio_compra, fecha) VALUES
    ('Diego', 'GOOGL', 5.88, 167.15, '2025-03-05'),
    ('Diego', 'MSFT', 2.53, 388.64, '2025-03-05'),
    ('Diego', 'TSM', 15.38, 147.08, '2025-04-04'),
    ('Diego', 'MU', 3.20, 394.69, '2026-02-06')
ON DUPLICATE KEY UPDATE cantidad = VALUES(cantidad), precio_compra = VALUES(precio_compra), fecha = VALUES(fecha);
