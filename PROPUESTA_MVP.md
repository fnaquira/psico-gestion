# Propuesta de MVP: PsicoGestión
## Sistema de Gestión Integral para Consultorios Psicológicos

**Documento de Propuesta Ejecutiva**  
**Fecha:** 30 de Marzo de 2026  
**Versión:** 1.0  


---

## 1. Resumen Ejecutivo

**PsicoGestión** es una solución de software diseñada para optimizar la gestión operativa de consultorios psicológicos, con énfasis especial en la administración de pacientes, agendamiento de citas, control de pagos y seguimiento de deudas. El sistema está diseñado específicamente para profesionales de la psicología que requieren una herramienta intuitiva, rápida y confiable para gestionar su práctica diaria.

El MVP (Producto Mínimo Viable) se enfoca en cuatro módulos principales: **Dashboard**, **Agenda**, **Pacientes** y **Pagos**, proporcionando una interfaz minimalista y profesional que refleja los estándares de diseño en sistemas médicos modernos.

### Problema a Resolver

Los consultorios psicológicos enfrentan desafíos operativos significativos:

- **Gestión de pagos compleja**: Pacientes que pagan al llegar, adelantado o quedan debiendo, sin un sistema centralizado para controlar estos estados
- **Falta de visibilidad de deudas**: Dificultad para identificar rápidamente qué pacientes tienen saldos pendientes
- **Agendamiento manual**: Procesos manuales que consumen tiempo y generan errores
- **Información dispersa**: Datos de pacientes, tutores (para menores) y sesiones sin integración
- **Falta de alertas**: Sin notificaciones sobre citas próximas, deudas pendientes o cambios importantes

### Solución Propuesta

PsicoGestión centraliza toda la información operativa del consultorio en una plataforma web intuitiva que permite a doctores y personal administrativo:

- Registrar y gestionar pacientes (incluyendo menores con tutores)
- Agendar citas con disponibilidad en tiempo real
- Registrar pagos rápidamente (al llegar, adelantado, deuda)
- Visualizar alertas de deudas y citas próximas
- Generar reportes de ingresos y deudas pendientes

---

## 2. Análisis de Mercado y Contexto

### Tendencias en Software Médico

El mercado de software para consultorios ha evolucionado hacia soluciones especializadas que combinan gestión de citas, pagos y datos clínicos en una sola plataforma. Sistemas como **Mindbody**, **TherapyPM** y **Zanda Health** demuestran que existe demanda significativa por herramientas que integren estos módulos.

### Diferenciadores de PsicoGestión

A diferencia de soluciones genéricas, PsicoGestión se diseña específicamente para:

- **Contexto psicológico**: Interfaz diseñada considerando las necesidades específicas de psicólogos
- **Gestión de menores**: Soporte integrado para registrar tutores y responsables legales
- **Simplicidad operativa**: Interfaz minimalista que reduce la curva de aprendizaje
- **Velocidad de uso**: Acciones frecuentes (registrar pago, agendar cita) en máximo 2-3 clics

---

## 3. Arquitectura del MVP

### 3.1 Módulos Principales

El MVP incluye cuatro módulos interconectados que cubren el 80% de las necesidades operativas diarias:

| Módulo | Responsabilidad | Funcionalidades Clave |
|--------|-----------------|----------------------|
| **Dashboard** | Visión general del estado del consultorio | Resumen del día, alertas críticas, estadísticas rápidas, próximas citas |
| **Agenda** | Gestión de citas y disponibilidad | Calendario semanal, asignación de doctores, confirmación de citas, reschedule |
| **Pacientes** | Registro y gestión de información | Búsqueda rápida, información de tutores (menores), historial de sesiones, estado de deuda |
| **Pagos** | Control de transacciones y deudas | Registro rápido al llegar, historial de pagos, reporte de deudas, generación de recibos |

### 3.2 Flujos de Usuario Principales

#### Flujo 1: Paciente Llega al Consultorio
```
1. Admin busca paciente en sistema (búsqueda por nombre/teléfono)
2. Verifica cita programada y datos del paciente
3. Selecciona "Registrar Pago"
4. Ingresa monto, método de pago y tipo (al llegar/adelantado/deuda)
5. Sistema genera recibo y actualiza estado
6. Paciente pasa a consulta
```

**Tiempo estimado:** 1-2 minutos

#### Flujo 2: Agendar Nueva Cita
```
1. Doctor/Admin accede a "Nueva Cita"
2. Busca o crea nuevo paciente
3. Selecciona doctor disponible
4. Elige fecha y hora en calendario
5. Confirma tipo de sesión
6. Sistema genera confirmación
```

**Tiempo estimado:** 2-3 minutos

