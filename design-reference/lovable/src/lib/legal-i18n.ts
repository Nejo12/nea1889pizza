// Informational translations of the German legal pages. The German pages remain the
// only legally binding version; these mirror their structure and placeholders.
import type { Lang } from "./i18n";

export type LegalDoc = { draft: string; sections: [string, string][] };
type Tr = Exclude<Lang, "de">;

export const IMPRESSUM_TR: Record<Tr, LegalDoc> = {
  en: {
    draft: "DRAFT – details in [brackets] are placeholders to be completed by the operator and legally reviewed.",
    sections: [
      ["Information pursuant to § 5 DDG (formerly § 5 TMG)", "[Company name / legal form]\nNEA 1889\nZimmerstraße 26/27\n10969 Berlin"],
      ["Represented by", "[Managing director]"],
      ["Contact", "Phone: [phone number]\nEmail: [email address]"],
      ["Commercial register", "Register court: [local court]\nRegistration number: [HRB …]"],
      ["VAT ID", "VAT identification number pursuant to § 27a UStG: [DE…]"],
      ["Responsible for content (§ 18 (2) MStV)", "[Name], address as above"],
      ["Consumer dispute resolution", "We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board."],
      ["Design", "Art direction & illustration: Saint Gennaro 081 Media Agency Group."],
    ],
  },
  it: {
    draft: "BOZZA – i dati tra [parentesi] sono segnaposto da completare a cura del gestore e da verificare legalmente.",
    sections: [
      ["Informazioni ai sensi del § 5 DDG (già § 5 TMG)", "[Ragione sociale / forma giuridica]\nNEA 1889\nZimmerstraße 26/27\n10969 Berlino"],
      ["Rappresentata da", "[Amministratore]"],
      ["Contatti", "Telefono: [numero di telefono]\nE-mail: [indirizzo e-mail]"],
      ["Registro delle imprese", "Tribunale del registro: [Amtsgericht]\nNumero di registro: [HRB …]"],
      ["Partita IVA", "Numero di identificazione IVA ai sensi del § 27a UStG: [DE…]"],
      ["Responsabile dei contenuti (§ 18 c. 2 MStV)", "[Nome], indirizzo come sopra"],
      ["Risoluzione delle controversie dei consumatori", "Non siamo disposti né obbligati a partecipare a procedure di risoluzione delle controversie davanti a un organismo di conciliazione dei consumatori."],
      ["Design", "Direzione artistica e illustrazione: Saint Gennaro 081 Media Agency Group."],
    ],
  },
  fr: {
    draft: "PROJET – les informations entre [crochets] sont provisoires et doivent être complétées par l'exploitant et vérifiées juridiquement.",
    sections: [
      ["Informations selon le § 5 DDG (anciennement § 5 TMG)", "[Raison sociale / forme juridique]\nNEA 1889\nZimmerstraße 26/27\n10969 Berlin"],
      ["Représentée par", "[Gérant(e)]"],
      ["Contact", "Téléphone : [numéro de téléphone]\nE-mail : [adresse e-mail]"],
      ["Registre du commerce", "Tribunal d'enregistrement : [Amtsgericht]\nNuméro d'immatriculation : [HRB …]"],
      ["Numéro de TVA", "Numéro d'identification TVA selon le § 27a UStG : [DE…]"],
      ["Responsable du contenu (§ 18 al. 2 MStV)", "[Nom], adresse ci-dessus"],
      ["Règlement des litiges de consommation", "Nous ne sommes ni disposés ni tenus de participer à une procédure de règlement des litiges devant un organisme de médiation de la consommation."],
      ["Conception", "Direction artistique & illustration : Saint Gennaro 081 Media Agency Group."],
    ],
  },
  es: {
    draft: "BORRADOR – los datos entre [corchetes] son provisionales y deben ser completados por el titular y revisados legalmente.",
    sections: [
      ["Información según el § 5 DDG (antes § 5 TMG)", "[Razón social / forma jurídica]\nNEA 1889\nZimmerstraße 26/27\n10969 Berlín"],
      ["Representada por", "[Administrador/a]"],
      ["Contacto", "Teléfono: [número de teléfono]\nCorreo: [dirección de correo]"],
      ["Registro mercantil", "Juzgado de registro: [Amtsgericht]\nNúmero de registro: [HRB …]"],
      ["NIF-IVA", "Número de identificación a efectos del IVA según el § 27a UStG: [DE…]"],
      ["Responsable del contenido (§ 18 apdo. 2 MStV)", "[Nombre], dirección indicada arriba"],
      ["Resolución de litigios de consumo", "No estamos dispuestos ni obligados a participar en procedimientos de resolución de litigios ante una junta arbitral de consumo."],
      ["Diseño", "Dirección de arte e ilustración: Saint Gennaro 081 Media Agency Group."],
    ],
  },
  pt: {
    draft: "RASCUNHO – os dados entre [parênteses retos] são provisórios e devem ser completados pelo titular e revistos juridicamente.",
    sections: [
      ["Informação nos termos do § 5 DDG (antigo § 5 TMG)", "[Denominação / forma jurídica]\nNEA 1889\nZimmerstraße 26/27\n10969 Berlim"],
      ["Representada por", "[Gerente]"],
      ["Contacto", "Telefone: [número de telefone]\nE-mail: [endereço de e-mail]"],
      ["Registo comercial", "Tribunal de registo: [Amtsgericht]\nNúmero de registo: [HRB …]"],
      ["NIF/IVA", "Número de identificação para efeitos de IVA nos termos do § 27a UStG: [DE…]"],
      ["Responsável pelo conteúdo (§ 18 n.º 2 MStV)", "[Nome], morada acima indicada"],
      ["Resolução de litígios de consumo", "Não estamos dispostos nem obrigados a participar em procedimentos de resolução de litígios perante uma entidade de resolução alternativa de litígios de consumo."],
      ["Design", "Direção de arte e ilustração: Saint Gennaro 081 Media Agency Group."],
    ],
  },
};

