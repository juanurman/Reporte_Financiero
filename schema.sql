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
DELETE FROM activos WHERE simbolo = 'TLT'; -- Eliminamos el ETF de bonos anterior
-- Nota: Los inserts iniciales se han movido a seed.sql y se ejecutan condicionalmente en init-db.js
