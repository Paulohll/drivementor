# IMPORTANTE - ROTACIÓN DE CLAVES DE SEGURIDAD
# ==============================================
# 
# PASO 1: ✅ COMPLETADO
# - Removido claves hardcodeadas del código
# - Configurado variables de entorno en apphosting.yaml
# 
# PASO 2: 🚨 ACCIÓN REQUERIDA URGENTE
# - Ir a Google Cloud Console: https://console.cloud.google.com/apis/credentials?project=citafacil-452323
# - ROTAR la API key: AIzaSyAcY_1pq1pEoYURqkuPJqMWy62CnzkoBUk
# - Actualizar la variable NEXT_PUBLIC_FIREBASE_API_KEY en apphosting.yaml con la NUEVA clave
# 
# PASO 3: 🔒 CONFIGURAR RESTRICCIONES
# - Restricción por HTTP referrer (solo tu dominio)
# - Restricción de APIs (solo Firebase Auth, Firestore, etc.)
# 
# PROCESO DE ACTUALIZACIÓN:
# 1. Rotar clave en Google Cloud Console
# 2. Actualizar apphosting.yaml con nueva clave
# 3. git add . && git commit -m "Update rotated API key" 
# 4. git push origin main
# 5. Verificar despliegue en Firebase App Hosting
# 
# NUNCA volver a commitear claves API directamente en el código fuente.