# TRANSPORTE EXPRESO 38 SRL — Sitio Web Corporativo B2B

Sitio web corporativo B2B con identidad visual inspirada en el ploteo real de las unidades Volvo FH de **Transporte Expreso 38 S.R.L.**, cartografía interactiva de rutas nacionales/Mercosur y galería multimedia oficial.

## Estructura del Proyecto

- `index.html` — Página principal completa:
  - **Identidad Corporativa Real**: Logotipo vectorial (`TRANSPORTE EXPRESO 38 SRL`) diseñado a imagen del ploteo lateral de los camiones Volvo FH.
  - **Hero & Nosotros**: Fotografías y vista previa en video de la flota real operando en playón, ruta y cordillera nevada.
  - **Selector Interactivo de Flota Real (`#flota`)**: Visualizador interactivo con unidades Volvo FH 420/460, semirremolques loneros, baranda volcable Cormetal 3 ejes y cisterna homologada de 38.000 litros.
  - **Mapa Geográfico Interactivo (`#cobertura`)**: Proyección cartográfica de Argentina y países limítrofes con 6 corredores viales (`RN 3`, `RN 7`, `RN 9`, `RN 14`, `RN 22`, `RN 34`, `RN 40`), animación de flujo GPS, inspector HUD y pre-carga directa al cotizador.
  - **Galería Multimedia & Reels (`#galeria`)**: Integración completa de las 7 fotografías y los 2 videos `.mp4` de `./Instagram/`, filtros por categoría, controles de audio y visor Lightbox a pantalla completa.
- `css/styles.css` — Estilos personalizados, animaciones de flujo vial, pulsos de radar en bases operativas y transiciones de galería.
- `js/main.js` — Lógica del panel lateral, selector de flota, mapa interactivo bidireccional, filtros multimedia, visor Lightbox (fotos + videos con audio) y cotizador B2B con enlace directo a WhatsApp.
- `assets/logo-expreso38.svg` y `assets/favicon-38.svg` — Logotipo e isotipo vectoriales estilo ploteo oficial de cabina.
- `Instagram/` — Fotografías y videos reales de las unidades de Expreso 38 SRL.
- `server.js` — Servidor local Node.js con soporte para `.webp`, `.mp4` y streaming `HTTP Range (206 Partial Content)`.

## Cómo ejecutar localmente

```powershell
node server.js
```

Luego abre `http://localhost:8080` en tu navegador.
"# ff" 
