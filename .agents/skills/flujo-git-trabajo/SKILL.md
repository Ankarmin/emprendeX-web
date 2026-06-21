---
name: flujo-git-trabajo
description: Flujo de trabajo Git — ramas temporales por módulo, Conventional Commits en español, PR hacia develop, merge directo con squash o aprobación
---

# Flujo de Trabajo Git — Ramas Temporales y Conventional Commits

Flujo completo para trabajar en features individuales: crear rama temporal nombrada por módulo, commits con Conventional Commits en español, push al repositorio, PR hacia `develop`, y merge directo con squash (eliminando la rama remota al finalizar).

---

## Resumen del Flujo

```
main ─────────────────────────────────────────────── (intacta)
  │
  └── develop ───────────────────────────────────── (integración)
         │
         ├── feat/pantalla-recuperar-contrasena ───► PR → develop ✅
         ├── fix/validacion-formulario-cliente ────► PR → develop ✅
         └── feat/dashboard-metricas-ventas ───────► PR → develop ✅
```

1. Crear rama temporal desde `develop` con nombre descriptivo del módulo/sección.
2. Hacer commits usando Conventional Commits con scope y asunto en español.
3. Pushear la rama temporal al repositorio remoto.
4. Crear un PR de la rama temporal hacia `develop`.
5. Hacer merge directo del PR con squash y eliminar la rama remota.

> El merge directo con `--squash --delete-branch` no requiere aprobación previa. GitHub bloquea `gh pr review --approve` en PRs propios, por lo que se usa merge directo como flujo estándar.

> `main` no se modifica en este flujo. La rama de integración es `develop`.

---

## Nomenclatura de Ramas Temporales

Las ramas se nombran con el formato: `<tipo>/<descripcion-en-kebab-case>`

| Prefijo | Tipo de Cambio | Ejemplo |
|---------|---------------|---------|
| `feat/` | Nueva funcionalidad o pantalla | `feat/pantalla-recuperar-contrasena` |
| `fix/` | Corrección de error o bug | `fix/validacion-email-duplicado` |
| `chore/` | Tareas de infraestructura o mantenimiento | `chore/actualizar-dependencias-pnpm` |
| `docs/` | Documentación | `docs/guia-instalacion-entorno` |
| `refactor/` | Refactorización de código | `refactor/extraer-logica-busqueda` |
| `style/` | Cambios de estilo o formato | `style/tema-oscuro-dashboard` |
| `test/` | Adición o modificación de pruebas | `test/unitarios-modulo-clientes` |
| `perf/` | Mejoras de rendimiento | `perf/carga-perezosa-catalogo` |
| `ci/` | Integración continua | `ci/agregar-workflow-linting` |
| `build/` | Sistema de build | `build/configurar-cache-pnpm` |

### Reglas para `<descripcion-en-kebab-case>`

- Siempre en **español**.
- Usar **kebab-case** (minúsculas, guiones para separar palabras).
- Describir el módulo, pantalla o sección que se está modificando.
- Ser conciso pero descriptivo (2 a 5 palabras idealmente).

### Ejemplos por módulo del proyecto

| Rama | Módulo / Sección |
|------|-----------------|
| `feat/auth-registro-google` | Autenticación — registro con Google |
| `feat/negocio-configuracion-inicial` | Negocio — setup onboarding |
| `feat/dashboard-modulos-visibles` | Dashboard — módulos personalizables |
| `feat/clientes-crud-completo` | Clientes — CRUD backend |
| `feat/catalogo-categorias-unidades` | Catálogo — categorías y unidades |
| `feat/cotizaciones-multi-producto` | Cotizaciones — gestión multi-producto |
| `feat/finanzas-pagos-agenda` | Finanzas — pagos y agenda |
| `feat/reportes-metricas-negocio` | Reportes — métricas clave |
| `feat/planes-premium-suscripcion` | Planes — estructura premium |
| `feat/editar-perfil-negocio` | Negocio — edición de perfil |
| `feat/contacto-cliente-acciones` | Clientes — acciones de contacto |
| `chore/infraestructura-monorepo` | Infraestructura base |
| `fix/clientes-email-duplicado` | Bug — email duplicado en clientes |

---

## Conventional Commits en Español

