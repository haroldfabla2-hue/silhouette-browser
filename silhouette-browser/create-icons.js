#!/usr/bin/env node

// =============================================================================
// ICON CREATOR - SILHOUETTE BROWSER
// Genera todos los iconos necesarios para la aplicación
// =============================================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎨 Generando iconos de Silhouette Browser...');

// Crear directorios de iconos
const iconDir = 'build/icons';
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
  console.log(`✅ Directorio creado: ${iconDir}`);
}

// SVG base del logo Silhouette Browser
const svgLogo = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2196F3;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#E3F2FD;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="256" cy="256" r="240" fill="url(#bgGradient)" stroke="#2E7D32" stroke-width="8"/>
  
  <!-- Inner shadow -->
  <circle cx="256" cy="256" r="200" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="4"/>
  
  <!-- Silhouette 'S' letter -->
  <g transform="translate(150, 200)">
    <!-- S letter path -->
    <path d="M100,0 C150,-20 200,20 180,50 C160,80 120,70 120,100 C120,130 160,140 200,120 C240,100 280,140 240,180 C200,220 120,220 100,200" 
          fill="url(#textGradient)" 
          stroke="rgba(0,0,0,0.1)" 
          stroke-width="2"/>
    
    <!-- Browser window shape -->
    <rect x="70" y="30" width="200" height="140" 
          fill="rgba(255,255,255,0.9)" 
          stroke="rgba(0,0,0,0.1)" 
          stroke-width="1" 
          rx="8"/>
    
    <!-- Browser tabs -->
    <rect x="80" y="40" width="40" height="25" fill="#FF9800" rx="3"/>
    <rect x="125" y="40" width="40" height="25" fill="#E91E63" rx="3"/>
    <rect x="170" y="40" width="40" height="25" fill="#9C27B0" rx="3"/>
    
    <!-- Browser content area -->
    <rect x="80" y="70" width="140" height="90" fill="#f5f5f5" rx="2"/>
    <rect x="85" y="75" width="130" height="15" fill="#e0e0e0" rx="1"/>
    <rect x="85" y="95" width="100" height="8" fill="#e0e0e0" rx="1"/>
    <rect x="85" y="108" width="80" height="8" fill="#e0e0e0" rx="1"/>
    <rect x="85" y="121" width="120" height="8" fill="#e0e0e0" rx="1"/>
  </g>
  
  <!-- AI/Brain symbol -->
  <g transform="translate(180, 320)">
    <!-- Brain outline -->
    <ellipse cx="0" cy="0" rx="40" ry="30" fill="none" stroke="url(#textGradient)" stroke-width="3"/>
    
    <!-- Neural connections -->
    <circle cx="-15" cy="-10" r="3" fill="url(#textGradient)"/>
    <circle cx="0" cy="-5" r="3" fill="url(#textGradient)"/>
    <circle cx="15" cy="-10" r="3" fill="url(#textGradient)"/>
    <circle cx="-10" cy="10" r="3" fill="url(#textGradient)"/>
    <circle cx="10" cy="15" r="3" fill="url(#textGradient)"/>
    
    <!-- Connections -->
    <line x1="-15" y1="-10" x2="-2" y2="-6" stroke="url(#textGradient)" stroke-width="2"/>
    <line x1="2" y1="-6" x2="15" y2="-10" stroke="url(#textGradient)" stroke-width="2"/>
    <line x1="-2" y1="-6" x2="-8" y2="8" stroke="url(#textGradient)" stroke-width="2"/>
    <line x1="8" y1="12" x2="2" y2="-6" stroke="url(#textGradient)" stroke-width="2"/>
  </g>
  
  <!-- Network nodes -->
  <g transform="translate(400, 200)">
    <circle cx="0" cy="0" r="8" fill="#FF9800"/>
    <circle cx="-20" cy="15" r="6" fill="#E91E63"/>
    <circle cx="15" cy="-15" r="6" fill="#9C27B0"/>
    <line x1="0" y1="0" x2="-15" y2="10" stroke="url(#textGradient)" stroke-width="2"/>
    <line x1="0" y1="0" x2="10" y2="-10" stroke="url(#textGradient)" stroke-width="2"/>
  </g>