#### Flujo 3: Gestionar Deuda
```
1. Admin accede a "Pagos" → "Deudas Pendientes"
2. Visualiza lista de pacientes con saldo pendiente
3. Selecciona paciente y registra pago parcial/total
4. Sistema actualiza historial de deuda
5. Genera comprobante
```

**Tiempo estimado:** 1-2 minutos por paciente

#### Flujo 4: Registrar Nuevo Paciente Menor
```
1. Admin selecciona "Nuevo Paciente"
2. Marca como "Menor de edad"
3. Ingresa datos del paciente (nombre, edad, contacto)
4. Ingresa datos del tutor (nombre, relación, contacto)
5. Sistema vincula tutor con paciente
6. Guarda para futuras notificaciones
```

**Tiempo estimado:** 3-4 minutos

### 3.3 Estructura de Datos

La base de datos del MVP incluye las siguientes entidades principales:

**Paciente**: Información demográfica, contacto, estado (activo/inactivo/en deuda), historial de sesiones

**Tutor**: Datos de padres o tutores legales (obligatorio para menores), relación legal, contacto

**Cita**: Fecha, hora, doctor asignado, paciente, tipo de sesión, estado (programada/realizada/cancelada)

**Pago**: Monto, fecha, método, tipo (adelantado/al llegar/deuda), estado, comprobante

**Deuda**: Paciente, saldo pendiente, citas asociadas, estado (activa/parcialmente pagada/resuelta)

---

## 4. Diseño de Interfaz: Filosofía Minimalismo Médico Profesional

### 4.1 Principios de Diseño

El MVP adopta la filosofía de **Minimalismo Médico Profesional**, que combina:

- **Claridad Radical**: Cada elemento tiene propósito específico; nada decorativo
- **Jerarquía Funcional**: Información crítica (deudas, citas próximas) siempre visible
- **Velocidad Operativa**: Acciones frecuentes accesibles en máximo 2 clics
- **Confianza Clínica**: Paleta neutral que transmite profesionalismo y seguridad

### 4.2 Paleta de Colores

| Color | Código | Uso | Significado |
|-------|--------|-----|------------|
| Azul Médico | #1E40AF | Acciones principales, navegación | Confianza, profesionalismo |
| Verde Clínico | #10B981 | Confirmaciones, pagos completados | Éxito, seguridad |
| Rojo Clínico | #DC2626 | Deudas, advertencias | Alerta, acción requerida |
| Gris Oscuro | #1F2937 | Texto principal | Legibilidad máxima |
| Blanco | #FFFFFF | Fondos principales | Claridad |
| Gris Suave | #F5F5F5 | Fondos secundarios | Separación visual |

### 4.3 Tipografía

- **Display**: Poppins Bold 28px (títulos de página)
- **Heading**: Inter SemiBold 18px (títulos de sección)
- **Body**: Inter Regular 14px (texto general)
- **Caption**: Inter Regular 12px (labels y metadata)
- **Mono**: Roboto Mono 12px (números de transacciones)

### 4.4 Componentes Principales

**Sidebar Persistente**: Navegación izquierda (200px) con acceso a Dashboard, Agenda, Pacientes y Pagos

**Tarjetas de Información**: Espaciado generoso (gaps de 24px), información clara y jerarquizada

**Indicadores de Estado**: Puntos de color (verde/rojo/amarillo) para identificar rápidamente estados

**Botones de Acción Rápida**: Botones grandes y claros para operaciones frecuentes

**Tablas de Datos**: Filas alternadas (gris suave) para legibilidad, hover states sutiles

---

## 5. Vistas Principales del MVP

### 5.1 Dashboard

**Propósito**: Proporcionar visión general del estado del consultorio al abrir la aplicación.

**Componentes**:
- Resumen del día (citas programadas, pacientes activos, ingresos del mes, deudas pendientes)
- Alertas críticas (deudas pendientes, citas próximas, pagos adelantados)
- Próximas citas del día con estado de confirmación
- Botones de acción rápida (Nueva Cita, Registrar Pago)

**Información Mostrada**:
- 4 tarjetas de estadísticas principales
- 3-5 alertas contextuales
- Listado de próximas citas con detalles

### 5.2 Agenda

**Propósito**: Gestionar citas y disponibilidad de doctores.

**Componentes**:
- Calendario semanal con grid de horarios
- Columnas por doctor (nombre, especialidad)
- Filas por hora (09:00 - 17:00)
- Citas mostradas como tarjetas coloreadas (confirmada/pendiente)
- Navegación de semanas (anterior/siguiente)

**Interacciones**:
- Hacer clic en horario disponible para crear cita
- Hacer clic en cita existente para editar/cancelar
- Drag-and-drop para reprogramar (v1.1)

### 5.3 Pacientes

**Propósito**: Gestionar información de pacientes y tutores.

