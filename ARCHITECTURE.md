# Arquitectura del MVP - PsicoGestión

## 1. Visión General

**PsicoGestión** es un sistema de gestión integral para consultorios psicológicos que centraliza la administración de pacientes, agendamiento de citas, control de pagos y seguimiento clínico. El MVP se enfoca en proporcionar una interfaz intuitiva para doctores y personal administrativo, permitiendo gestionar de manera eficiente los diferentes estados de pago (adelantado, al llegar, deuda) y la información de pacientes menores con sus tutores.

## 2. Módulos Principales

### 2.1 Módulo de Pacientes
**Responsabilidad:** Gestionar el registro y datos de todos los pacientes del consultorio.

**Entidades principales:**
- **Paciente**: Información demográfica, contacto, historial clínico básico
- **Tutor/Responsable**: Datos de padres o tutores legales (obligatorio para menores)
- **Historial de Sesiones**: Registro de todas las citas realizadas

**Características clave:**
- Registro diferenciado para menores (requiere tutor) vs. adultos
- Búsqueda rápida por nombre, teléfono o ID
- Visualización de estado general del paciente (activo, inactivo, en deuda)
- Historial de contacto y notas clínicas básicas

### 2.2 Módulo de Agenda/Citas
**Responsabilidad:** Gestionar la programación de citas y disponibilidad de doctores.

**Entidades principales:**
- **Cita**: Fecha, hora, doctor asignado, paciente, tipo de sesión
- **Disponibilidad del Doctor**: Horarios laborales y franjas disponibles
- **Tipo de Sesión**: Consulta inicial, seguimiento, evaluación, etc.

**Características clave:**
- Vista calendario con disponibilidad en tiempo real
- Confirmación automática de citas (SMS/email opcional)
- Reschedule y cancelación con justificación
- Recordatorios de citas próximas
- Integración con Google Calendar (opcional para MVP v2)

### 2.3 Módulo de Pagos
**Responsabilidad:** Registrar y controlar todos los movimientos financieros relacionados con las sesiones.

**Entidades principales:**
- **Pago**: Registro de transacción (monto, fecha, método, estado)
- **Deuda**: Seguimiento de saldos pendientes por paciente
- **Sesión Facturada**: Relación entre sesión y pago

**Estados de pago:**
1. **Adelantado**: Paciente paga antes de la sesión (depósito o prepago)
2. **Al Llegar**: Pago realizado el día de la sesión
3. **Deuda**: Sesión realizada sin pago (seguimiento posterior)

**Características clave:**
- Registro rápido de pagos en punto de venta (al llegar)
- Historial de transacciones por paciente
- Reporte de deudas pendientes
- Métodos de pago: efectivo, transferencia, tarjeta
- Recibos digitales y comprobantes

### 2.4 Módulo de Doctores/Profesionales
**Responsabilidad:** Gestionar información de los profesionales y su disponibilidad.

**Entidades principales:**
- **Doctor**: Nombre, especialidad, cédula profesional, horarios
- **Especialidad**: Psicología clínica, infantil, educativa, etc.

**Características clave:**
- Asignación de citas por especialidad
- Historial de pacientes atendidos
- Estadísticas de sesiones realizadas

## 3. Flujos Principales de Usuario

### 3.1 Flujo: Agendar Nueva Cita
```
1. Doctor/Admin accede a "Nueva Cita"
2. Busca o selecciona paciente (o crea uno nuevo)
3. Selecciona doctor disponible
4. Elige fecha y hora disponible
5. Confirma tipo de sesión
6. Sistema genera confirmación
7. Notificación al paciente (opcional)
```

### 3.2 Flujo: Registrar Pago al Llegar
```
1. Paciente llega al consultorio
2. Admin busca paciente en sistema
3. Verifica cita programada
4. Selecciona "Registrar Pago"
5. Ingresa monto y método de pago
6. Genera recibo
7. Actualiza estado de deuda (si la hay)
```

### 3.3 Flujo: Gestionar Deuda
```
1. Admin accede a "Reportes de Deuda"
2. Visualiza lista de pacientes con saldo pendiente
3. Selecciona paciente
4. Registra pago parcial o total
5. Genera comprobante
6. Actualiza historial de deuda
```

### 3.4 Flujo: Registrar Nuevo Paciente Menor
```
1. Admin selecciona "Nuevo Paciente"
2. Marca como "Menor de edad"
3. Ingresa datos del paciente
4. Ingresa datos del tutor/responsable
5. Registra relación (padre, madre, tutor legal)
6. Guarda contacto del tutor para notificaciones
```

