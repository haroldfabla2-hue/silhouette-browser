/**
 * OMNIPOTENT DEMO
 * Demo de funcionamiento del sistema omnipotente
 */

import SilhouetteOmnipotentAPI from './api/omnipotent-api.js';

class OmnipotentDemo {
    constructor() {
        this.api = new SilhouetteOmnipotentAPI();
    }

    async runDemo() {
        console.log('🎮 INICIANDO DEMO DEL SISTEMA OMNIPOTENTE');
        console.log('==========================================');
        
        try {
            // 1. Inicializar API
            await this.api.initialize();
            console.log('✅ API inicializada');
            
            // 2. Test de conexión
            const connection = await this.api.testConnection();
            console.log('🔌 Conexión:', connection.connected ? 'Exitosa' : 'Falló');
            
            // 3. Ejecutar comandos de demo
            await this.runDemoCommands();
            
            // 4. Mostrar estado final
            await this.showFinalStatus();
            
        } catch (error) {
            console.error('❌ Error en demo:', error.message);
        }
    }

    async runDemoCommands() {
        console.log('\n🚀 Ejecutando comandos de demo...');
        
        const commands = [
            {
                name: 'Navegación Autónoma',
                command: 'Ve a GitHub y busca proyectos de React trending',
                method: () => this.api.autonomousNavigation('https://github.com', 'buscar proyectos de React')
            },
            {
                name: 'Extracción de Datos',
                command: 'Extrae datos de elementos con clase .price',
                method: () => this.api.extractData('.price', 'structured')
            },
            {
                name: 'Llenado de Formularios',
                command: 'Llena formulario de contacto',
                method: () => this.api.fillForm({
                    email: 'usuario@ejemplo.com',
                    name: 'Usuario Demo'
                })
            }
        ];
        
        for (const cmd of commands) {
            console.log(`\n🔹 Ejecutando: ${cmd.name}`);
            console.log(`   Comando: "${cmd.command}"`);
            
            try {
                const startTime = Date.now();
                const result = await cmd.method();
                const duration = Date.now() - startTime;
                
                if (result.success) {
                    console.log(`   ✅ Éxito en ${duration}ms`);
                    console.log(`   📊 Pasos completados: ${result.stepsCompleted}`);
                } else {
                    console.log(`   ❌ Falló: ${result.error || result.reason}`);
                }
            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
            }
        }
    }

    async showFinalStatus() {
        console.log('\n📊 Estado Final del Sistema:');
        console.log('============================');
        
        const status = await this.api.getStatus();
        
        console.log(`Inicializado: ${status.initialized ? '✅ Sí' : '❌ No'}`);
        console.log(`Playwright Engine: ${status.availableEngines?.playwright ? '✅ Activo' : '❌ Inactivo'}`);
        console.log(`Snowfort Engine: ${status.availableEngines?.snowfort ? '✅ Activo' : '❌ Inactivo'}`);
        console.log(`Tareas ejecutadas: ${status.executionHistory?.length || 0}`);
        
        console.log('\n🎉 DEMO COMPLETADO');
        console.log('El sistema omnipotente está funcionando correctamente.');
    }
}

// Ejecutar demo
const demo = new OmnipotentDemo();
demo.runDemo();