Cada commit sigue el formato del estándar [Conventional Commits](https://www.conventionalcommits.org/) con scope y asunto en **español**:

```
<tipo>(<alcance>): <descripción corta en español>

[cuerpo opcional]

[pie opcional]
```

### Tabla de Tipos (`<tipo>`)

| Tipo | Uso | Ejemplo |
|------|-----|---------|
| `feat` | Nueva funcionalidad | `feat(auth): HU-15 — registro con correo electrónico` |
| `fix` | Corrección de error | `fix(clientes): evitar email duplicado al crear cliente` |
| `chore` | Mantenimiento, dependencias, config | `chore: actualizar pnpm a v9` |
| `docs` | Documentación | `docs(readme): agregar instrucciones de instalación` |
| `style` | Formato, estilos visuales | `style(dashboard): corregir espaciado en tarjetas` |
| `refactor` | Refactorización sin cambiar comportamiento | `refactor(catalogo): extraer lógica de filtro a servicio` |
| `test` | Pruebas | `test(auth): agregar test de login con Google` |
| `perf` | Mejoras de rendimiento | `perf(ventas): optimizar consulta de cotizaciones` |
| `ci` | Integración continua / despliegue | `ci: agregar workflow de linting en PRs` |
| `build` | Sistema de build o dependencias externas | `build: configurar cache de pnpm en CI` |
| `revert` | Revertir un commit anterior | `revert: deshacer feat(auth): registro con Google` |

### Tabla de Alcances (`<alcance>`) — por módulo del proyecto

| Alcance | Módulo / Área | Ejemplo de uso |
|---------|--------------|---------------|
| `auth` | Autenticación y registro | `feat(auth): HU-15, HU-16 — registro con email y Google` |
| `onboarding` | Configuración inicial del negocio | `feat(onboarding): HU-01 — formulario de datos básicos` |
| `dashboard` | Dashboard y navegación | `feat(dashboard): HU-03 — módulos visibles personalizables` |
| `clientes` | Gestión de clientes | `feat(clientes): HU-05 — endpoint POST para crear cliente` |
| `catalogo` | Catálogo de productos/servicios | `feat(catalogo): HU-22 — asignar categorías a productos` |
| `ventas` | Cotizaciones y pedidos | `feat(ventas): HU-09 — crear cotización con múltiples ítems` |
| `finanzas` | Pagos, gastos, agenda | `feat(finanzas): HU-12 — registro de adelantos y saldos` |
| `reportes` | Métricas y reportes | `feat(reportes): HU-17 — endpoint de métricas clave` |
| `planes` | Planes premium y suscripciones | `feat(planes): HU-14 — estructura de entidades de planes` |
| `negocio` | Perfil y edición del negocio | `feat(negocio): HU-20 — endpoint PATCH de perfil` |
| `contacto` | Comunicación con clientes | `feat(contacto): HU-21 — acciones WhatsApp y email` |
| `infra` | Infraestructura, Docker, CI | `chore(infra): agregar Docker Compose para desarrollo` |
| `EM-XX` | Alcance por número de épica | `feat(EM-20): HU-01 — registro básico del negocio` |

### Reglas para la descripción en español

- **Idioma**: Siempre español.
- **Extensión**: Máximo 72 caracteres en la línea de título (tipo + alcance + descripción).
- **Modo imperativo**: "agregar", "corregir", "eliminar", no "agregado" ni "corrige".
- **Referencia a HU**: Cuando aplique, incluir `HU-XX` al inicio de la descripción.
- **Separador**: Usar `—` (em dash) para separar la referencia HU de la descripción.

### Ejemplos completos

```
feat(auth): HU-15, HU-16 — registro con email e inicio de sesión con Google
```

```
fix(clientes): corregir validación de teléfono al crear cliente
```

```
chore(infra): actualizar dependencias del monorepo a pnpm v9
```

```
refactor(catalogo): extraer lógica de búsqueda al servicio de catálogo
```

```
docs(readme): agregar guía de configuración del entorno local
```

```
feat(EM-24): HU-09, HU-10 — crear cotización y convertir a pedido
```

---

## Flujo Paso a Paso

### Paso 1 — Sincronizar develop

Antes de crear la rama temporal, asegurarse de que `develop` local está actualizado:

```bash
git checkout develop
git pull origin develop
```

### Paso 2 — Crear la rama temporal

Crear la rama desde `develop` con el nombre descriptivo:

```bash
git checkout -b feat/pantalla-recuperar-contrasena
```

### Paso 3 — Trabajar y hacer commits

Realizar los cambios y commitear con Conventional Commits en español:

```bash
# Agregar archivos modificados
git add apps/web/app/recuperar-contrasena.tsx

# Commit con formato Conventional Commit en español
git commit -m "feat(auth): HU-27 — pantalla de recuperación de contraseña"
```

**Commits atómicos**: Un commit por cada cambio lógico. Si se tocan múltiples archivos para una misma funcionalidad, un solo commit. Si se corrigen bugs no relacionados, commits separados.

```bash
# Bueno — un commit por cambio lógico
git commit -m "feat(auth): HU-27 — formulario de solicitud de recuperación"
git commit -m "feat(auth): HU-27 — pantalla de confirmación de envío"
git commit -m "feat(auth): HU-27 — endpoint de validación de token"

# Malo — mezclar cambios no relacionados
git commit -m "varios cambios"
```

### Paso 4 — Pushear la rama temporal

```bash
git push -u origin feat/pantalla-recuperar-contrasena
```

### Paso 5 — Crear el Pull Request hacia develop

Usar `gh` CLI para crear el PR:

```bash
gh pr create \
  --base develop \
  --head feat/pantalla-recuperar-contrasena \
  --title "feat(auth): HU-27 — pantalla de recuperación de contraseña" \
  --body "## Qué cambia

Implementa la pantalla de recuperación de contraseña con formulario
de solicitud y pantalla de confirmación de envío de email.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| \`apps/web/app/recuperar-contrasena.tsx\` | Pantalla principal de recuperación |
| \`apps/web/app/recuperar-contrasena/confirmacion.tsx\` | Pantalla de confirmación |
| \`apps/api/src/auth/auth.controller.ts\` | Endpoint POST /auth/forgot-password |

## Historias de usuario

- **HU-27**: Recuperar contraseña mediante email (Finalizada)

## Cómo probar

1. Navegar a la pantalla de login
2. Tocar '¿Olvidaste tu contraseña?'
3. Ingresar email registrado
4. Verificar que aparece la pantalla de confirmación
5. Verificar que el endpoint devuelve 200"
```

### Paso 6 — Hacer merge del PR con squash

El merge se hace directamente con `gh pr merge`, sin necesidad de aprobación previa (GitHub bloquea la auto-aprobación en PRs propios). Se usa `--squash` para mantener un historial limpio en `develop` y `--delete-branch` para eliminar la rama remota automáticamente:

```bash
gh pr merge feat/pantalla-recuperar-contrasena --squash --delete-branch
```

Salida esperada:
```
✓ Merged pull request #XX (feat/pantalla-recuperar-contrasena)
✓ Deleted branch feat/pantalla-recuperar-contrasena
```

> **Nota**: `gh pr merge --squash` aplasta todos los commits de la rama en un solo commit con el título del PR. El mensaje del commit resultante en `develop` será el título del PR.

Opciones de merge:
| Flag | Estrategia | Uso recomendado |
|------|-----------|----------------|
| `--squash` | Squash and merge | **Usar siempre**. Historial limpio: un commit por PR en `develop` |
| `--merge` | Merge commit | Ramas con múltiples commits significativos (poco frecuente) |
| `--rebase` | Rebase and merge | Historial lineal, ramas con pocos commits (poco frecuente) |

---

## Plantilla de Descripción de PR

Usar esta plantilla en el `--body` del PR para mantener consistencia:

```markdown
## Qué cambia

Breve descripción de los cambios introducidos.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| \`ruta/archivo.ts\` | Descripción del cambio |

## Historias de usuario

- **HU-XX**: Nombre de la historia (Estado)

## Cómo probar

1. Paso 1
2. Paso 2

## Checklist

- [ ] El código compila sin errores
- [ ] No hay regresiones en funcionalidad existente
- [ ] Los commits siguen Conventional Commits en español
```

---

## Ejemplo Completo

A continuación, un flujo completo de inicio a fin para la pantalla de recuperación de contraseña:

### 1. Sincronizar e iniciar

```bash
git checkout develop
git pull origin develop
git checkout -b feat/pantalla-recuperar-contrasena
```

### 2. Trabajar y commitear

```bash
# Crear el formulario de recuperación
git add apps/web/app/recuperar-contrasena.tsx
git commit -m "feat(auth): HU-27 — formulario de solicitud de recuperación de contraseña"

# Agregar pantalla de confirmación
git add apps/web/app/recuperar-contrasena/confirmacion.tsx
git commit -m "feat(auth): HU-27 — pantalla de confirmación de envío de email"

# Agregar endpoint en la API
git add apps/api/src/auth/auth.controller.ts apps/api/src/auth/auth.service.ts
git commit -m "feat(auth): HU-27 — endpoint POST /auth/forgot-password"
```

### 3. Pushear

```bash
git push -u origin feat/pantalla-recuperar-contrasena
```

### 4. Crear PR

```bash
gh pr create \
  --base develop \
  --head feat/pantalla-recuperar-contrasena \
  --title "feat(auth): HU-27 — pantalla de recuperación de contraseña" \
  --body "## Qué cambia

Implementa la pantalla de recuperación de contraseña:
- Formulario de solicitud con validación de email
- Pantalla de confirmación de envío
- Endpoint POST /auth/forgot-password en la API

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| \`apps/web/app/recuperar-contrasena.tsx\` | Formulario de solicitud |
| \`apps/web/app/recuperar-contrasena/confirmacion.tsx\` | Pantalla de confirmación |
| \`apps/api/src/auth/auth.controller.ts\` | Endpoint de recuperación |
| \`apps/api/src/auth/auth.service.ts\` | Lógica de generación y envío de token |

## Historias de usuario

- **HU-27**: Recuperar contraseña mediante email (Finalizada)

## Cómo probar

1. Ir a la pantalla de login
2. Tocar '¿Olvidaste tu contraseña?'
3. Ingresar un email registrado y enviar
4. Verificar la pantalla de confirmación
5. Verificar que el endpoint \`POST /auth/forgot-password\` responde 200"
```

### 5. Mergear con squash

```bash
# Hacer merge directo (squash para historial limpio, delete-branch para limpiar la rama remota)
gh pr merge feat/pantalla-recuperar-contrasena --squash --delete-branch
```

### 6. Resultado final

```
$ git log --oneline develop
abc1234 feat(auth): HU-27 — pantalla de recuperación de contraseña (#42)
def5678 feat(dashboard): HU-03 — módulos visibles personalizables (#41)
...
```

---

## Resumen de Comandos Esenciales

| Acción | Comando |
|--------|---------|
| Sincronizar develop | `git checkout develop && git pull origin develop` |
| Crear rama | `git checkout -b <tipo>/<descripcion>` |
| Commit | `git commit -m "tipo(alcance): descripción en español"` |
| Push inicial | `git push -u origin <rama>` |
| Crear PR | `gh pr create --base develop --head <rama> --title "..." --body "..."` |
| Merge PR (squash) | `gh pr merge <rama> --squash --delete-branch` |
| Ver PRs abiertos | `gh pr list --base develop` |
| Ver estado PR | `gh pr view <rama>` |

---

## Verificación Post-Flujo

```bash
# Verificar que develop está actualizado
git checkout develop
git pull origin develop

# Verificar que la rama temporal fue eliminada del remoto
git branch -r | grep feat/pantalla-recuperar-contrasena  # No debe mostrar resultado

# Verificar historial de develop
git log --oneline -5

# Verificar PRs cerrados recientemente
gh pr list --base develop --state merged --limit 5
```

---

## Riesgos y Buenas Prácticas

| Riesgo | Mitigación |
|--------|------------|
| **Rama desactualizada** vs develop | Siempre hacer `git pull origin develop` antes de crear la rama y antes de pushear. |
| **Conflictos al mergear** | Sincronizar develop frecuentemente. Si hay conflictos, resolver localmente con `git merge develop` antes del PR. |
| **Commits sin formato** | Usar hooks de commitlint o recordar la tabla de tipos. Revisar `git log --oneline` antes de pushear. |
| **Ramas huérfanas sin PR** | Eliminar ramas locales ya mergeadas: `git branch -d feat/...` |
| **PR sin descripción** | Usar siempre la plantilla de descripción de PR. Un PR sin descripción clara dificulta la revisión. |

### Buenas prácticas

1. **Una rama = un feature/fix**: No mezclar funcionalidades no relacionadas en la misma rama.
2. **Commits atómicos y descriptivos**: Cada commit debe poder leerse de forma independiente.
3. **Push frecuente**: No acumular muchos commits locales sin pushear.
4. **Revisar antes del PR**: `git diff develop...<rama>` para ver qué se incluirá en el PR.
5. **Eliminar la rama después del merge**: Mantener el repositorio limpio.
