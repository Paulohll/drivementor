// Test específico para el problema reportado
console.log('🔍 DEBUGGING PROBLEMA ESPECÍFICO');
console.log('=====================================');

const formatTime = (seconds) => {
  console.log('Input:', seconds, 'Tipo:', typeof seconds);
  
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours < 24) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
};

// Casos del problema reportado
console.log('\n📊 CASOS DE PRUEBA:');
console.log('144 segundos →', formatTime(144));
console.log('14 segundos →', formatTime(14));

// ¿Podría ser división por 10?
console.log('\n🔍 POSIBLES CAUSAS:');
console.log('144 / 10 =', 144 / 10, '→', formatTime(144 / 10));
console.log('Math.floor(144 / 10) =', Math.floor(144 / 10), '→', formatTime(Math.floor(144 / 10)));

// ¿Podría ser un string mal parseado?
console.log('\n🔤 PRUEBAS CON STRINGS:');
console.log('"144".substring(0,2) =', "144".substring(0,2), '→', formatTime(parseInt("144".substring(0,2))));
console.log('parseFloat("14.4") =', parseFloat("14.4"), '→', formatTime(parseFloat("14.4")));

// ¿Podría ser conversión de milisegundos?
console.log('\n⏱️ PRUEBAS CON TIEMPO:');
console.log('144000 ms / 1000 =', 144000 / 1000, '→', formatTime(144000 / 1000));
console.log('14400 ms / 1000 =', 14400 / 1000, '→', formatTime(14400 / 1000));