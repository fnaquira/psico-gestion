# Propuestas de Diseño - PsicoGestión MVP

## Respuesta 1: Minimalismo Médico Profesional (Probabilidad: 0.08)

### Design Movement
**Minimalismo Escandinavo + Diseño Médico Contemporáneo**

### Core Principles
1. **Claridad Radical**: Cada elemento tiene un propósito específico; nada decorativo
2. **Jerarquía Funcional**: Información crítica (deudas, citas próximas) siempre visible
3. **Velocidad Operativa**: Acciones frecuentes accesibles en máximo 2 clics
4. **Confianza Clínica**: Paleta neutral que transmite profesionalismo y seguridad

### Color Philosophy
- **Fondo**: Blanco puro (#FFFFFF) con grises muy suaves (#F5F5F5) para secciones
- **Primario**: Azul médico profundo (#1E40AF) para acciones críticas
- **Secundario**: Verde clínico (#10B981) para confirmaciones y pagos completados
- **Alerta**: Rojo clínico (#DC2626) para deudas y advertencias
- **Texto**: Gris oscuro (#1F2937) para máxima legibilidad
- **Razonamiento**: Colores asociados con entornos médicos reales; confianza y claridad sin distracciones

### Layout Paradigm
- **Sidebar izquierdo persistente** (200px) con navegación principal
- **Contenido principal** con grid de 12 columnas
- **Tarjetas de información** con espaciado generoso (gaps de 24px)
- **Tablas de datos** con filas alternadas (gris muy suave) para legibilidad
- **Topbar** con usuario, hora actual y alertas críticas

### Signature Elements
1. **Indicadores de estado visuales**: Puntos de color (verde/rojo/amarillo) junto a nombres de pacientes
2. **Tarjetas de "Acción Rápida"**: Botones grandes y claros para "Registrar Pago", "Nueva Cita"
3. **Badges informativos**: Pequeños tags para estado de paciente (En Deuda, Adelantado, Activo)

### Interaction Philosophy
- **Confirmaciones explícitas**: Diálogos modales para acciones que afecten datos (pago, cancelación)
- **Feedback inmediato**: Toast notifications en la esquina superior derecha
- **Hover states sutiles**: Cambio de fondo (gris #F0F0F0) sin cambio de color de texto
- **Transiciones rápidas**: 200ms para cambios de vista

### Animation
- **Entrada de modales**: Fade in + slide down suave (300ms)
- **Cambio de vistas**: Cross-fade (200ms)
- **Hover en botones**: Cambio de sombra (sin escala)
- **Carga de datos**: Skeleton screens grises en lugar de spinners

### Typography System
- **Display**: Poppins Bold 28px para títulos de página
- **Heading**: Inter SemiBold 18px para títulos de sección
- **Body**: Inter Regular 14px para texto general
- **Caption**: Inter Regular 12px para labels y metadata
- **Mono**: Roboto Mono 12px para números de transacciones

---

## Respuesta 2: Diseño Humanista Cálido (Probabilidad: 0.07)

### Design Movement
**Diseño Humanista + Psicología del Color Cálido**

### Core Principles
1. **Empatía Visual**: Colores cálidos que transmiten cuidado y seguridad
2. **Accesibilidad Emocional**: Interfaz que se sienta amigable, no intimidante
3. **Contexto Psicológico**: Reconocer que se trata de un consultorio de salud mental
4. **Fluidez Natural**: Transiciones suaves, sin cambios abruptos

### Color Philosophy
- **Fondo**: Crema cálida (#FFFBF5) con toques de beige (#F9F3ED)
- **Primario**: Terracota cálida (#C85A3A) para acciones principales
- **Secundario**: Verde salvia (#6B8E71) para confirmaciones
- **Acento**: Naranja suave (#E8956F) para destacados
- **Texto**: Marrón oscuro (#3E2723) para calidez
- **Razonamiento**: Paleta inspirada en espacios de terapia real; colores que reducen ansiedad

### Layout Paradigm
- **Diseño asimétrico**: Sidebar derecho (no izquierdo) con 240px
- **Contenido fluido**: No usa grid rígido; márgenes generosos y breathing room
- **Tarjetas redondeadas**: Border-radius de 16px para suavidad
- **Espaciado orgánico**: Gaps de 20px, 32px (números no estándar)

### Signature Elements
1. **Ilustraciones suaves**: Iconos con líneas redondeadas (no sharp)
2. **Gradientes sutiles**: Fondos con gradientes suaves (beige → crema)
3. **Separadores orgánicos**: Líneas curvas en lugar de rectas

### Interaction Philosophy
- **Microinteracciones delicadas**: Botones que se expanden ligeramente al hover
- **Confirmaciones amigables**: Mensajes con lenguaje empático
- **Sin presión visual**: Acciones secundarias de bajo contraste
- **Animaciones relajantes**: Transiciones de 400-500ms

### Animation
- **Entrada de elementos**: Fade in + scale up suave (400ms)
- **Hover en tarjetas**: Elevación sutil (shadow increase)
- **Transiciones de página**: Dissolve suave (300ms)
- **Indicadores de progreso**: Barras con relleno gradual y suave

### Typography System
- **Display**: Playfair Display Bold 32px para títulos
- **Heading**: Lora SemiBold 20px para secciones
- **Body**: Lora Regular 15px para texto general
- **Caption**: Lora Regular 13px para metadata
- **Mono**: IBM Plex Mono 13px para datos

---

## Respuesta 3: Diseño Moderno Dinámico (Probabilidad: 0.06)

### Design Movement
**Diseño Moderno Contemporáneo + Energía Controlada**

### Core Principles
1. **Dinamismo Contenido**: Movimiento y energía sin caos
2. **Contraste Estratégico**: Áreas de alto contraste para acciones, áreas neutras para contexto
3. **Modernidad Accesible**: Tendencias actuales pero manteniendo usabilidad
4. **Eficiencia Visual**: Información densa pero bien organizada

### Color Philosophy
- **Fondo**: Gris oscuro (#0F172A) con variaciones (#1E293B)
- **Primario**: Violeta vibrante (#A78BFA) para acciones
- **Secundario**: Cyan (#06B6D4) para confirmaciones
- **Acento**: Rosa coral (#F472B6) para destacados
- **Texto**: Blanco (#F8FAFC) para contraste
- **Razonamiento**: Tema oscuro moderno; reduce fatiga en uso prolongado, transmite tecnología

### Layout Paradigm
- **Grid asimétrico**: Combinación de columnas de 4, 6, 8 unidades
- **Contenedor central**: Max-width 1400px con padding dinámico
- **Tarjetas con bordes**: Border de 1px en color primario
- **Glassmorphism sutil**: Fondos semi-transparentes con backdrop blur

### Signature Elements
1. **Gradientes direccionales**: Gradientes de violeta a cyan en elementos clave
2. **Bordes animados**: Bordes que cambian de color al interactuar
3. **Iconografía moderna**: Iconos con peso variable (thin a bold)

### Interaction Philosophy
- **Retroalimentación inmediata**: Cambios visuales al interactuar
- **Estados claros**: Hover, active, focus todos diferenciados
- **Animaciones fluidas**: Transiciones con easing personalizado
- **Feedback sonoro opcional**: Sonidos suaves para confirmaciones

### Animation
- **Entrada de modales**: Zoom in + fade (350ms, easing: cubic-bezier)
- **Cambio de vistas**: Slide + fade (300ms)
- **Hover en elementos**: Scale 1.05 + shadow glow (200ms)
- **Indicadores de carga**: Spinner con rotación suave + pulsación

### Typography System
- **Display**: Space Grotesk Bold 36px para títulos
- **Heading**: Space Grotesk SemiBold 22px para secciones
- **Body**: Outfit Regular 15px para texto general
- **Caption**: Outfit Regular 13px para metadata
- **Mono**: JetBrains Mono 12px para datos técnicos

---

## Decisión Final: Minimalismo Médico Profesional

Se selecciona **Respuesta 1 (Minimalismo Médico Profesional)** como el enfoque de diseño para el MVP de PsicoGestión.

### Justificación
1. **Contexto Clínico**: Un consultorio psicológico requiere transmitir profesionalismo y confianza
2. **Velocidad de Uso**: Los doctores necesitan acceder a información rápidamente; el minimalismo favorece esto
3. **Escalabilidad**: Fácil de extender con nuevos módulos sin perder coherencia visual
4. **Accesibilidad**: Paleta de alto contraste y tipografía clara benefician a usuarios de todas las edades
5. **Adopción**: Interfaces médicas conocidas reducen la curva de aprendizaje

### Aplicación en el Proyecto
- Todos los componentes seguirán la paleta: Azul (#1E40AF), Verde (#10B981), Rojo (#DC2626)
- Sidebar persistente izquierdo para navegación
- Tarjetas de acción rápida para operaciones frecuentes
- Confirmaciones explícitas para acciones críticas
- Tipografía Poppins + Inter para jerarquía clara
