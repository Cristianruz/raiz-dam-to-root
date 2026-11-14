<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Agentes del proyecto (`.claude/agents/`)

Este archivo **no es un agente**: no lleva frontmatter. Documenta el origen, la licencia y los riesgos de cada agente. Claude Code solo carga como agentes los `.md` con `name` y `description` en el frontmatter.

**Por qué el origen y la licencia no van dentro de los agentes copiados:** el frontmatter tiene que empezar en la línea 1 del archivo. Un comentario antes del `---` lo rompe, y uno después pasaría a formar parte de las instrucciones del agente. Para que las copias queden idénticas al original (mismo sha256), el origen y la licencia se documentan aquí.

## Agentes copiados (sin modificar)

Origen: [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official), commit `b5b01ac4f889fec0c4c6bb89f27ca7c8574473f6` (2026-11-14), clonado con `git clone --depth 1` el 14-nov-2026. Licencia: **Apache-2.0**; el texto completo está al final de este archivo y es idéntico al `LICENSE` de la raíz del repo y de cada plugin.

| Agente | Ruta en el origen | sha256 | Herramientas (frontmatter) | Para qué en Raíz | Riesgos y notas |
|---|---|---|---|---|---|
| `code-reviewer` | `plugins/feature-dev/agents/code-reviewer.md` | `a7df173bf77a00da5584c6401a1061524fdbe477b6fef5dd496d4c7a9113c78c` | Glob, Grep, LS, Read, NotebookRead, WebFetch, TodoWrite, WebSearch, KillShell, BashOutput (`model: sonnet`) | Revisor de calidad y de errores en la revisión de cada pieza y en la final. Contrasta con `CLAUDE.md` y reporta solo hallazgos con confianza ≥ 80 | Se eligió la versión de feature-dev porque su lista de herramientas **no incluye Edit, Write ni Bash**. Sin Bash no puede correr `git diff`: hay que pasarle el diff o la lista de archivos (`docs/prompts/revisor.md` lo hace). Tiene WebFetch y WebSearch: no le pase datos privados del equipo |
| `silent-failure-hunter` | `plugins/pr-review-toolkit/agents/silent-failure-hunter.md` | `fa9b0daec5a267e7e66435cc48b3328301fc9f70c3af259fe248881327a1babc` | No declara `tools`: **hereda todas**, incluidas Edit, Write y Bash (`model: inherit`) | Fallas silenciosas: `try/except` que tragan errores, el ensamblador que «corrige» en silencio (K-ENS lo prohíbe) y valores por omisión que ocultan un dato faltante (regla 2: null y aviso) | Se invoca siempre con la instrucción «solo lectura; no modifique archivos». Menciona funciones del proyecto de origen (`logError`, `logForDebugging`, `constants/errorIds.ts` y Sentry) que **no existen en Raíz**: esas partes se ignoran. Su `description` no es YAML estricto (hay «: » dentro de un texto sin comillas). Se probó con un lector tolerante y da `name` y `description` válidos. Si `/agents` no lo muestra, esa es la causa |
| `pr-test-analyzer` | `plugins/pr-review-toolkit/agents/pr-test-analyzer.md` | `fcb1cde9ba7b21694b508766a8d6a79bc91bed9982f828f816210059934f46b4` | No declara `tools`: **hereda todas** (`model: inherit`) | Huecos de pruebas: K-TEST, `web/reglas.js` (§2.4), el balance de La gota y el verificador de C3 | Se invoca con «solo lectura». Califica cada prueba sugerida de 1 a 10; en el protocolo, las de 8 a 10 cuentan como IMPORTANTE |

## Agentes propios de Raíz

| Agente | sha256 | Herramientas | Qué hace |
|---|---|---|---|
| `revisor-contrato` | `8b76bc899e8a57f75ad47a52f60ba088c1b04d2dc8d097942f91c4026987f2ed` | Read, Grep, Glob, Bash | Revisa el contrato de datos v4 contra el kit §2 y `validar_contrato.py`: nombres de campos, listas de valores, P10 ≤ P50 ≤ P90, plazos y compromiso, marca `mock`, `manifest.json`, `params.json` y los huecos del propio validador |
| `revisor-cifras` | `3e35aff89980c1a212dfb4366abdebf8e4b5a5d209c9871dfdf55ac6b0edcf09` | Read, Grep, Glob, Bash | Busca cifras escritas a mano o sin fuente en `web/`, textos y documentos públicos. Aplica las reglas 2, 3, 4, 9, 10 y 11 de `CLAUDE.md`: «first», «only», promesas de ahorro, repartir, vender o intercambiar agua, y pronóstico de la presa |

- Los dos los escribió Claude Code para este repo (encabezado AI-assisted en un comentario HTML después del frontmatter).
- Tienen Bash para correr `validar_contrato.py`, pytest, `grep` y `git diff`. Sus instrucciones les **prohíben** escribir en el repo, correr `construir.py` o los scripts de `motor/` y usar la red.
- Si cambia un agente, actualice aquí su sha256: `sha256sum .claude/agents/*.md`.

## Cuándo se usa cada uno
El protocolo completo está en `docs/prompts/README.md`. En corto:
- **Revisión de una pieza:** `revisor-contrato` si la pieza toca datos, motor o contrato; `revisor-cifras` si toca la web, textos o documentos; `code-reviewer` siempre.
- **Revisión final de la rama:** los cinco en paralelo, más un validador por hallazgo.

## No se copió
- Ningún hook ni plugin completo.
- Los demás agentes de pr-review-toolkit (`code-simplifier`, `comment-analyzer` y `type-design-analyzer`) y de feature-dev (`code-architect` y `code-explorer`): no los pide el protocolo.
- Detalle en `.claude/skills/README.md`, «Lo que NO se instaló y por qué».

## Texto de la licencia Apache-2.0 (anthropics/claude-plugins-official, `LICENSE`)

<details>
<summary>Apache License, Version 2.0</summary>

```
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright [yyyy] [name of copyright owner]

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```

</details>