</svg>`;

// Guardar SVG
fs.writeFileSync('build/icons/logo.svg', svgLogo);
console.log('✅ Logo SVG creado: build/icons/logo.svg');

// Crear iconos PNG usando ImageMagick (si está disponible)
function createPngIcon(size, filename) {
  const input = 'build/icons/logo.svg';
  const output = `build/icons/${filename}`;
  
  try {
    // Intentar con ImageMagick
    execSync(`convert ${input} -resize ${size}x${size} ${output}`);
    console.log(`✅ Icono PNG creado: ${output} (${size}x${size})`);
    return true;
  } catch (error) {
    // Si ImageMagick no está disponible, crear usando canvas
    try {
      const { createCanvas, loadImage } = require('canvas');
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Simular icono con canvas
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(0, 0, size, size);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${size/4}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('SB', size/2, size/2 + size/8);
      
      fs.writeFileSync(output, canvas.toBuffer('image/png'));
      console.log(`✅ Icono PNG creado: ${output} (${size}x${size}) - usando canvas`);
      return true;
    } catch (canvasError) {
      console.warn(`⚠️ No se pudo crear ${output}: ${error.message}`);
      // Crear placeholder con texto
      createTextIcon(size, output, 'SB');
      return false;
    }
  }
}

// Crear icono de texto como fallback
function createTextIcon(size, filename, text) {
  const canvas = require('canvas');
  const c = canvas.createCanvas(size, size);
  const ctx = c.getContext('2d');
  
  // Fondo con gradiente
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#4CAF50');
  gradient.addColorStop(1, '#2196F3');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Texto central
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${size/4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size/2, size/2);
  
  fs.writeFileSync(filename, c.toBuffer('image/png'));
  console.log(`✅ Icono de texto creado: ${filename} (${size}x${size})`);
}

// Crear diferentes tamaños de iconos
const iconSizes = {
  'icon.png': 512,
  'icon-16.png': 16,
  'icon-32.png': 32,
  'icon-48.png': 48,
  'icon-64.png': 64,
  'icon-128.png': 128,
  'icon-256.png': 256,
  'installer-icon.png': 256,
  'installer-header.png': 400,
  'dmg-icon.png': 256,
  'file-association.png': 64
};

console.log('🎨 Creando iconos PNG...');
for (const [filename, size] of Object.entries(iconSizes)) {
  createPngIcon(size, filename);
}

// Crear iconos ICO para Windows
function createIcoIcon() {
  const sizes = [16, 32, 48, 64, 128, 256];
  const input = 'build/icons/logo.svg';
  const output = 'build/icons/icon.ico';
  
  try {
    // Intentar con ImageMagick
    const sizeArgs = sizes.map(size => `-resize ${size}x${size}`).join(' ');
    execSync(`convert ${input} ${sizeArgs} ${output}`);
    console.log(`✅ Icono ICO creado: ${output}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ No se pudo crear icon.ico: ${error.message}`);
    // Usar el icono PNG más grande como fallback
    const largest = Math.max(...sizes);
    createPngIcon(largest, 'icon-ico-fallback.png');
    return false;
  }
}

createIcoIcon();

// Crear iconos ICNS para macOS
function createIcnsIcon() {
  const input = 'build/icons/logo.svg';
  const output = 'build/icons/icon.icns';
  const iconsetDir = 'build/icons/icon.iconset';
  
  try {
    // Crear directorio iconset
    if (!fs.existsSync(iconsetDir)) {
      fs.mkdirSync(iconsetDir, { recursive: true });
    }
    
    // Crear diferentes tamaños
    const sizes = [
      { size: 16, name: 'icon_16x16.png' },
      { size: 32, name: 'icon_16x16@2x.png' },
      { size: 32, name: 'icon_32x32.png' },
      { size: 64, name: 'icon_32x32@2x.png' },
      { size: 128, name: 'icon_128x128.png' },
      { size: 256, name: 'icon_128x128@2x.png' },
      { size: 256, name: 'icon_256x256.png' },
      { size: 512, name: 'icon_256x256@2x.png' },
      { size: 512, name: 'icon_512x512.png' },
      { size: 1024, name: 'icon_512x512@2x.png' }
    ];
    
    sizes.forEach(({ size, name }) => {
      const outputPath = `${iconsetDir}/${name}`;
      createPngIcon(size, outputPath);
    });
    
    // Crear ICNS
    execSync(`iconutil -c icns ${iconsetDir}`);
    console.log(`✅ Icono ICNS creado: ${output}`);
    
    // Limpiar directorio temporal
    fs.rmSync(iconsetDir, { recursive: true });
    return true;
  } catch (error) {
    console.warn(`⚠️ No se pudo crear icon.icns: ${error.message}`);
    return false;
  }
}

// Detectar si estamos en macOS
if (process.platform === 'darwin') {
  createIcnsIcon();
} else {
  console.log('ℹ️ Saltando creación de ICNS (solo disponible en macOS)');
}

console.log('🎨 Creación de iconos completada!');
console.log('📁 Iconos disponibles en: build/icons/');
console.log('');
console.log('📋 Archivos generados:');
const iconFiles = fs.readdirSync('build/icons');
iconFiles.forEach(file => {
  console.log(`   • ${file}`);
});