export const DATENSCHUTZ_TR: Record<Tr, LegalDoc> = {
  en: {
    draft: "DRAFT – to be completed by the operator and legally reviewed before publication (hosting provider, reservation system, email delivery).",
    sections: [
      ["1. Controller", "[Company name], Zimmerstraße 26/27, 10969 Berlin, email: [email address]."],
      ["2. Hosting & server log files", "When you visit the website, our hosting provider [name, seat] processes technically necessary data (IP address, time, page accessed, browser). Legal basis: Art. 6(1)(f) GDPR (secure operation). Retention: [x] days."],
      ["3. Online reservations", "For table reservations we process name, email, phone number, party size, date/time and optional notes. Legal basis: Art. 6(1)(b) GDPR (pre-contractual steps). Optional allergy information (possibly health data) is processed only with your consent, Art. 9(2)(a) GDPR. Deletion: [x] days after your visit, unless statutory retention obligations apply."],
      ["4. Cookies & tracking", "This website currently sets no tracking or marketing cookies. Technically necessary local storage is based on § 25(2) TDDDG."],
      ["5. External links", "When you click links to Google Maps or Instagram, the privacy policies of those providers apply."],
      ["6. Your rights", "You have the right of access (Art. 15), rectification (Art. 16), erasure (Art. 17), restriction (Art. 18), data portability (Art. 20), objection (Art. 21) and withdrawal of consent (Art. 7(3) GDPR). You may lodge complaints with the Berlin Commissioner for Data Protection and Freedom of Information."],
    ],
  },
  it: {
    draft: "BOZZA – da completare a cura del gestore e da verificare legalmente prima della pubblicazione (hosting, sistema di prenotazione, invio e-mail).",
    sections: [
      ["1. Titolare del trattamento", "[Ragione sociale], Zimmerstraße 26/27, 10969 Berlino, e-mail: [indirizzo e-mail]."],
      ["2. Hosting e file di log del server", "Quando visiti il sito, il nostro provider di hosting [nome, sede] tratta i dati tecnicamente necessari (indirizzo IP, ora, pagina visitata, browser). Base giuridica: art. 6 par. 1 lett. f GDPR (funzionamento sicuro). Conservazione: [x] giorni."],
      ["3. Prenotazione online", "Per le prenotazioni trattiamo nome, e-mail, numero di telefono, numero di persone, data/ora e note facoltative. Base giuridica: art. 6 par. 1 lett. b GDPR (misure precontrattuali). Le informazioni facoltative su allergie (eventuali dati sanitari) sono trattate solo con il tuo consenso, art. 9 par. 2 lett. a GDPR. Cancellazione: [x] giorni dopo la visita, salvo obblighi legali di conservazione."],
      ["4. Cookie e tracciamento", "Questo sito al momento non utilizza cookie di tracciamento o marketing. La memorizzazione locale tecnicamente necessaria avviene ai sensi del § 25 c. 2 TDDDG."],
      ["5. Link esterni", "Cliccando su link a Google Maps o Instagram si applicano le informative privacy dei rispettivi fornitori."],
      ["6. I tuoi diritti", "Hai diritto di accesso (art. 15), rettifica (art. 16), cancellazione (art. 17), limitazione (art. 18), portabilità (art. 20), opposizione (art. 21) e revoca del consenso (art. 7 par. 3 GDPR). Puoi presentare reclamo alla Commissaria per la protezione dei dati e la libertà d'informazione di Berlino."],
    ],
  },
  fr: {
    draft: "PROJET – à compléter par l'exploitant et à vérifier juridiquement avant publication (hébergeur, système de réservation, envoi d'e-mails).",
    sections: [
      ["1. Responsable du traitement", "[Raison sociale], Zimmerstraße 26/27, 10969 Berlin, e-mail : [adresse e-mail]."],
      ["2. Hébergement & fichiers journaux", "Lors de la consultation du site, notre hébergeur [nom, siège] traite les données techniquement nécessaires (adresse IP, heure, page consultée, navigateur). Base juridique : art. 6, par. 1, point f RGPD (fonctionnement sécurisé). Durée de conservation : [x] jours."],
      ["3. Réservation en ligne", "Pour les réservations, nous traitons nom, e-mail, téléphone, nombre de personnes, date/heure et remarques facultatives. Base juridique : art. 6, par. 1, point b RGPD (mesures précontractuelles). Les informations facultatives sur les allergies (éventuellement des données de santé) ne sont traitées qu'avec votre consentement, art. 9, par. 2, point a RGPD. Suppression : [x] jours après la visite, sauf obligations légales de conservation."],
      ["4. Cookies & suivi", "Ce site n'utilise actuellement aucun cookie de suivi ou marketing. Le stockage local techniquement nécessaire repose sur le § 25, al. 2 TDDDG."],
      ["5. Liens externes", "En cliquant sur des liens vers Google Maps ou Instagram, les politiques de confidentialité de ces fournisseurs s'appliquent."],
      ["6. Vos droits", "Vous disposez d'un droit d'accès (art. 15), de rectification (art. 16), d'effacement (art. 17), de limitation (art. 18), de portabilité (art. 20), d'opposition (art. 21) et de retrait du consentement (art. 7, par. 3 RGPD). Vous pouvez adresser une réclamation à la Commissaire berlinoise à la protection des données et à la liberté d'information."],
    ],
  },
  es: {
    draft: "BORRADOR – debe completarlo el titular y revisarse jurídicamente antes de su publicación (proveedor de hosting, sistema de reservas, envío de correos).",
    sections: [
      ["1. Responsable del tratamiento", "[Razón social], Zimmerstraße 26/27, 10969 Berlín, correo: [dirección de correo]."],
      ["2. Hosting y archivos de registro", "Al visitar el sitio web, nuestro proveedor de hosting [nombre, sede] trata datos técnicamente necesarios (dirección IP, hora, página visitada, navegador). Base jurídica: art. 6.1.f RGPD (funcionamiento seguro). Conservación: [x] días."],
      ["3. Reserva online", "Para las reservas tratamos nombre, correo, teléfono, número de personas, fecha/hora y observaciones voluntarias. Base jurídica: art. 6.1.b RGPD (medidas precontractuales). La información voluntaria sobre alergias (posibles datos de salud) solo se trata con tu consentimiento, art. 9.2.a RGPD. Supresión: [x] días después de la visita, salvo obligaciones legales de conservación."],
      ["4. Cookies y seguimiento", "Actualmente este sitio no utiliza cookies de seguimiento ni de marketing. El almacenamiento local técnicamente necesario se basa en el § 25.2 TDDDG."],
      ["5. Enlaces externos", "Al hacer clic en enlaces a Google Maps o Instagram se aplican las políticas de privacidad de dichos proveedores."],
      ["6. Tus derechos", "Tienes derecho de acceso (art. 15), rectificación (art. 16), supresión (art. 17), limitación (art. 18), portabilidad (art. 20), oposición (art. 21) y retirada del consentimiento (art. 7.3 RGPD). Puedes presentar reclamaciones ante la Comisionada de Protección de Datos y Libertad de Información de Berlín."],
    ],
  },
  pt: {
    draft: "RASCUNHO – a completar pelo titular e a rever juridicamente antes da publicação (fornecedor de alojamento, sistema de reservas, envio de e-mails).",
    sections: [
      ["1. Responsável pelo tratamento", "[Denominação], Zimmerstraße 26/27, 10969 Berlim, e-mail: [endereço de e-mail]."],
      ["2. Alojamento e ficheiros de registo", "Ao visitar o site, o nosso fornecedor de alojamento [nome, sede] trata dados tecnicamente necessários (endereço IP, hora, página visitada, navegador). Fundamento jurídico: art. 6.º, n.º 1, al. f) RGPD (funcionamento seguro). Conservação: [x] dias."],
      ["3. Reserva online", "Para reservas tratamos nome, e-mail, telefone, número de pessoas, data/hora e observações facultativas. Fundamento jurídico: art. 6.º, n.º 1, al. b) RGPD (diligências pré-contratuais). Informações facultativas sobre alergias (eventuais dados de saúde) só são tratadas com o seu consentimento, art. 9.º, n.º 2, al. a) RGPD. Eliminação: [x] dias após a visita, salvo obrigações legais de conservação."],
      ["4. Cookies e rastreamento", "Este site não utiliza atualmente cookies de rastreamento ou marketing. O armazenamento local tecnicamente necessário baseia-se no § 25, n.º 2 TDDDG."],
      ["5. Ligações externas", "Ao clicar em ligações para o Google Maps ou Instagram, aplicam-se as políticas de privacidade desses fornecedores."],
      ["6. Os seus direitos", "Tem direito de acesso (art. 15.º), retificação (art. 16.º), apagamento (art. 17.º), limitação (art. 18.º), portabilidade (art. 20.º), oposição (art. 21.º) e retirada do consentimento (art. 7.º, n.º 3 RGPD). Pode apresentar reclamação à Comissária de Proteção de Dados e Liberdade de Informação de Berlim."],
    ],
  },
};