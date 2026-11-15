<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Decisión: el mensaje de WhatsApp en cuatro idiomas (14-nov-2026, 22:15)

**Quién decide:** Cristian: «que el WhatsApp no sea solo para personas [que hablan español], en cualquier idioma». Eligió español, inglés, portugués y francés.

**Qué cambia respecto de `CLAUDE.md`, regla 9:** el mensaje de WhatsApp deja de ser solo en español. La interfaz sigue en inglés.

## Cómo funciona
- La vista del mensaje trae un selector de idioma: **Español, English, Português, Français**.
- Abre en el idioma del teléfono (`navigator.language`) si hay plantilla. Si no la hay, abre en español.
- Cada idioma es una plantilla completa con marcadores. Las cifras (dotación, lámina, hectáreas que alcanzan, plazo) siempre salen de los datos y se formatean con `Intl` en el idioma elegido, con su separador decimal.
- El aviso de juicio local va en los cuatro idiomas.
- Ninguna plantilla dice «first», «only», «best», promete ahorros ni recomienda un cultivo; el validador de lenguaje se aplica en los cuatro.
- El idioma elegido se recuerda en el navegador solo como comodidad. Si no se puede guardar, la página funciona igual.

## Calidad de las traducciones
- Las plantillas en inglés, portugués y francés las escribe la IA a partir de la española. Van rotuladas «machine-drafted; review by a speaker» en el código y en «About & Data» hasta que una persona las revise.
- Las palabras del agua de riego se dejan como se dicen en el distrito («millar», «módulo») y se explican la primera vez.

## Agregar otro idioma
Una plantilla más en el mismo archivo, con las mismas llaves; la prueba revisa que estén todas las llaves y que no haya cifras escritas a mano.