**Componentes**:
- Búsqueda rápida (por nombre o teléfono)
- Tabla de pacientes con columnas: nombre, edad, contacto, tutor, estado, deuda, última sesión
- Información de tutor visible para menores (nombre, relación, teléfono)
- Indicadores de estado (Activo/En Deuda)
- Acciones rápidas (Ver, Editar, Eliminar)

**Estadísticas**:
- Total de pacientes activos
- Cantidad de menores de edad
- Cantidad de pacientes en deuda

### 5.4 Pagos

**Propósito**: Registrar transacciones y gestionar deudas.

**Componentes**:
- Tres pestañas: Registro Rápido, Historial, Deudas Pendientes
- **Registro Rápido**: Formulario para registrar pago al llegar (paciente, monto, método, tipo)
- **Historial**: Tabla de transacciones con búsqueda, opción de descargar recibos
- **Deudas**: Tabla de deudas pendientes con opción de registrar pago

**Información Mostrada**:
- Monto total de deudas pendientes
- Cantidad de pacientes en deuda
- Historial de últimas transacciones

---

## 6. Justificación de Decisiones de Diseño

### 6.1 ¿Por qué Minimalismo Médico?

La interfaz minimalista es especialmente apropiada para sistemas médicos porque:

- **Reduce distracciones**: Los doctores necesitan acceso rápido a información crítica sin elementos decorativos
- **Transmite confianza**: El diseño limpio y profesional refuerza la confianza en la plataforma
- **Mejora usabilidad**: Información clara y jerárquica reduce errores operativos
- **Facilita adopción**: Interfaz intuitiva reduce resistencia del usuario final

### 6.2 ¿Por qué Sidebar Izquierdo Persistente?

- **Navegación siempre visible**: El usuario siempre sabe dónde está en la aplicación
- **Patrón conocido**: Usuarios familiares con interfaces de admin/dashboards
- **Espacio eficiente**: Permite contenido principal más amplio (70% de la pantalla)
- **Escalabilidad**: Fácil agregar nuevos módulos sin reorganizar layout

### 6.3 ¿Por qué Tres Pestañas en Pagos?

- **Separación clara de tareas**: Cada pestaña representa un flujo diferente
- **Reduce complejidad**: El usuario no ve toda la información simultáneamente
- **Acceso rápido**: Registro rápido es la pestaña por defecto (80% de los casos)
- **Contexto visual**: Cada pestaña tiene su propia tabla/formulario

### 6.4 ¿Por qué Tabla de Pacientes con Tutor Visible?

- **Cumplimiento legal**: Información de tutores es obligatoria para menores
- **Contacto rápido**: Admin puede contactar tutor sin búsqueda adicional
- **Claridad de relación**: Indicador visual de si paciente es menor o adulto
- **Eficiencia**: Toda la información relevante en una sola vista

---

## 7. Flujo de Implementación

### Fase 1: MVP (Semanas 1-4)

**Entregables**:
- Dashboard con estadísticas y alertas
- Agenda con calendario semanal
- Gestión de pacientes con búsqueda
- Módulo de pagos con registro rápido
- Base de datos con 5 entidades principales
- Autenticación básica (usuario/contraseña)

**Estimación**: 120-160 horas de desarrollo

### Fase 2: Mejoras Iniciales (Semanas 5-8)

**Entregables**:
- Integración con Google Calendar
- Notificaciones por SMS/email
- Portal web para pacientes
- Reportes avanzados (ingresos, deudas por período)
- Exportación de datos (Excel, PDF)

**Estimación**: 80-100 horas de desarrollo

### Fase 3: Expansión (Semanas 9-16)

**Entregables**:
- Integración con sistemas de pago online
- Facturación electrónica
- Telehealth/videoconsultas
- Integración con historiales electrónicos (EHR)
- API para terceros

**Estimación**: 200+ horas de desarrollo

---

## 8. Requisitos Técnicos

### Stack Recomendado

| Componente | Tecnología | Justificación |
|-----------|-----------|--------------|
| Frontend | React 19 + Tailwind CSS | Desarrollo rápido, componentes reutilizables, diseño responsive |
| Backend | Node.js + Express | Escalabilidad, ecosistema robusto, fácil integración |
| Base de Datos | PostgreSQL | Datos relacionales, confiabilidad, soporte para transacciones |
| Autenticación | JWT + OAuth | Seguridad, estándar de la industria |
| Hosting | Cloud (AWS/Azure/GCP) | Escalabilidad, redundancia, backups automáticos |

### Requisitos No Funcionales

- **Seguridad**: Encriptación de datos sensibles (HIPAA compliance para futuro)
- **Disponibilidad**: 99.5% uptime
- **Rendimiento**: Carga de páginas < 2 segundos
- **Escalabilidad**: Soportar 1000+ pacientes sin degradación
- **Backup**: Backup automático diario, recuperación en < 1 hora