## 4. Estructura de Datos (Esquema Conceptual)

### Paciente
```
{
  id: UUID,
  nombre: string,
  apellido: string,
  fecha_nacimiento: date,
  es_menor: boolean,
  genero: enum (M/F/Otro),
  telefono: string,
  email: string,
  direccion: string,
  notas_clinicas: text,
  estado: enum (activo, inactivo, en_deuda),
  fecha_registro: datetime,
  tutor_id: UUID (si es menor)
}
```

### Tutor
```
{
  id: UUID,
  nombre: string,
  apellido: string,
  relacion: enum (padre, madre, tutor_legal, otro),
  telefono: string,
  email: string,
  documento: string,
  fecha_registro: datetime
}
```

### Cita
```
{
  id: UUID,
  paciente_id: UUID,
  doctor_id: UUID,
  fecha: date,
  hora_inicio: time,
  hora_fin: time,
  tipo_sesion: enum (inicial, seguimiento, evaluacion, otra),
  estado: enum (programada, realizada, cancelada, no_asistio),
  notas: text,
  monto_sesion: decimal,
  fecha_creacion: datetime
}
```

### Pago
```
{
  id: UUID,
  cita_id: UUID,
  paciente_id: UUID,
  monto: decimal,
  fecha_pago: datetime,
  metodo: enum (efectivo, transferencia, tarjeta),
  estado: enum (pendiente, completado, cancelado),
  tipo_pago: enum (adelantado, al_llegar, deuda),
  comprobante: string (URL o referencia),
  notas: text
}
```

### Deuda
```
{
  id: UUID,
  paciente_id: UUID,
  saldo_pendiente: decimal,
  fecha_inicio: date,
  ultima_actualizacion: datetime,
  citas_pendientes: array (cita_ids),
  estado: enum (activa, parcialmente_pagada, resuelta)
}
```

## 5. Vistas Principales de la Interfaz

### 5.1 Dashboard Principal
- **Resumen del día**: Citas programadas, pacientes que llegan
- **Alertas**: Deudas pendientes, citas sin confirmar
- **Estadísticas rápidas**: Total de pacientes, sesiones del mes, ingresos

### 5.2 Vista de Agenda
- Calendario semanal/mensual
- Disponibilidad de doctores
- Drag-and-drop para reprogramar citas
- Filtros por doctor, especialidad, tipo de sesión

### 5.3 Vista de Pacientes
- Listado con búsqueda rápida
- Ficha individual con historial completo
- Información de tutor (si aplica)
- Historial de pagos y deudas

### 5.4 Vista de Pagos
- Registro rápido de pago al llegar
- Historial de transacciones
- Reporte de deudas
- Generación de recibos

### 5.5 Vista de Reportes
- Ingresos mensuales/anuales
- Deudas pendientes por paciente
- Sesiones realizadas vs. programadas
- Análisis de especialidades más demandadas

## 6. Consideraciones de Diseño de UX

### Principios de Diseño
1. **Simplicidad**: Interfaz limpia, enfocada en tareas principales
2. **Velocidad**: Acciones frecuentes deben ser 2-3 clics máximo
3. **Claridad**: Información organizada jerárquicamente
4. **Accesibilidad**: Diseño responsive, legible en tablets (uso en consultorio)
5. **Seguridad**: Datos sensibles protegidos, confirmaciones para acciones críticas

### Flujo de Trabajo Típico
El doctor/admin llega al consultorio y necesita:
1. Ver citas del día (vista rápida)
2. Registrar pago cuando llega paciente (1-2 clics)
3. Acceder a historial del paciente si es necesario
4. Agendar nueva cita (búsqueda rápida + calendario)

## 7. Próximas Fases (Post-MVP)

- **v1.1**: Integración con Google Calendar, SMS/email automático
- **v1.2**: Portal web para pacientes (ver citas, descargar recibos)
- **v1.3**: Reportes avanzados, análisis de datos
- **v2.0**: Integración con sistemas de pago online, facturación electrónica
- **v2.1**: Telehealth/videoconsultas
- **v3.0**: Integración con historiales electrónicos (EHR)

---

**Fecha:** 30 de Marzo de 2026
**Versión:** 1.0 - Arquitectura Inicial MVP
