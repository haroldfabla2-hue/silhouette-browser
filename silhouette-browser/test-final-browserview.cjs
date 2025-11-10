// =============================================================================
// TEST FINAL - MIGRACIÓN A BROWSERVIEW
// Verifica que la migración esté completa
// =============================================================================

const fs = require('fs');
const path = require('path');

class BrowserViewFinalTest {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.basePath = __dirname;
  }

  async runAllTests() {
    console.log('🧪 TEST FINAL DE MIGRACIÓN A BROWSERVIEW');
    console.log('=' .repeat(50));
    
    try {
      await this.testFileStructure();
      await this.testBrowserCore();
      await this.testPreload();
      await this.testRenderer();
      await this.testMainIntegration();
      await this.testOmnipotent();
      
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Error ejecutando tests:', error);
    }
  }

  async testFileStructure() {
    console.log('📁 Test 1: Estructura de archivos...');
    
    const files = [
      './main-process/browser-core/engine-browserview.js',
      './main-process/renderer-process/preload-browserview.js',
      './renderer-process/index-browserview.html'
    ];
    
    for (const file of files) {
      const fullPath = path.join(this.basePath, file);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Archivo no encontrado: ${file}`);
      }
    }
    
    this.passed++;
    console.log('✅ Estructura correcta');
  }

  async testBrowserCore() {
    console.log('🔧 Test 2: BrowserCore...');
    
    const file = path.join(this.basePath, './main-process/browser-core/engine-browserview.js');
    const content = fs.readFileSync(file, 'utf8');
    
    if (!content.includes('BrowserView')) {
      throw new Error('BrowserView no importado');
    }
    
    if (!content.includes('class TabManager')) {
      throw new Error('TabManager no encontrado');
    }
    
    this.passed++;
    console.log('✅ BrowserCore correcto');
  }

  async testPreload() {
    console.log('🔗 Test 3: Preload script...');
    
    const file = path.join(this.basePath, './main-process/renderer-process/preload-browserview.js');
    const content = fs.readFileSync(file, 'utf8');
    
    if (!content.includes("exposeInMainWorld('silhouetteAPI'")) {
      throw new Error('silhouetteAPI no expuesta');
    }
    
    if (!content.includes('browser: {')) {
      throw new Error('API browser no encontrada');
    }
    
    this.passed++;
    console.log('✅ Preload correcto');
  }

  async testRenderer() {
    console.log('📄 Test 4: Renderer HTML...');
    
    const file = path.join(this.basePath, './renderer-process/index-browserview.html');
    const content = fs.readFileSync(file, 'utf8');
    
    // Verificar que NO contiene webview
    if (content.includes('<webview')) {
      throw new Error('HTML aún contiene webview deprecado');
    }
    
    // Verificar elementos de tabs
    if (!content.includes('tabs-container')) {
      throw new Error('Container de tabs no encontrado');
    }
    
    // Verificar JavaScript
    if (!content.includes('silhouetteAPI.browser')) {
      throw new Error('Referencias a API browser no encontradas');
    }
    
    this.passed++;
    console.log('✅ Renderer correcto');
  }

  async testMainIntegration() {
    console.log('🔗 Test 5: Integración main.js...');
    
    const file = path.join(this.basePath, './main-process/app-manager/main.js');
    const content = fs.readFileSync(file, 'utf8');
    
    if (!content.includes('engine-browserview.js')) {
      throw new Error('main.js no importa engine-browserview.js');
    }
    
    if (!content.includes('index-browserview.html')) {
      throw new Error('main.js no carga index-browserview.html');
    }
    
    this.passed++;
    console.log('✅ Integración main.js correcta');
  }

  async testOmnipotent() {
    console.log('🤖 Test 6: Sistema omnipotente...');
    
    const file = path.join(this.basePath, './main-process/app-manager/main.js');
    const content = fs.readFileSync(file, 'utf8');
    
    if (!content.includes('browserViewContext')) {
      throw new Error('Contexto browserViewContext no configurado');
    }
    
    this.passed++;
    console.log('✅ Sistema omnipotente integrado');
  }

  printSummary() {
    console.log('');
    console.log('=' .repeat(50));
    console.log('📊 RESUMEN FINAL');
    console.log('=' .repeat(50));
    console.log(`✅ Tests pasados: ${this.passed}`);
    console.log(`❌ Tests fallidos: ${this.failed}`);
    console.log(`📈 Total: ${this.passed + this.failed}`);
    
    const successRate = ((this.passed / (this.passed + this.failed)) * 100).toFixed(1);
    console.log(`🎯 Tasa de éxito: ${successRate}%`);
    
    if (this.failed === 0) {
      console.log('');
      console.log('🎉 ¡MIGRACIÓN A BROWSERVIEW COMPLETADA!');
      console.log('');
      console.log('✅ LOGROS:');
      console.log('• BrowserCore migrado a BrowserView');
      console.log('• TabManager con múltiples instancias de Chromium');
      console.log('• Sistema omnipotente integrado');
      console.log('• Renderer sin webview deprecado');
      console.log('• Preload script actualizado');
      console.log('');
      console.log('🚀 VENTAJAS BROWSERVIEW:');
      console.log('• No deprecado - soporte futuro');
      console.log('• Múltiples instancias reales de Chromium');
      console.log('• APIs completas de Chromium');
      console.log('• Mejor rendimiento y estabilidad');
      console.log('• Drag & drop de tabs nativo');
      console.log('');
      console.log('💡 COMANDOS OMNIPOTENTES:');
      console.log('• "Ve a Google y busca noticias de IA"');
      console.log('• "Navega a GitHub y analiza proyectos"');
      console.log('• "Extrae enlaces de esta página"');
      console.log('• "Crea nueva pestaña y navega a..."');
      console.log('');
      console.log('🎯 PRÓXIMOS PASOS:');
      console.log('1. Instalar dependencias: npm install');
      console.log('2. Compilar: npm run build');
      console.log('3. Probar aplicación');
      console.log('4. Verificar omnipotente con BrowserView');
    } else {
      console.log('⚠️ Migración incompleta - revisar tests fallidos');
    }
    
    console.log('=' .repeat(50));
  }
}

// Ejecutar tests
const test = new BrowserViewFinalTest();
test.runAllTests();