---

## 9. Modelo de Negocio

### Opciones de Monetización

| Modelo | Descripción | Ventajas | Desventajas |
|--------|-----------|----------|-----------|
| **SaaS Mensual** | $49-99/mes por consultorio | Ingresos recurrentes predecibles | Resistencia a adopción inicial |
| **SaaS Escalonado** | Básico ($29), Pro ($59), Enterprise ($199) | Captura de diferentes segmentos | Complejidad de gestión |
| **Freemium** | Básico gratis, Pro de pago | Adopción rápida, conversión posterior | Bajo ARPU inicial |
| **Licencia Perpetua** | $500-1000 de pago único | Atractivo para usuarios | Ingresos no recurrentes |

**Recomendación**: Modelo SaaS Mensual ($59/mes) con prueba gratuita de 30 días para balance entre adopción y sostenibilidad.

### Proyección de Ingresos (Año 1)

Asumiendo adopción gradual:

- **Mes 1-3**: 10 consultorios → $590/mes
- **Mes 4-6**: 25 consultorios → $1,475/mes
- **Mes 7-9**: 50 consultorios → $2,950/mes
- **Mes 10-12**: 100 consultorios → $5,900/mes

**Ingreso Total Año 1**: ~$25,000 (conservador)

---

## 10. Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|--------|-----------|
| Baja adopción inicial | Alta | Alto | Prueba gratuita, onboarding personalizado, soporte 24/7 |
| Competencia de soluciones existentes | Alta | Medio | Diferenciación en UX, especialización en psicología |
| Problemas de seguridad de datos | Baja | Crítico | Auditoría de seguridad, cumplimiento HIPAA, encriptación |
| Escalabilidad técnica | Baja | Medio | Arquitectura modular, testing de carga, infraestructura cloud |
| Cambios regulatorios | Media | Medio | Monitoreo de regulaciones, flexibilidad en diseño |

---

## 11. Métricas de Éxito

### KPIs Principales

- **Adopción**: 50 consultorios activos en 6 meses
- **Retención**: 90% de clientes activos después de 3 meses
- **Satisfacción**: NPS > 50
- **Uso**: Promedio 5+ sesiones por usuario por semana
- **Ingresos**: $5,000+ MRR en mes 12

### Métricas de Producto

- **Tiempo de carga**: < 2 segundos en todas las vistas
- **Tasa de error**: < 0.1%
- **Disponibilidad**: 99.5% uptime
- **Tiempo de soporte**: Respuesta en < 2 horas

---

## 12. Conclusión

**PsicoGestión** representa una oportunidad clara para resolver un problema operativo específico en consultorios psicológicos. El MVP propuesto es alcanzable en 4 semanas, cubre el 80% de las necesidades diarias, y proporciona una base sólida para expansión futura.

El diseño minimalista profesional, combinado con flujos de usuario optimizados, garantiza una experiencia intuitiva que reduce la resistencia a la adopción. La arquitectura modular permite agregar funcionalidades avanzadas (telehealth, facturación electrónica, integraciones) sin comprometer la estabilidad del sistema.

Con un modelo de negocio SaaS sostenible y un plan de implementación claro, PsicoGestión tiene potencial para convertirse en la solución estándar para consultorios psicológicos en la región.

---

## Apéndice A: Wireframes y Bocetos

Los bocetos interactivos de las cuatro vistas principales están disponibles en la carpeta `/client/src/components/`:

- **DashboardView.tsx**: Vista principal con estadísticas y alertas
- **AgendaView.tsx**: Calendario semanal de citas
- **PacientesView.tsx**: Listado y gestión de pacientes
- **PagosView.tsx**: Registro de pagos y gestión de deudas

Estos componentes son completamente funcionales y pueden ser navegados en el servidor de desarrollo.

---

## Apéndice B: Estructura de Carpetas del Proyecto

```
psico-gestion-mvp/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   └── Home.tsx (página principal)
│   │   ├── components/
│   │   │   ├── Sidebar.tsx (navegación)
│   │   │   ├── DashboardView.tsx (vista dashboard)
│   │   │   ├── AgendaView.tsx (vista agenda)
│   │   │   ├── PacientesView.tsx (vista pacientes)
│   │   │   └── PagosView.tsx (vista pagos)
│   │   ├── App.tsx (enrutamiento)
│   │   └── index.css (estilos globales)
│   └── index.html
├── ARCHITECTURE.md (documento de arquitectura)
├── ideas.md (propuestas de diseño)
└── PROPUESTA_MVP.md (este documento)
```

---

**Fecha:** 30 de Marzo de 2026
**Versión:** 1.0 - Propuesta Inicial MVP
**Estado:** Listo para Revisión y Aprobación
