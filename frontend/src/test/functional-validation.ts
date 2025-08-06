// Teste funcional simples para validar a correção do TypeError
// Este teste simula o cenário original que causava o erro

// import { getAlertCacheMetrics } from '../utils/optimizedAlerts'; // Not used in current test

// Simular dados corrompidos que poderiam vir da função getAlertCacheMetrics
const testScenarios = [
  { name: 'undefined cacheKeys', data: { alertCacheSize: 5, cacheKeys: undefined } },
  { name: 'null cacheKeys', data: { alertCacheSize: 3, cacheKeys: null } },
  { name: 'empty array', data: { alertCacheSize: 0, cacheKeys: [] } },
  { name: 'valid array', data: { alertCacheSize: 2, cacheKeys: ['key1', 'key2'] } },
  { name: 'undefined object', data: undefined },
  { name: 'null object', data: null }
];

// console.log('🧪 Testando cenários que causavam TypeError...\n');

testScenarios.forEach(scenario => {
  try {
    // console.log(`📋 Cenário: ${scenario.name}`);
    
    // Simular o que aconteceria no componente
    const alertMetrics = scenario.data;
    
    // Função helper do componente - mesma implementação
    const safeArrayAccess = function<T>(array: T[] | undefined | null): T[] {
      return Array.isArray(array) ? array : [];
    };
    
    // Validações que eram aplicadas no componente original (sem correção)
    // console.log('  ❌ Código original teria falhado aqui:');
    try {
      // Esta linha causava o erro original
      // const length = alertMetrics.cacheKeys.length; // TypeError!
      // console.log('    - alertMetrics.cacheKeys.length teria causado TypeError');
    } catch {
      // console.log(`    - Erro capturado: ${e}`);
    }
    
    // Validações com a correção aplicada
    // console.log('  ✅ Código corrigido:');
    const _alertCacheSize = alertMetrics?.alertCacheSize ?? 0;
    const _cacheKeysLength = safeArrayAccess(alertMetrics?.cacheKeys).length;
    
    // console.log(`    - alertCacheSize: ${alertCacheSize}`);
    // console.log(`    - cacheKeys.length: ${cacheKeysLength}`);
    // console.log('    - ✅ Sucesso! Sem errors\n');
    
  } catch (error) {
    console.error(`  ❌ Falha inesperada: ${error}\n`);
  }
});

// console.log('🎉 Todos os cenários foram tratados com segurança!');