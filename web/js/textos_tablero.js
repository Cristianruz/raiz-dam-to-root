// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; initial version with OpenAI Codex
// web/js/textos_tablero.js — Textos del tablero (web/index.html, js/dashboard.js y js/interfaz.js) en los cuatro
// idiomas del proyecto. Se registran en js/i18n.js al importar este módulo y se leen con t("tablero.…").
//
// Reglas de este archivo:
// - cada clave trae sus cuatro textos en el orden de ORDEN: inglés, español, portugués y francés;
// - ninguna cifra dentro de los textos: los números entran por marcadores {nombre}, ya con formato (fmtNumero);
// - el nombre del producto, «ROOT – From Dam to Root», no se traduce (va en el HTML, sin clave);
// - regla 10: se describe, no se ordena ni se promete; el aviso de juicio va en el pie y en la ficha;
// - el español parte de la redacción original del tablero; inglés, portugués y francés son traducciones hechas con
//   IA (el portugués y el francés se anuncian como borrador junto al selector de idioma).
// tests/textos_tablero.test.js comprueba claves, marcadores, dígitos y palabras vetadas.
import { registrar } from "./i18n.js";

export const ORDEN = ["en", "es", "pt", "fr"];

// clave (sin el prefijo «tablero.»): [inglés, español, portugués, francés]
const TABLA = {
  // --- Página y cabecera
  titulo: ["Water dashboard", "Tablero del agua", "Painel da água", "Tableau de bord de l'eau"],
  lema: [
    "Before you plant, see the water you are committing.",
    "Antes de sembrar, mira el agua que comprometes.",
    "Antes de plantar, veja a água que você compromete.",
    "Avant de semer, voyez l'eau que vous engagez.",
  ],
  saltar: ["Skip to content", "Saltar al contenido", "Ir para o conteúdo", "Aller au contenu"],
  zona_piloto: ["Pilot area", "Zona piloto", "Zona piloto", "Zone pilote"],
  distrito: [
    "Delicias irrigation district, Chihuahua",
    "Distrito de riego Delicias, Chihuahua",
    "Distrito de irrigação Delicias, Chihuahua",
    "District d'irrigation de Delicias, Chihuahua",
  ],
  "nav.rotulo": ["VIEWS", "VISTAS", "VISTAS", "VUES"],
  "nav.aria": ["Main navigation", "Navegación principal", "Navegação principal", "Navigation principale"],
  "nav.resumen": ["Overview", "Resumen", "Resumo", "Aperçu"],
  "nav.terreno": ["My field", "Mi terreno", "Meu terreno", "Mon terrain"],
  "nav.cultivos": ["Crops and options", "Cultivos y opciones", "Culturas e opções", "Cultures et options"],
  "nav.comparar": ["Compare options", "Comparar opciones", "Comparar opções", "Comparer les options"],
  "nav.historia": [
    "History and rainfall range",
    "Historia y rango de lluvia",
    "Histórico e faixa de chuva",
    "Historique et plage de pluie",
  ],
  abrir_explorador: [
    "Open the field explorer",
    "Abrir el explorador de parcelas",
    "Abrir o explorador de parcelas",
    "Ouvrir l'explorateur de parcelles",
  ],
  "perfil.nombre": ["Local grower", "Productor local", "Produtor local", "Producteur local"],
  "perfil.zona": [
    "Pilot area · Delicias district",
    "Zona piloto · distrito de Delicias",
    "Zona piloto · distrito de Delicias",
    "Zone pilote · district de Delicias",
  ],
  estado_datos: ["Research data", "Datos de investigación", "Dados de pesquisa", "Données de recherche"],
  "acerca.aria": [
    "«About & Data», in the field explorer",
    "«About & Data», en el explorador de parcelas",
    "«About & Data», no explorador de parcelas",
    "« About & Data », dans l'explorateur de parcelles",
  ],
  "idioma.rotulo": ["Language", "Idioma", "Idioma", "Langue"],
  "idioma.borrador": [
    "Machine-drafted translation; review by a speaker pending",
    "Traducción hecha por máquina; falta la revisión de una persona hablante",
    "Tradução feita por máquina; revisão por um falante pendente",
    "Traduction automatique ; relecture par un locuteur en attente",
  ],
  descargar_resumen: ["Download summary", "Descargar resumen", "Baixar resumo", "Télécharger le résumé"],
  cargando: ["Loading the dashboard…", "Cargando el tablero…", "Carregando o painel…", "Chargement du tableau de bord…"],

  // --- Vistas: título y descripción de la cabecera
  "vista.terreno.titulo": ["Your field, up close", "Tu terreno, de cerca", "Seu terreno, de perto", "Votre terrain, de près"],
  "vista.terreno.desc": [
    "Each field has its own crop, soil and water need.",
    "Cada parcela tiene su cultivo, su suelo y su necesidad de agua.",
    "Cada parcela tem sua cultura, seu solo e sua necessidade de água.",
    "Chaque parcelle a sa culture, son sol et son besoin en eau.",
  ],
  "vista.cultivos.titulo": ["What you plant matters", "Lo que siembras importa", "O que você planta importa", "Ce que vous semez compte"],
  "vista.cultivos.desc": [
    "Compare water need, irrigation and how many years each crop commits.",
    "Compara agua, riego y los años que compromete cada cultivo.",
    "Compare água, irrigação e os anos que cada cultura compromete.",
    "Comparez l'eau, l'irrigation et les années que chaque culture engage.",
  ],
  "vista.comparar.desc": [
    "Evidence and questions to go over with your technician.",
    "Evidencia y preguntas para conversar con tu técnico.",
    "Evidências e perguntas para conversar com seu técnico.",
    "Éléments et questions à voir avec votre technicien.",
  ],
  "vista.historia.desc": [
    "Historical rainfall range with its back-test, and past events for context.",
    "Rango histórico de lluvia con su retroprueba, y eventos pasados como contexto.",
    "Faixa histórica de chuva com seu teste retroativo, e eventos passados como contexto.",
    "Plage historique de pluie avec son test rétrospectif, et événements passés pour le contexte.",
  ],

  // --- Resumen: tarjeta de entrada y dotación
  "hero.pill": ["KNOW BEFORE YOU PLANT", "CULTIVA CON INFORMACIÓN", "CULTIVE COM INFORMAÇÃO", "CULTIVER EN CONNAISSANCE"],
  "hero.titulo": [
    "Every crop has its own water story.",
    "Cada cultivo tiene su historia de agua.",
    "Cada cultura tem sua história de água.",
    "Chaque culture a son histoire d'eau.",
  ],
  "hero.texto": [
    "Look at your field and compare what you plant with the water in this scenario.",
    "Explora tu terreno y compara lo que siembras con el agua de este escenario.",
    "Explore seu terreno e compare o que você planta com a água deste cenário.",
    "Explorez votre terrain et comparez ce que vous semez avec l'eau de ce scénario.",
  ],
  "hero.boton": ["Explore my field", "Explorar mi terreno", "Explorar meu terreno", "Explorer mon terrain"],
  "hero.pie": [
    "ROOT · DELICIAS IRRIGATION DISTRICT",
    "ROOT · DISTRITO DE RIEGO DELICIAS",
    "ROOT · DISTRITO DE IRRIGAÇÃO DELICIAS",
    "ROOT · DISTRICT D'IRRIGATION DELICIAS",
  ],
  "agua.pill": ["SCENARIO TO EXPLORE", "ESCENARIO EXPLORABLE", "CENÁRIO PARA EXPLORAR", "SCÉNARIO À EXPLORER"],
  "agua.titulo": ["Water allocation", "Dotación de agua", "Dotação de água", "Dotation en eau"],
  "agua.texto": [
    "Set an allocation to explore your options.",
    "Define una dotación para explorar tus opciones.",
    "Defina uma dotação para explorar suas opções.",
    "Fixez une dotation pour explorer vos options.",
  ],
  unidad: ["thousand m³/ha", "millares/ha", "mil m³/ha", "milliers de m³/ha"],
  "agua.aria": [
    "Water allocation in thousand cubic meters per hectare",
    "Dotación de agua en millares por hectárea",
    "Dotação de água em mil metros cúbicos por hectare",
    "Dotation en eau en milliers de mètres cubes par hectare",
  ],
  "agua.menos_lluvia": ["Explore with less rain", "Explorar con menos lluvia", "Explorar com menos chuva", "Explorer avec moins de pluie"],
  "agua.nota": [
    "This is a scenario to explore: it is not an assigned allocation, and it does not tell how much water there will be.",
    "Es un escenario para explorar: no es una dotación asignada ni dice cuánta agua habrá.",
    "É um cenário para explorar: não é uma dotação atribuída nem diz quanta água haverá.",
    "C'est un scénario à explorer : ce n'est pas une dotation attribuée et il ne dit pas combien d'eau il y aura.",
  ],
  "agua.marcas_aria": ["Reference allocations", "Dotaciones de referencia", "Dotações de referência", "Dotations de référence"],
  "marca.como": ["Like {anio}", "Como {anio}", "Como {anio}", "Comme {anio}"],
  "marca.normal": ["Normal year", "Año normal", "Ano normal", "Année normale"],
  "etiqueta.por_confirmar": ["to be confirmed", "por confirmar", "a confirmar", "à confirmer"],

  // --- Resumen: cifras de la zona
  "cifra.superficie": ["Size of the pilot area", "Superficie de la zona", "Superfície da zona", "Superficie de la zone"],
  "cifra.superficie_nota": [
    "Area of the estimated polygons",
    "Área de polígonos estimados",
    "Área dos polígonos estimados",
    "Surface des polygones estimés",
  ],
  "cifra.parcelas": ["Fields identified", "Parcelas identificadas", "Parcelas identificadas", "Parcelles identifiées"],
  "cifra.parcelas_nota": [
    "{n} with a crop classification",
    "{n} con clasificación de cultivo",
    "{n} com classificação de cultura",
    "{n} avec une classification de culture",
  ],
  "cifra.comprometida": ["Water already committed", "Agua comprometida", "Água comprometida", "Eau engagée"],
  "cifra.comprometida_nota": [
    "At least · need of perennial crops / allocation",
    "Al menos · demanda de perennes / dotación",
    "Pelo menos · demanda de perenes / dotação",
    "Au moins · besoin des pérennes / dotation",
  ],
  "cifra.sin_dotacion_nota": [
    "No allocation in this scenario",
    "Sin dotación en este escenario",
    "Sem dotação neste cenário",
    "Pas de dotation dans ce scénario",
  ],
  "cifra.sin_clasificar": ["Area not classified", "Área sin clasificar", "Área sem classificar", "Surface non classée"],
  "cifra.sin_clasificar_nota": [
    "Needs checking in the field",
    "Necesita verificación en campo",
    "Precisa de verificação em campo",
    "À vérifier sur le terrain",
  ],
  "compromiso.sin_dotacion": ["No allocation", "Sin dotación", "Sem dotação", "Pas de dotation"],
  "compromiso.al_menos": [
    "At least {pct} committed",
    "Al menos {pct} comprometido",
    "Pelo menos {pct} comprometido",
    "Au moins {pct} engagé",
  ],
  "compromiso.nota": [
    "Need of perennial crops · current scenario",
    "Demanda de cultivos perennes · escenario actual",
    "Demanda de culturas perenes · cenário atual",
    "Besoin des cultures pérennes · scénario actuel",
  ],
  "compromiso.aria": [
    "Compare options for this field",
    "Comparar opciones para esta parcela",
    "Comparar opções para esta parcela",
    "Comparer les options pour cette parcelle",
  ],
  escenario: [
    "Scenario: {dotacion} {unidad} · rain change {lluvia}%",
    "Escenario: {dotacion} {unidad} · cambio de lluvia {lluvia}%",
    "Cenário: {dotacion} {unidad} · mudança de chuva {lluvia}%",
    "Scénario : {dotacion} {unidad} · variation de pluie {lluvia} %",
  ],
  corte: ["Data as of {fecha}", "Corte de datos · {fecha}", "Dados de {fecha}", "Données au {fecha}"],
  corte_sin_fecha: ["date not available", "fecha no disponible", "data não disponível", "date non disponible"],

  // --- Resumen: mapa
  "seccion.mapa.ceja": [
    "A LOOK AT THE PILOT AREA",
    "UNA MIRADA A LA ZONA PILOTO",
    "UM OLHAR SOBRE A ZONA PILOTO",
    "UN REGARD SUR LA ZONE PILOTE",
  ],
  "seccion.mapa.titulo": ["From the map to the field", "Del mapa a la parcela", "Do mapa à parcela", "De la carte à la parcelle"],
  "seccion.mapa.enlace": ["Explore the map", "Explorar el mapa", "Explorar o mapa", "Explorer la carte"],
  "mapa.limites": [
    "Estimated boundaries · Fields of The World",
    "Límites estimados · Fields of The World",
    "Limites estimados · Fields of The World",
    "Limites estimées · Fields of The World",
  ],
  "mapa.zona_completa": ["See the whole area", "Ver zona completa", "Ver a zona inteira", "Voir toute la zone"],
  "mapa.aria": [
    "Interactive map of fields",
    "Mapa interactivo de parcelas",
    "Mapa interativo de parcelas",
    "Carte interactive des parcelles",
  ],
  "mapa.nota": [
    "Select a field on the map or use the search box.",
    "Selecciona una parcela en el mapa o usa el buscador.",
    "Selecione uma parcela no mapa ou use a busca.",
    "Sélectionnez une parcelle sur la carte ou utilisez la recherche.",
  ],
  "mapa.colorear": ["Color fields by", "Colorear parcelas por", "Colorir parcelas por", "Colorer les parcelles par"],
  "mapa.modo.agua": ["Water", "Agua", "Água", "Eau"],
  "mapa.modo.cultivo": ["Crop", "Cultivo", "Cultura", "Culture"],
  "mapa.modo.mi_parcela": ["My field", "Mi parcela", "Minha parcela", "Ma parcelle"],
  "mapa.accesos_aria": [
    "Shortcuts to fields in this pilot area",
    "Accesos a parcelas de esta zona",
    "Atalhos para parcelas desta zona",
    "Raccourcis vers des parcelles de cette zone",
  ],
  "leyenda.verde": ["Enough water", "Alcanza el agua", "Água suficiente", "Eau suffisante"],
  "leyenda.ambar": ["Tight", "Justa", "Justa", "Juste"],
  "leyenda.rojo": ["Not enough water", "Falta agua", "Falta água", "Eau insuffisante"],
  "leyenda.gris": ["Not classified", "Sin clasificar", "Sem classificar", "Non classée"],
  "leyenda.clasificado": ["Classified crop", "Cultivo clasificado", "Cultura classificada", "Culture classée"],
  "mapa.sin_base": [
    "The base map is not available. The field polygons are drawn from local data.",
    "El mapa base no está disponible. Los polígonos se dibujan con los datos locales.",
    "O mapa base não está disponível. Os polígonos são desenhados com os dados locais.",
    "Le fond de carte n'est pas disponible. Les polygones sont tracés avec les données locales.",
  ],
  "mapa.sin_contexto": [
    "The graphics context was lost. The field polygons are drawn from local data.",
    "Se perdió el contexto gráfico. Los polígonos se dibujan con los datos locales.",
    "O contexto gráfico foi perdido. Os polígonos são desenhados com os dados locais.",
    "Le contexte graphique a été perdu. Les polygones sont tracés avec les données locales.",
  ],
  "mapa.sin_inicio": [
    "The interactive map could not start. The field polygons are drawn from local data.",
    "No se pudo iniciar el mapa interactivo. Los polígonos se dibujan con los datos locales.",
    "Não foi possível iniciar o mapa interativo. Os polígonos são desenhados com os dados locais.",
    "La carte interactive n'a pas pu démarrer. Les polygones sont tracés avec les données locales.",
  ],
  "mapa.elige_lista": [
    "You can also choose a field from the list.",
    "También puedes elegir una parcela en el listado.",
    "Você também pode escolher uma parcela na lista.",
    "Vous pouvez aussi choisir une parcelle dans la liste.",
  ],
  "mapa.sin_teselas": [
    "Part of the map could not load. The field polygons and the field list use local data; the base map needs a connection.",
    "No se pudo cargar parte del mapa. Los polígonos y el listado usan datos locales; el mapa base necesita conexión.",
    "Parte do mapa não carregou. Os polígonos e a lista usam dados locais; o mapa base precisa de conexão.",
    "Une partie de la carte n'a pas pu se charger. Les polygones et la liste utilisent des données locales ; le fond de carte demande une connexion.",
  ],
  "mapa.local_aria": [
    "Estimated field polygons of the pilot area, without a base map",
    "Polígonos estimados de la zona, sin mapa base",
    "Polígonos estimados da zona, sem mapa base",
    "Polygones estimés de la zone, sans fond de carte",
  ],

  // --- Ficha de la parcela
  "ficha.titulo": ["Your field, up close", "Tu parcela, de cerca", "Sua parcela, de perto", "Votre parcelle, de près"],
  aviso: [
    "This tool supports, never replaces, the judgment of farmers and local experts.",
    "Esta herramienta apoya, y no sustituye, el juicio del agricultor ni del técnico.",
    "Esta ferramenta apoia, e não substitui, o julgamento do agricultor nem do técnico.",
    "Cet outil appuie, et ne remplace pas, le jugement de l'agriculteur ni du technicien.",
  ],
  "ficha.buscar": [
    "Search field by ID or crop",
    "Buscar parcela por ID o cultivo",
    "Buscar parcela por ID ou cultura",
    "Chercher une parcelle par ID ou culture",
  ],
  "ficha.buscar_ph": [
    "Search field by ID or crop…",
    "Buscar parcela por ID o cultivo…",
    "Buscar parcela por ID ou cultura…",
    "Chercher une parcelle par ID ou culture…",
  ],
  "ficha.seleccionar": ["Select field", "Seleccionar parcela", "Selecionar parcela", "Sélectionner une parcelle"],
  "ficha.sin_coincidencias": ["No matches", "No hay coincidencias", "Nenhuma correspondência", "Aucun résultat"],
  "ficha.sin_parcelas": [
    "No fields available in this pilot area.",
    "No hay parcelas disponibles en esta zona.",
    "Não há parcelas disponíveis nesta zona.",
    "Aucune parcelle disponible dans cette zone.",
  ],
  "ficha.parcela": ["Field {id} · {area} ha", "Parcela {id} · {area} ha", "Parcela {id} · {area} ha", "Parcelle {id} · {area} ha"],
  "ficha.sin_clasificar": ["Crop not classified", "Cultivo sin clasificar", "Cultura sem classificar", "Culture non classée"],
  "ficha.demanda": ["Yearly water need · median", "Demanda anual · mediana", "Demanda anual · mediana", "Besoin annuel · médiane"],
  "ficha.suelo": ["Soil · regional map", "Suelo · mapa regional", "Solo · mapa regional", "Sol · carte régionale"],
  "ficha.riego": ["Actual irrigation system", "Sistema de riego real", "Sistema de irrigação real", "Système d'irrigation réel"],
  "ficha.sin_registrar": ["Not recorded", "Sin registrar", "Não registrado", "Non renseigné"],
  "ficha.pendiente": ["Mean slope", "Pendiente media", "Declive médio", "Pente moyenne"],
  "ficha.textura": ["Estimated texture · map", "Textura estimada · mapa", "Textura estimada · mapa", "Texture estimée · carte"],
  "ficha.plazo": ["Water term in the model", "Compromiso del modelo", "Compromisso do modelo", "Engagement du modèle"],
  "ficha.cobertura": [
    "Area covered in this scenario",
    "Área cubierta por el escenario",
    "Área coberta pelo cenário",
    "Surface couverte par le scénario",
  ],
  "ficha.hectareas": [
    "{cubiertas} of {area} ha have water at the median need. Likely range: {bajo}–{alto} ha.",
    "{cubiertas} de {area} ha con agua a demanda mediana. Rango probable: {bajo}–{alto} ha.",
    "{cubiertas} de {area} ha com água na demanda mediana. Faixa provável: {bajo}–{alto} ha.",
    "{cubiertas} sur {area} ha ont de l'eau au besoin médian. Plage probable : {bajo}–{alto} ha.",
  ],
  "ficha.sin_calculo_nota": [
    "Nothing is computed for a field without a crop classification. The crop can be confirmed with your technician.",
    "Sin clasificación de cultivo no se calcula nada para esta parcela. El cultivo se puede confirmar con tu técnico.",
    "Sem classificação de cultura nada é calculado para esta parcela. A cultura pode ser confirmada com seu técnico.",
    "Sans classification de culture, rien n'est calculé pour cette parcelle. La culture peut être confirmée avec votre technicien.",
  ],
  "textura.clay_loam": ["Clay loam", "Franco arcilloso", "Franco-argiloso", "Limon argileux"],
  "textura.sandy_clay_loam": ["Sandy clay loam", "Franco arcilloarenoso", "Franco-argiloarenoso", "Limon argilo-sableux"],
  "textura.sandy_loam": ["Sandy loam", "Franco arenoso", "Franco-arenoso", "Limon sableux"],
  sin_dato: ["No data", "Sin dato", "Sem dado", "Pas de donnée"],
  sin_calculo: ["Not computed", "Sin cálculo", "Sem cálculo", "Non calculé"],
  no_cargo: ["Could not load", "No se pudo cargar", "Não foi possível carregar", "Chargement impossible"],
  anio: ["{n} year", "{n} año", "{n} ano", "{n} an"],
  anios: ["{n} years", "{n} años", "{n} anos", "{n} ans"],
  anios_rango: ["{min}–{max} years", "{min}–{max} años", "{min}–{max} anos", "{min}–{max} ans"],

  // --- Resumen: historia
  "seccion.historia.ceja": [
    "PAST SEASONS, FOR CONTEXT",
    "CICLOS PASADOS, COMO CONTEXTO",
    "CICLOS PASSADOS, COMO CONTEXTO",
    "CAMPAGNES PASSÉES, POUR CONTEXTE",
  ],
  "seccion.historia.titulo": [
    "What earlier years looked like",
    "Cómo fueron los años anteriores",
    "Como foram os anos anteriores",
    "À quoi ressemblaient les années précédentes",
  ],
  "seccion.historia.enlace": ["See the history", "Ver la historia", "Ver o histórico", "Voir l'historique"],
  "historia.titulo": [
    "Irrigated area in the district",
    "Superficie regada en el distrito",
    "Superfície irrigada no distrito",
    "Surface irriguée dans le district",
  ],
  "historia.pill": [
    "CONAGUA · SECONDARY REFERENCE",
    "CONAGUA · REFERENCIA SECUNDARIA",
    "CONAGUA · REFERÊNCIA SECUNDÁRIA",
    "CONAGUA · RÉFÉRENCE SECONDAIRE",
  ],
  "historia.nota": [
    "Selected years from the project research. It is not a continuous series, and it says nothing about coming years.",
    "Años seleccionados de la investigación. No es una serie continua ni dice nada de los años que vienen.",
    "Anos selecionados da pesquisa. Não é uma série contínua nem diz nada sobre os próximos anos.",
    "Années choisies dans la recherche du projet. Ce n'est pas une série continue et cela ne dit rien des années à venir.",
  ],
  "historia.aria": [
    "Irrigated area in hectares, for selected years",
    "Superficie regada en hectáreas, por años seleccionados",
    "Superfície irrigada em hectares, por anos selecionados",
    "Surface irriguée en hectares, pour des années choisies",
  ],
  "historia.fuente_resumen": [
    "Source and values as a table",
    "Fuente y valores en tabla",
    "Fonte e valores em tabela",
    "Source et valeurs en tableau",
  ],
  "historia.tabla": [
    "Irrigated area, hectares",
    "Superficie regada, hectáreas",
    "Superfície irrigada, hectares",
    "Surface irriguée, hectares",
  ],
  "historia.sin_datos": [
    "No history data available.",
    "No hay datos de historia.",
    "Não há dados de histórico.",
    "Pas de données d'historique.",
  ],
  "idea.ceja": ["BEYOND THIS SEASON", "MÁS ALLÁ DE ESTA TEMPORADA", "ALÉM DESTA SAFRA", "AU-DELÀ DE CETTE SAISON"],
  "idea.titulo": [
    "Planting also commits water.",
    "Sembrar también es comprometer agua.",
    "Plantar também é comprometer água.",
    "Semer, c'est aussi engager de l'eau.",
  ],
  "idea.texto": [
    "An orchard stays for years. An annual crop lets you rethink the next season.",
    "Una huerta permanece por años. Un cultivo anual permite replantear el siguiente ciclo.",
    "Um pomar permanece por anos. Uma cultura anual permite repensar o ciclo seguinte.",
    "Un verger reste des années. Une culture annuelle permet de repenser la saison suivante.",
  ],
  "idea.enlace": ["Compare my options", "Comparar mis opciones", "Comparar minhas opções", "Comparer mes options"],

  // --- Vista del terreno
  "terreno.titulo": ["Explore your field", "Explora tu parcela", "Explore sua parcela", "Explorez votre parcelle"],
  "terreno.intro": [
    "The map and the field detail are here. Change the pilot area, search for a field or select its polygon. Terrain, runoff and the twin view are in the field explorer.",
    "El mapa y el detalle de parcela están aquí. Cambia de zona, busca una parcela o selecciona su polígono. El relieve, los escurrimientos y la vista del gemelo están en el explorador de parcelas.",
    "O mapa e o detalhe da parcela estão aqui. Mude de zona, busque uma parcela ou selecione seu polígono. O relevo, os escoamentos e a vista do gêmeo estão no explorador de parcelas.",
    "La carte et le détail de la parcelle sont ici. Changez de zone, cherchez une parcelle ou sélectionnez son polygone. Le relief, les ruissellements et la vue du jumeau sont dans l'explorateur de parcelles.",
  ],

  // --- Vista de cultivos y opciones
  "cultivos.titulo": ["Choose what to compare", "Elige qué comparar", "Escolha o que comparar", "Choisissez quoi comparer"],
  "cultivos.pill": ["FAO MODEL · SCENARIOS", "MODELO FAO · ESCENARIOS", "MODELO FAO · CENÁRIOS", "MODÈLE FAO · SCÉNARIOS"],
  "cultivos.intro": [
    "Modeled yearly water need for the selected pilot area. The range expresses uncertainty, not the chance of a harvest. Surface (gravity) irrigation uses an assumed efficiency range; drip irrigation needs local validation.",
    "Demanda anual modelada para la zona seleccionada. El rango expresa incertidumbre, no probabilidad de cosecha. El riego por gravedad usa un rango de eficiencia supuesto; el goteo necesita validación local.",
    "Demanda anual modelada para a zona selecionada. A faixa expressa incerteza, não probabilidade de colheita. A irrigação por gravidade usa uma faixa de eficiência suposta; o gotejamento precisa de validação local.",
    "Besoin annuel modélisé pour la zone choisie. La plage exprime l'incertitude, pas la probabilité de récolte. L'irrigation gravitaire utilise une plage d'efficience supposée ; le goutte-à-goutte demande une validation locale.",
  ],
  "cultivos.formula_titulo": [
    "Where does each crop's water need come from?",
    "¿De dónde sale el agua que pide cada cultivo?",
    "De onde vem a água que cada cultura pede?",
    "D'où vient l'eau que demande chaque culture ?",
  ],
  "cultivos.formula": [
    "ETc = Kc × ETo → Monthly net depth = ETc − effective rain, never below zero → Gross depth = net ÷ efficiency + pre-planting irrigation for annual crops.",
    "ETc = Kc × ETo → Lámina neta mensual = ETc − lluvia efectiva, sin valores negativos → Lámina bruta = neta ÷ eficiencia + presiembra en cultivos anuales.",
    "ETc = Kc × ETo → Lâmina líquida mensal = ETc − chuva efetiva, sem valores negativos → Lâmina bruta = líquida ÷ eficiência + irrigação de pré-plantio em culturas anuais.",
    "ETc = Kc × ETo → Lame nette mensuelle = ETc − pluie efficace, jamais négative → Lame brute = nette ÷ efficience + irrigation de pré-semis pour les cultures annuelles.",
  ],
  "cultivos.formula_nota": [
    "ET is the water the crop consumes. The water that has to be delivered also depends on rain and on the irrigation system.",
    "La ET representa el agua consumida por el cultivo. El agua que se debe entregar también depende de la lluvia y del sistema de riego.",
    "A ET representa a água consumida pela cultura. A água que deve ser entregue também depende da chuva e do sistema de irrigação.",
    "L'ET est l'eau consommée par la culture. L'eau à livrer dépend aussi de la pluie et du système d'irrigation.",
  ],
  "cultivos.sin_datos": [
    "No rotation data for this pilot area.",
    "No hay datos de rotaciones para esta zona.",
    "Não há dados de rotações para esta zona.",
    "Pas de données de rotations pour cette zone.",
  ],
  "cultivos.plazo.anual": ["ANNUAL CROP", "CULTIVO ANUAL", "CULTURA ANUAL", "CULTURE ANNUELLE"],
  "cultivos.plazo.huerta": [
    "ORCHARD · MODEL HORIZON",
    "HUERTA · HORIZONTE DEL MODELO",
    "POMAR · HORIZONTE DO MODELO",
    "VERGER · HORIZON DU MODÈLE",
  ],
  "cultivos.plazo.perenne": ["PERENNIAL CROP", "CULTIVO PERENNE", "CULTURA PERENE", "CULTURE PÉRENNE"],
  "cultivos.rango": [
    "Likely range: {bajo}–{alto}",
    "Rango probable: {bajo}–{alto}",
    "Faixa provável: {bajo}–{alto}",
    "Plage probable : {bajo}–{alto}",
  ],
  "cultivos.compromiso": ["Water term", "Compromiso", "Compromisso", "Engagement"],
  "cultivos.siembra": ["Planting · month-day", "Siembra · mes-día", "Plantio · mês-dia", "Semis · mois-jour"],
  "cultivos.siembra_rango": ["{desde} to {hasta}", "{desde} a {hasta}", "{desde} a {hasta}", "{desde} au {hasta}"],
  "cultivos.sin_siembra": ["Not in the data", "No está en los datos", "Não está nos dados", "Absent des données"],
  "cultivos.base": ["Calculation basis", "Base del cálculo", "Base do cálculo", "Base du calcul"],
  "cultivos.sin_riego": ["No irrigation", "Sin riego", "Sem irrigação", "Sans irrigation"],
  "cultivos.riego_modelado": [
    "Modeled surface irrigation",
    "Riego superficial modelado",
    "Irrigação superficial modelada",
    "Irrigation de surface modélisée",
  ],
  "cultivos.area": [
    "For the area of {id}: {cubiertas} of {area} ha covered at the median need. This compares area; it is not a suitability rating or advice for this field.",
    "Para el área de {id}: {cubiertas} de {area} ha cubiertas a mediana. Es una comparación de área; no califica la aptitud ni aconseja qué sembrar en esta parcela.",
    "Para a área de {id}: {cubiertas} de {area} ha cobertos na mediana. É uma comparação de área; não avalia a aptidão nem aconselha o que plantar nesta parcela.",
    "Pour la surface de {id} : {cubiertas} sur {area} ha couverts à la médiane. C'est une comparaison de surface ; elle n'évalue pas l'aptitude et ne conseille pas quoi semer sur cette parcelle.",
  ],
  "cultivos.sin_parcela": [
    "Select a field to compare area.",
    "Selecciona una parcela para comparar superficie.",
    "Selecione uma parcela para comparar a área.",
    "Sélectionnez une parcelle pour comparer la surface.",
  ],

  // --- Nombres de cultivo (por identificador del cubo) y de las opciones de rotación (dashboard.json)
  "cultivo.alfalfa": ["Alfalfa", "Alfalfa", "Alfafa", "Luzerne"],
  "cultivo.nogal": ["Pecan orchard", "Nogal", "Nogueira-pecã", "Pacanier"],
  "cultivo.chile": ["Chile pepper", "Chile", "Pimenta (chile)", "Piment"],
  "cultivo.algodon": ["Cotton", "Algodón", "Algodão", "Coton"],
  "cultivo.maiz_forrajero": ["Forage maize", "Maíz forrajero", "Milho forrageiro", "Maïs fourrager"],
  "cultivo.sorgo": ["Forage sorghum", "Sorgo forrajero", "Sorgo forrageiro", "Sorgho fourrager"],
  "cultivo.cereal_invierno": ["Winter cereal", "Cereal de invierno", "Cereal de inverno", "Céréale d'hiver"],
  "cultivo.forraje_verano": ["Summer forage", "Forraje de verano", "Forragem de verão", "Fourrage d'été"],
  "cultivo.barbecho": ["Fallow", "Barbecho", "Pousio", "Jachère"],
  "cultivo.descanso": ["Rest", "Descanso", "Descanso", "Repos"],
  "cultivo.anual": ["Annual crop", "Cultivo anual", "Cultura anual", "Culture annuelle"],
  "cultivo.sin_clasificar": ["Not classified", "Sin clasificar", "Sem classificar", "Non classée"],
  "opcion.alfalfa": ["Alfalfa (perennial)", "Alfalfa (perenne)", "Alfafa (perene)", "Luzerne (pérenne)"],
  "opcion.alfalfa_corte_verano": [
    "Alfalfa with summer irrigation cut",
    "Alfalfa con corte de riego en verano",
    "Alfafa com corte de irrigação no verão",
    "Luzerne avec arrêt d'irrigation en été",
  ],
  "opcion.nogal": ["Pecan (orchard)", "Nogal (huerta)", "Nogueira-pecã (pomar)", "Pacanier (verger)"],
  "opcion.algodon": ["Cotton", "Algodón", "Algodão", "Coton"],
  "opcion.chile": ["Chile pepper", "Chile", "Pimenta (chile)", "Piment"],
  "opcion.maiz_forrajero": ["Forage maize", "Maíz forrajero", "Milho forrageiro", "Maïs fourrager"],
  "opcion.sorgo": ["Forage sorghum", "Sorgo forrajero", "Sorgo forrageiro", "Sorgho fourrager"],
  "opcion.cereal_invierno": ["Winter cereal", "Cereal de invierno", "Cereal de inverno", "Céréale d'hiver"],
  "opcion.avena_maiz": [
    "Oats (winter) + forage maize (summer)",
    "Avena (invierno) + maíz forrajero (verano)",
    "Aveia (inverno) + milho forrageiro (verão)",
    "Avoine (hiver) + maïs fourrager (été)",
  ],
  "opcion.cereal_algodon": [
    "Winter cereal + cotton (summer)",
    "Cereal de invierno + algodón (verano)",
    "Cereal de inverno + algodão (verão)",
    "Céréale d'hiver + coton (été)",
  ],
  "opcion.cereal_sorgo": [
    "Winter cereal + forage sorghum (summer)",
    "Cereal de invierno + sorgo forrajero (verano)",
    "Cereal de inverno + sorgo forrageiro (verão)",
    "Céréale d'hiver + sorgho fourrager (été)",
  ],
  "opcion.descanso": [
    "Rest with standing stubble",
    "Descanso con rastrojo en pie",
    "Descanso com restolho em pé",
    "Repos avec chaumes sur pied",
  ],

  // --- Vista de comparar opciones
  "comparar.titulo": [
    "Compare options with your field data",
    "Comparar opciones con los datos de tu parcela",
    "Comparar opções com os dados da sua parcela",
    "Comparer les options avec les données de votre parcelle",
  ],
  "comparar.pill": [
    "RULES AND CALCULATIONS YOU CAN AUDIT",
    "REGLAS Y CÁLCULOS AUDITABLES",
    "REGRAS E CÁLCULOS AUDITÁVEIS",
    "RÈGLES ET CALCULS VÉRIFIABLES",
  ],
  "comparar.intro": [
    "Confirm the crop and enter what you know. The page works out the water each option asks for and shows the constraints it finds, with their source. Unconfirmed data stays marked as unconfirmed; it is not turned into measurements.",
    "Confirma el cultivo y captura lo que conoces. La página calcula el agua que pide cada opción y muestra las restricciones que encuentra, con su fuente. Los datos sin confirmar siguen marcados como tales; no se convierten en mediciones.",
    "Confirme a cultura e informe o que você conhece. A página calcula a água que cada opção pede e mostra as restrições que encontra, com sua fonte. Os dados não confirmados continuam marcados como tais; não se tornam medições.",
    "Confirmez la culture et saisissez ce que vous connaissez. La page calcule l'eau que demande chaque option et montre les contraintes qu'elle trouve, avec leur source. Les données non confirmées restent marquées comme telles ; elles ne deviennent pas des mesures.",
  ],
  "comparar.lado": ["Options side by side", "Opciones lado a lado", "Opções lado a lado", "Options côte à côte"],
  "comparar.descargar": [
    "Download calculation and evidence",
    "Descargar cálculo y evidencias",
    "Baixar cálculo e evidências",
    "Télécharger le calcul et les éléments",
  ],
  "comparar.comprobar_titulo": ["Check the calculation", "Comprueba el cálculo", "Verifique o cálculo", "Vérifiez le calcul"],
  "comparar.comprobar_texto": [
    "Run consistency checks with this field's data: sensitivity to water and to efficiency, repeatability, and abstaining when inputs are missing. These are software consistency tests, not agronomic trials.",
    "Ejecuta comprobaciones con los datos de esta parcela: sensibilidad al agua y a la eficiencia, repetibilidad y abstención cuando faltan entradas. Son pruebas de consistencia del software, no ensayos agronómicos.",
    "Execute verificações com os dados desta parcela: sensibilidade à água e à eficiência, repetibilidade e abstenção quando faltam entradas. São testes de consistência do software, não ensaios agronômicos.",
    "Lancez des vérifications avec les données de cette parcelle : sensibilité à l'eau et à l'efficience, répétabilité et abstention quand des entrées manquent. Ce sont des tests de cohérence du logiciel, pas des essais agronomiques.",
  ],
  "comparar.comprobar_boton": ["Run checks", "Ejecutar comprobaciones", "Executar verificações", "Lancer les vérifications"],
  "comparar.supuestos_titulo": [
    "What the categories and assumptions mean",
    "Qué significan las categorías y los supuestos",
    "O que significam as categorias e os pressupostos",
    "Ce que signifient les catégories et les hypothèses",
  ],
  "comparar.supuestos_texto": [
    "Winter cereal is a seasonal class; the model uses forage oats to represent it, and the satellite does not confirm which cereal it is. Fallow here means land that may have no crop: low greenness does not prove the land was rested on purpose. Texture, salinity, crop stage and application efficiency are confirmed in the field. A regional soil map does not replace a laboratory analysis. The options computed for each field are in its card in the field explorer.",
    "Cereal de invierno es una clase estacional; el modelo usa avena forrajera como representante, y el satélite no confirma de qué cereal se trata. Barbecho significa aquí posible terreno sin cultivo: la falta de verdor no prueba que se haya dejado descansar. La textura, la salinidad, la etapa del cultivo y la eficiencia de aplicación se confirman en campo. Un mapa regional de suelo no reemplaza un análisis de laboratorio. Las opciones calculadas para cada parcela están en su ficha, en el explorador de parcelas.",
    "Cereal de inverno é uma classe sazonal; o modelo usa aveia forrageira como representante, e o satélite não confirma de qual cereal se trata. Pousio significa aqui possível terreno sem cultura: a falta de verdor não prova que ele foi deixado em descanso. A textura, a salinidade, a fase da cultura e a eficiência de aplicação se confirmam em campo. Um mapa regional de solo não substitui uma análise de laboratório. As opções calculadas para cada parcela estão em sua ficha, no explorador de parcelas.",
    "Céréale d'hiver est une classe saisonnière ; le modèle utilise l'avoine fourragère pour la représenter, et le satellite ne confirme pas de quelle céréale il s'agit. Jachère signifie ici un terrain peut-être sans culture : le manque de verdure ne prouve pas qu'il a été laissé au repos. La texture, la salinité, le stade de la culture et l'efficience d'application se confirment sur le terrain. Une carte régionale des sols ne remplace pas une analyse de laboratoire. Les options calculées pour chaque parcelle sont dans sa fiche, dans l'explorateur de parcelles.",
  ],

  // --- Vista de historia y rango de lluvia
  "eventos.titulo": ["Past events in the region", "Eventos pasados en la región", "Eventos passados na região", "Événements passés dans la région"],
  "eventos.descargar": ["Download timeline", "Descargar cronología", "Baixar cronologia", "Télécharger la chronologie"],
  "eventos.intro": [
    "Events from the project research. Their figures are secondary references still to be checked against primary sources. They are context, not a validated data set, and this page does not forecast the dam, yields or income.",
    "Eventos de la investigación del proyecto. Sus cifras son referencias secundarias pendientes de cotejo con las fuentes primarias. Son contexto, no un conjunto de datos validado, y esta página no pronostica la presa, el rendimiento ni el ingreso.",
    "Eventos da pesquisa do projeto. Seus números são referências secundárias ainda a conferir com as fontes primárias. São contexto, não um conjunto de dados validado, e esta página não prevê a barragem, o rendimento nem a renda.",
    "Événements issus de la recherche du projet. Leurs chiffres sont des références secondaires à vérifier auprès des sources primaires. C'est du contexte, pas un jeu de données validé, et cette page ne prévoit ni le barrage, ni le rendement, ni le revenu.",
  ],
  "eventos.filtro_aria": ["Filter events", "Filtrar eventos", "Filtrar eventos", "Filtrer les événements"],
  "eventos.todos": ["All events", "Todos los eventos", "Todos os eventos", "Tous les événements"],
  "eventos.sequia": ["Drought", "Sequía", "Seca", "Sécheresse"],
  "eventos.inundacion": ["Rain and flooding", "Lluvia e inundación", "Chuva e inundação", "Pluie et inondation"],

  // --- Pie de página
  "pie.limites": [
    "It does not allocate, sell or trade water, and it does not forecast the dam. Field boundaries are estimated.",
    "No reparte, vende ni intercambia agua, y no pronostica la presa. Los límites de las parcelas son estimados.",
    "Não distribui, vende nem troca água, e não prevê a barragem. Os limites das parcelas são estimados.",
    "Il ne répartit, ne vend ni n'échange l'eau, et ne prévoit pas le barrage. Les limites des parcelles sont estimées.",
  ],
  "pie.leyenda": [
    "The legend of the evidence tags [V] / [P] / [S], «About & Data» and «Tests in sight» are in the field explorer.",
    "La leyenda de las etiquetas [V] / [P] / [S], «About & Data» y «Tests in sight» están en el explorador de parcelas.",
    "A legenda das etiquetas [V] / [P] / [S], «About & Data» e «Tests in sight» estão no explorador de parcelas.",
    "La légende des étiquettes [V] / [P] / [S], « About & Data » et « Tests in sight » se trouvent dans l'explorateur de parcelles.",
  ],

  // --- Fallos de carga y archivos que se descargan
  "error.carga": [
    "The dashboard could not load: {detalle}. You can reload the page or open the field explorer.",
    "No se pudo cargar el tablero: {detalle}. Puedes recargar la página o abrir el explorador de parcelas.",
    "Não foi possível carregar o painel: {detalle}. Você pode recarregar a página ou abrir o explorador de parcelas.",
    "Le tableau de bord n'a pas pu se charger : {detalle}. Vous pouvez recharger la page ou ouvrir l'explorateur de parcelles.",
  ],
  "error.estructura": [
    "the data files do not have the expected structure",
    "los archivos no tienen la estructura de datos esperada",
    "os arquivos não têm a estrutura de dados esperada",
    "les fichiers n'ont pas la structure de données attendue",
  ],
  "csv.alcance": [
    "Scenario to explore; it is not an assigned allocation or planting advice",
    "Escenario para explorar; no es una dotación asignada ni un consejo de siembra",
    "Cenário para explorar; não é uma dotação atribuída nem um conselho de plantio",
    "Scénario à explorer ; ce n'est ni une dotation attribuée ni un conseil de semis",
  ],
  "csv.unidad": [
    "thousand cubic meters per hectare per year",
    "miles de metros cúbicos por hectárea al año",
    "mil metros cúbicos por hectare por ano",
    "milliers de mètres cubes par hectare et par an",
  ],
  "csv.estado": [
    "Secondary reference; not a validated data set",
    "Referencia secundaria; no es un conjunto de datos validado",
    "Referência secundária; não é um conjunto de dados validado",
    "Référence secondaire ; pas un jeu de données validé",
  ],
};

/** Los mismos textos por idioma: { en: { "tablero.clave": "…" }, es: {…}, pt: {…}, fr: {…} }. */
export const TEXTOS_TABLERO = Object.fromEntries(
  ORDEN.map((codigo, i) => [
    codigo,
    Object.fromEntries(Object.entries(TABLA).map(([clave, textos]) => [`tablero.${clave}`, textos[i]])),
  ]),
);

registrar(TEXTOS_TABLERO);
