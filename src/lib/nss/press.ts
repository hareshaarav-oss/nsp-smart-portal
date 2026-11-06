import { academicYear, formatLongDate, todayIso } from "./format";
import { compressSlideJpeg, getMedia } from "./media";
import { logoDataUrls, openHtmlDocumentWhenReady } from "./print";
import { eventPhotoDataUrls } from "./reports";
import { isDemoRecord } from "./seed";
import { presentVolunteers } from "./store";
import type { GalleryItem, NssEvent, PortalSettings, PortalState, Volunteer } from "./types";

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&" + "amp;")
    .replaceAll("<", "&" + "lt;")
    .replaceAll(">", "&" + "gt;")
    .replaceAll('"', "&" + "quot;");
}

type Kind =
  | "blood"
  | "plantation"
  | "camp"
  | "yoga"
  | "republic"
  | "independence"
  | "gandhi"
  | "ambedkar"
  | "nssday"
  | "teachers"
  | "voter"
  | "women"
  | "clean"
  | "water"
  | "health"
  | "literacy"
  | "rally"
  | "awareness"
  | "youth"
  | "environment"
  | "relief"
  | "general";

function programmeKind(event: NssEvent): Kind {
  const hay = `${event.name} ${event.description || ""} ${event.category || ""} ${event.location || ""} ${event.campName || ""}`.toLowerCase();
  const has = (...words: string[]) => words.some((word) => hay.includes(word));
  if (has("રક્ત", "blood", "બ્લડ")) return "blood";
  if (has("વૃક્ષ", "plantation", "tree", "રોપણ", "વનમહોત્સવ")) return "plantation";
  if (event.activityType === "special_camp" || has("શિબિર", "camp")) return "camp";
  if (has("યોગ", "yoga")) return "yoga";
  if (has("પ્રજાસત્તા", "republic", "ગણતંત્ર")) return "republic";
  if (has("સ્વતંત્રતા", "independence")) return "independence";
  if (has("ગાંધી", "gandhi")) return "gandhi";
  if (has("આંબેડકર", "ambedkar", "બંધારણ", "constitution")) return "ambedkar";
  if (has("nss day", "એનએસએસ દિવસ", "રાષ્ટ્રીય સેવા યોજના દિવસ")) return "nssday";
  if (has("શિક્ષક", "teacher")) return "teachers";
  if (has("મતદાર", "voter", "ચૂંટણી", "election")) return "voter";
  if (has("મહિલા", "બેટી", "beti", "women")) return "women";
  if (has("સ્વચ્છ", "swachh", "clean", "સફાઈ", "પ્લાસ્ટિક", "plastic")) return "clean";
  if (has("જળ", "water", "નદી")) return "water";
  if (has("આરોગ્ય", "health", "medical", "આંખ", "ડેન્ટલ")) return "health";
  if (has("સાક્ષરતા", "literacy", "વાંચન")) return "literacy";
  if (has("રેલી", "rally", "પરેડ", "parade", "પ્રભાત")) return "rally";
  if (has("જાગૃતિ", "awareness", "નિબંધ", "વક્તૃત્વ", "elocution", "સેમિનાર", "seminar")) return "awareness";
  if (has("યુવા", "youth")) return "youth";
  if (has("પર્યાવરણ", "environment", "climate")) return "environment";
  if (has("રાહત", "relief", "દાન", "donation")) return "relief";
  return "general";
}

function whenWhere(event: NssEvent) {
  const start = formatLongDate(event.date);
  const end = event.endDate && event.endDate.slice(0, 10) !== String(event.date || "").slice(0, 10) ? formatLongDate(event.endDate) : "";
  const place = (event.campLocation || event.location || "કોલેજ પરિસર").trim() || "કોલેજ પરિસર";
  return { when: end ? `${start} થી ${end}` : start, start, place };
}

const GU_COPY: Record<Kind, { purpose: string; work: string; close: string }> = {
  blood: {
    purpose: "આ રક્તદાન કાર્યક્રમનો ઉદ્દેશ જીવનદાનની ભાવના જગાડવાનો અને જરૂરિયાતમંદ દર્દીઓ માટે રક્ત એકત્ર કરવાનો હતો.",
    work: "સ્વયંસેવકોએ દાતાઓની નોંધણી, હરોળ અને શિબિરની વ્યવસ્થામાં સેવા આપી. રક્તદાન એ સૌથી મોટું દાન છે તે સંદેશ સૌ સુધી પહોંચાડવામાં આવ્યો.",
    close: "આચાર્યશ્રીએ રક્તદાનને નિયમિત સેવા બનાવવા પ્રેર્યા અને કાર્યક્રમ અધિકારીએ દાતાઓ તથા સ્વયંસેવકોનો આભાર માન્યો.",
  },
  plantation: {
    purpose: "આ વૃક્ષારોપણનો ઉદ્દેશ પર્યાવરણનું રક્ષણ અને હરિયાળી વધારવાનો હતો.",
    work: "સ્વયંસેવકોએ રોપા વાવ્યા, પાણી સીંચ્યું અને તેમની સંભાળની જવાબદારી સ્વીકારી. વૃક્ષ જીવન છે તે સંદેશ આપવામાં આવ્યો.",
    close: "આચાર્યશ્રીએ વાવેલા રોપાને ઉછેરવા અનુરોધ કર્યો અને કાર્યક્રમ અધિકારીએ હરિયાળા પરિસરની પ્રતિજ્ઞા કરાવી.",
  },
  camp: {
    purpose: "આ વિશેષ શિબિરનો ઉદ્દેશ ગામ સાથે રહીને સેવા, સ્વચ્છતા અને સમાજજાગૃતિના કામને સતત સાત દિવસ સુધી આગળ ધપાવવાનો હતો.",
    work: "સ્વયંસેવકોએ શિબિર સ્થળે રહીને ગામની જરૂર મુજબ સફાઈ, જાગૃતિ, સર્વે અને સાંસ્કૃતિક કાર્યક્રમો કર્યા.",
    close: "આચાર્યશ્રીએ શિબિરની શિસ્તની પ્રશંસા કરી અને કાર્યક્રમ અધિકારીએ ગ્રામજનોનો સહકાર નોંધ્યો.",
  },
  yoga: {
    purpose: "આ યોગ કાર્યક્રમનો ઉદ્દેશ તંદુરસ્ત જીવન અને મનની શાંતિ અંગેની આદત કેળવવાનો હતો.",
    work: "સ્વયંસેવકોએ સૂર્યનમસ્કાર, આસન અને પ્રાણાયામમાં ભાગ લીધો તથા નિયમિત યોગનો સંદેશ આપ્યો.",
    close: "આચાર્યશ્રીએ યોગને રોજિંદા અભ્યાસ સાથે જોડવા કહ્યું અને કાર્યક્રમ અધિકારીએ આંતરરાષ્ટ્રીય યોગ દિવસની ભાવના સમજાવી.",
  },
  republic: {
    purpose: "આ કાર્યક્રમનો ઉદ્દેશ બંધારણ, લોકશાહી અને પ્રજાસત્તાક દિવસના મૂલ્યો યાદ કરવાનો હતો.",
    work: "સ્વયંસેવકોએ ધ્વજવંદન, પ્રતિજ્ઞા અને બંધારણની પ્રસ્તાવનાના વિચારોમાં ભાગ લીધો.",
    close: "આચાર્યશ્રીએ બંધારણ પ્રત્યેની નિષ્ઠા જાળવવા અનુરોધ કર્યો અને કાર્યક્રમ અધિકારીએ ગણતંત્ર દિવસની શુભેચ્છા પાઠવી.",
  },
  independence: {
    purpose: "આ કાર્યક્રમનો ઉદ્દેશ સ્વતંત્રતા સંગ્રામની યાદ અને નાગરિકની ફરજો તાજી કરવાનો હતો.",
    work: "સ્વયંસેવકોએ ધ્વજવંદન, દેશભક્તિના ગીતો અને સ્વતંત્રતા સેનાનીઓને શ્રદ્ધાંજલિ આપી.",
    close: "આચાર્યશ્રીએ સ્વતંત્રતાનું રક્ષણ સેવા દ્વારા કરવા પ્રેર્યા અને કાર્યક્રમ અધિકારીએ સ્વતંત્રતા દિવસની શુભેચ્છા પાઠવી.",
  },
  gandhi: {
    purpose: "આ કાર્યક્રમનો ઉદ્દેશ ગાંધીજીની સ્વચ્છતા, સત્ય અને અહિંસાની વિચારધારા આચરવાનો હતો.",
    work: "સ્વયંસેવકોએ સ્વચ્છતા, પ્રાર્થના અને ગાંધીવિચારની ચર્ચામાં સક્રિય ભાગ લીધો.",
    close: "આચાર્યશ્રીએ સ્વચ્છતાને રોજિંદી ટેવ બનાવવા કહ્યું અને કાર્યક્રમ અધિકારીએ ગાંધી જયંતીની ભાવના સમજાવી.",
  },
  ambedkar: {
    purpose: "આ કાર્યક્રમનો ઉદ્દેશ ડૉ. બાબાસાહેબ આંબેડકર અને બંધારણીય મૂલ્યોનું સન્માન કરવાનો હતો.",
    work: "સ્વયંસેવકોએ સમાનતા, શિક્ષણ અને ન્યાયના વિચારો પર આધારિત કાર્યક્રમમાં ભાગ લીધો.",
    close: "આચાર્યશ્રીએ બંધારણના મૂલ્યો જીવનમાં ઉતારવા અનુરોધ કર્યો અને કાર્યક્રમ અધિકારીએ આંબેડકર જયંતીની શુભેચ્છા પાઠવી.",
  },
  nssday: {
    purpose: "આ કાર્યક્રમનો ઉદ્દેશ રાષ્ટ્રીય સેવા યોજનાનો જન્મદિવસ અને ‘નહીં હું, પણ તમે’ની ભાવના યાદ કરવાનો હતો.",
    work: "સ્વયંસેવકોએ NSS દિવસની પ્રતિજ્ઞા, સેવાના અનુભવો અને એકમની સિદ્ધિઓ રજૂ કરી.",
    close: "આચાર્યશ્રીએ વર્ષભર સેવામાં જોડાયેલા રહેવા કહ્યું અને કાર્યક્રમ અધિકારીએ NSS પરિવારને અભિનંદન આપ્યા.",
  },
  teachers: {
    purpose: "આ કાર્યક્રમનો ઉદ્દેશ શિક્ષકોના ઋણ અને શિક્ષણના મૂલ્યને વંદન કરવાનો હતો.",
    work: "સ્વયંસેવકોએ ગુરુ પૂજન, આભાર અને શિક્ષક દિવસની પ્રવૃત્તિમાં ભાગ લીધો.",
    close: "આચાર્યશ્રીએ શિક્ષક અને વિદ્યાર્થીના સંબંધને સેવા સાથે જોડ્યો અને કાર્યક્રમ અધિકારીએ શિક્ષક દિવસની શુભેચ્છા પાઠવી.",
  },
  voter: {
    purpose: "આ કાર્યક્રમનો ઉદ્દેશ મતદાન એ લોકશાહીની ફરજ છે તે સમજાવવાનો હતો.",
    work: "સ્વયંસેવકોએ મતદાર જાગૃતિ, નવા મતદારોની નોંધણીની માહિતી અને લોકશાહીની પ્રતિજ્ઞામાં ભાગ લીધો.",
    close: "આચાર્યશ્રીએ પ્રથમ વાર મત આપવા પ્રેર્યા અને કાર્યક્રમ અધિકારીએ શાંતિપૂર્ણ મતદાનનો સંદેશ આપ્યો.",
  },
  women: {
    purpose: "આ કાર્યક્રમનો ઉદ્દેશ બાળકી અને મહિલાના સન્માન, સલામતી અને શિક્ષણની વાત આગળ ધપાવવાનો હતો.",
    work: "સ્વયંસેવકોએ જાગૃતિ, ચર્ચા અને સન્માનના સંદેશ સાથે કાર્યક્રમમાં ભાગ લીધો.",
    close: "આચાર્યશ્રીએ સમાન અવસરની વાત કરી અને કાર્યક્રમ અધિકારીએ દરેક સ્વયંસેવકને આ સંદેશ ઘર સુધી લઈ જવા કહ્યું.",
  },
  clean: {
    purpose: "આ સ્વચ્છતા કાર્યક્રમનો ઉદ્દેશ પરિસર, રસ્તો અને જાહેર સ્થળને સ્વચ્છ રાખવાની ટેવ કેળવવાનો હતો.",
    work: "સ્વયંસેવકોએ કચરો એકત્ર કર્યો, પ્લાસ્ટિક અલગ પાડ્યું અને સ્વચ્છતાની પ્રતિજ્ઞા લીધી.",
    close: "આચાર્યશ્રીએ સ્વચ્છતાને એક દિવસની પ્રવૃત્તિ નહીં પણ રોજિંદી ફરજ ગણવા કહ્યું અને કાર્યક્રમ અધિકારીએ શ્રમનું સન્માન કર્યું.",
  },
  water: {
    purpose: "આ કાર્યક્રમનો ઉદ્દેશ જળસંચય અને પાણીના બચાવની જરૂર સમજાવવાનો હતો.",
    work: "સ્વયંસેવકોએ જળસ્ત્રોતની સફાઈ, બચાવની માહિતી અને વરસાદી પાણી અંગેની જાગૃતિમાં ભાગ લીધો.",
    close: "આચાર્યશ્રીએ પાણી બચાવને ઘરેથી શરૂ કરવા કહ્યું અને કાર્યક્રમ અધિકારીએ આ કામ ચાલુ રાખવા અનુરોધ કર્યો.",
  },
  health: {
    purpose: "આ આરોગ્ય કાર્યક્રમનો ઉદ્દેશ તપાસ, જાગૃતિ અને સ્વસ્થ ટેવો અંગે માર્ગદર્શન આપવાનો હતો.",
    work: "સ્વયંસેવકોએ નોંધણી, હરોળ અને આરોગ્ય સંદેશ પહોંચાડવામાં સેવા આપી.",
    close: "આચાર્યશ્રીએ નિયમિત તપાસની સલાહ આપી અને કાર્યક્રમ અધિકારીએ તબીબી ટીમનો આભાર માન્યો.",
  },
  literacy: {
    purpose: "આ કાર્યક્રમનો ઉદ્દેશ વાંચન, સાક્ષરતા અને શિક્ષણની તક દરેક સુધી પહોંચાડવાનો હતો.",
    work: "સ્વયંસેવકોએ વાંચન, માર્ગદર્શન અને સાક્ષરતાના સંદેશ સાથે પ્રવૃત્તિ કરી.",
    close: "આચાર્યશ્રીએ વાંચનને દરરોજની ટેવ બનાવવા કહ્યું અને કાર્યક્રમ અધિકારીએ આ કામ ગામ સુધી લઈ જવા અનુરોધ કર્યો.",
  },
  rally: {
    purpose: "આ રેલીનો ઉદ્દેશ કાર્યક્રમનો સંદેશ રસ્તે અને સમાજ સુધી સીધો પહોંચાડવાનો હતો.",
    work: "સ્વયંસેવકોએ પ્લેકાર્ડ, ઘોષણા અને શિસ્તબદ્ધ રેલી દ્વારા સંદેશ આપ્યો.",
    close: "આચાર્યશ્રીએ શિસ્તપૂર્વકની રેલીની પ્રશંસા કરી અને કાર્યક્રમ અધિકારીએ સંદેશને આચરણમાં લાવવા કહ્યું.",
  },
  awareness: {
    purpose: "આ જાગૃતિ કાર્યક્રમનો ઉદ્દેશ વિષયની સાચી માહિતી સરળ ભાષામાં સમજાવવાનો હતો.",
    work: "સ્વયંસેવકોએ ચર્ચા, વક્તવ્ય અને માહિતી આપીને હાજર સૌને વિષય સાથે જોડ્યા.",
    close: "આચાર્યશ્રીએ જાણકારીને આચરણમાં ફેરવવા કહ્યું અને કાર્યક્રમ અધિકારીએ સ્પષ્ટ સંદેશ માટે અભિનંદન આપ્યા.",
  },
  youth: {
    purpose: "આ યુવા કાર્યક્રમનો ઉદ્દેશ યુવાનોની શક્તિને સેવા અને રાષ્ટ્રનિર્માણ સાથે જોડવાનો હતો.",
    work: "સ્વયંસેવકોએ યુવા દિવસની પ્રવૃત્તિ, ચર્ચા અને સેવાની પ્રતિજ્ઞામાં ભાગ લીધો.",
    close: "આચાર્યશ્રીએ યુવાનોને જવાબદાર નાગરિક બનવા પ્રેર્યા અને કાર્યક્રમ અધિકારીએ સ્વામી વિવેકાનંદની ભાવના યાદ કરાવી.",
  },
  environment: {
    purpose: "આ પર્યાવરણ કાર્યક્રમનો ઉદ્દેશ કુદરત સાચવવાની જવાબદારી વિદ્યાર્થીઓ સુધી પહોંચાડવાનો હતો.",
    work: "સ્વયંસેવકોએ પર્યાવરણ બચાવ, કચરો ઘટાડવા અને લીલી આદતોની પ્રવૃત્તિ કરી.",
    close: "આચાર્યશ્રીએ પર્યાવરણને પરીક્ષા પૂરતો વિષય ન ગણવા કહ્યું અને કાર્યક્રમ અધિકારીએ નાની ટેવથી મોટો ફેરફાર થાય તેવું સમજાવ્યું.",
  },
  relief: {
    purpose: "આ કાર્યક્રમનો ઉદ્દેશ જરૂરિયાતમંદ સુધી સહાય અને માનવતાનો હાથ પહોંચાડવાનો હતો.",
    work: "સ્વયંસેવકોએ એકત્રીકરણ, વહેંચણી અને મદદની વ્યવસ્થામાં સેવા આપી.",
    close: "આચાર્યશ્રીએ માનવતાની પ્રશંસા કરી અને કાર્યક્રમ અધિકારીએ મદદને ગૌરવપૂર્વક આગળ ધપાવવા અનુરોધ કર્યો.",
  },
  general: {
    purpose: "આ કાર્યક્રમનો ઉદ્દેશ NSSની સેવા, શિસ્ત અને સામાજિક જવાબદારીને આ પ્રવૃત્તિ દ્વારા આગળ ધપાવવાનો હતો.",
    work: "સ્વયંસેવકોએ કાર્યક્રમની જરૂર મુજબ તૈયારી, હાજરી અને સેવામાં સીધો ભાગ લીધો.",
    close: "આચાર્યશ્રીએ આવા સેવાકીય કાર્યમાં સતત જોડાયેલા રહેવા પ્રેર્યા અને કાર્યક્રમ અધિકારીએ સૌના શ્રમનો આભાર માન્યો.",
  },
};

const EN_COPY: Record<Kind, { objective: string; work: string }> = {
  blood: {
    objective: "To organise a blood donation service and encourage voluntary donors.",
    work: "Volunteers managed registration, queues and the donor area, and carried the message that blood donation is a life-saving service.",
  },
  plantation: {
    objective: "To plant trees and accept responsibility for their care.",
    work: "Volunteers planted saplings, watered them and pledged to protect the green cover.",
  },
  camp: {
    objective: "To live and serve in the adopted village through the special camp.",
    work: "Volunteers stayed at the camp and carried out the village work planned for the camp days.",
  },
  yoga: {
    objective: "To practise yoga and promote a healthy daily routine.",
    work: "Volunteers joined the asanas and breathing practice and shared the habit of regular yoga.",
  },
  republic: {
    objective: "To mark Republic Day and recall the values of the Constitution.",
    work: "Volunteers took part in the flag salute and the pledge to the Constitution.",
  },
  independence: {
    objective: "To mark Independence Day and remember the duties of a citizen.",
    work: "Volunteers joined the flag salute and paid tribute to the freedom struggle.",
  },
  gandhi: {
    objective: "To practise Gandhiji’s message of cleanliness, truth and non-violence.",
    work: "Volunteers joined the cleanliness work and the reading of Gandhi’s ideas.",
  },
  ambedkar: {
    objective: "To honour Dr B. R. Ambedkar and the constitutional values of equality and justice.",
    work: "Volunteers took part in the programme on equality, education and the Constitution.",
  },
  nssday: {
    objective: "To observe NSS Day and renew the motto “Not Me, But You”.",
    work: "Volunteers renewed the NSS pledge and presented the unit’s year of service.",
  },
  teachers: {
    objective: "To honour teachers and the place of education in nation-building.",
    work: "Volunteers joined the Teachers’ Day greeting and the programme of respect for teachers.",
  },
  voter: {
    objective: "To explain that voting is a duty in a democracy.",
    work: "Volunteers shared voter awareness and the steps for a new voter’s registration.",
  },
  women: {
    objective: "To speak for the dignity, safety and education of girls and women.",
    work: "Volunteers carried that message through the programme held for this theme.",
  },
  clean: {
    objective: "To clean a public place and build the habit of not littering.",
    work: "Volunteers collected waste, separated plastic and took a cleanliness pledge.",
  },
  water: {
    objective: "To explain water conservation and the care of local water sources.",
    work: "Volunteers joined the water message and the cleaning of the water point taken up in this programme.",
  },
  health: {
    objective: "To support a health activity and share a clear health message.",
    work: "Volunteers helped with registration and with guiding people through the health activity.",
  },
  literacy: {
    objective: "To promote reading and the chance of education for everyone.",
    work: "Volunteers took part in the reading and literacy activity planned for the day.",
  },
  rally: {
    objective: "To take the programme message into the street in an orderly rally.",
    work: "Volunteers walked with placards and slogans matched to this programme.",
  },
  awareness: {
    objective: "To explain the theme of the programme in plain language.",
    work: "Volunteers spoke, discussed and shared the information prepared for this theme.",
  },
  youth: {
    objective: "To connect the energy of young people with service.",
    work: "Volunteers joined the youth programme and the pledge of responsible citizenship.",
  },
  environment: {
    objective: "To take responsibility for the environment beyond one day’s event.",
    work: "Volunteers joined the environment activity named in this programme.",
  },
  relief: {
    objective: "To carry help to people who need it.",
    work: "Volunteers helped collect and organise the relief taken up in this programme.",
  },
  general: {
    objective: "To carry out the named NSS activity with discipline and public service.",
    work: "Volunteers took the roles required by this programme and completed the work on the ground.",
  },
};

function attendanceSentence(count: number, hours: number, beneficiaries?: number) {
  const bits = [
    count > 0 ? `આ કાર્યક્રમમાં ${count} NSS સ્વયંસેવકોએ હાજરી આપી હતી` : "NSS સ્વયંસેવકોએ કાર્યક્રમમાં ભાગ લીધો હતો",
  ];
  if (hours > 0) bits.push(`હાજર સ્વયંસેવક દીઠ ${hours} કલાકની સેવા નોંધાઈ હતી`);
  if (beneficiaries && beneficiaries > 0) bits.push(`લાભાર્થીઓની નોંધાયેલી સંખ્યા ${beneficiaries} હતી`);
  return `${bits.join(". ")}.`;
}

export function defaultGujaratiPress(event: NssEvent, settings: PortalSettings, presentCount: number) {
  const name = event.name.trim() || "NSS કાર્યક્રમ";
  const { when, place } = whenWhere(event);
  const copy = GU_COPY[programmeKind(event)];
  const principal = settings.principalName?.trim() || "આચાર્યશ્રી";
  const po = settings.poName?.trim() || "કાર્યક્રમ અધિકારી";
  const note = event.description?.trim();
  const camp = event.campName?.trim();
  return `માણસા. એસ.ડી. આર્ટ્સ એન્ડ શાહ બી.આર. કોમર્સ કોલેજના રાષ્ટ્રીય સેવા યોજના એકમ દ્વારા તા. ${when}ના રોજ ${place} ખાતે “${name}” કાર્યક્રમ યોજાયો હતો.${camp ? ` શિબિર: ${camp}.` : ""} આચાર્ય ${principal}ના માર્ગદર્શન અને કાર્યક્રમ અધિકારી ${po}ના નેતૃત્વમાં આ કાર્યક્રમ આયોજિત થયો હતો.

${copy.purpose}

${copy.work}${note ? `\n\nકાર્યક્રમની નોંધ: ${note}` : ""}

${attendanceSentence(presentCount, Number(event.hours) || 0, event.beneficiaries)}

${copy.close}

— NSS એકમ, એસ.ડી. આર્ટ્સ એન્ડ શાહ બી.આર. કોમર્સ કોલેજ, માણસા —`;
}

export function defaultNaacEnglish(event: NssEvent, settings: PortalSettings, present: Volunteer[]) {
  const names = present.map((v, i) => `${i + 1}. ${v.fullName} (${v.volunteerId})`).join("\n");
  const kind = programmeKind(event);
  const copy = EN_COPY[kind];
  const { place, start } = whenWhere(event);
  const note = event.description?.trim();
  return `NAAC / IQAC ACTIVITY REPORT
${settings.collegeName}
National Service Scheme (NSS)

1. Title of the activity: ${event.name}
2. Date: ${start}
3. Venue: ${place}
4. Organising unit: NSS Unit, ${settings.collegeShort}
5. Programme Officer: ${settings.poName}
6. Principal: ${settings.principalName}
7. Academic year: ${academicYear(event.date)}
8. Number of student participants: ${present.length}
9. Service hours credited per volunteer: ${event.hours}
10. Activity type: ${kind === "general" ? event.category || "Regular NSS activity" : kind.replaceAll("_", " ")}

11. Objectives
• ${copy.objective}
• To record the real programme, place, hours and attendance for the NAAC / IQAC file.
• To keep the evidence with the photographs of this activity only.

12. Brief report
The NSS unit organised “${event.name}” at ${place} on ${start} under the guidance of the Principal, ${settings.principalName}, and the Programme Officer, ${settings.poName}. ${copy.work}${note ? ` Officer’s note: ${note}` : ""}

13. Outcomes
• ${present.length > 0 ? `${present.length} volunteers were present` : "Attendance was not marked on this record"}${Number(event.hours) > 0 ? ` and ${event.hours} service hours were credited to each present volunteer` : ""}.
• The report follows this programme. It is not a common note copied for every activity.
• Photographs attached to this activity, if any, are part of the file.

14. Attendance annexure
${names || "—"}

Prepared on ${formatLongDate(todayIso())}
NSS Smart Portal`;
}

export async function openGujaratiPress(opts: {
  state: PortalState;
  event: NssEvent;
  body: string;
  photos?: string[];
}) {
  return openHtmlDocumentWhenReady(async () => {
  const logos = await logoDataUrls();
  const photos = (opts.photos ?? (await eventPhotoDataUrls(opts.state, opts.event.id))).slice(0, 12);
  const present = presentVolunteers(opts.state, opts.event.id);
  const list = present
    .map((v) => `<li>${escapeHtml(v.fullName)} <span class="id">${escapeHtml(v.volunteerId)}</span></li>`)
    .join("");
  const paras = opts.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const photoBlock = (src: string, i: number) => `<figure><img src="${src}" alt="" /><figcaption>${escapeHtml(["કાર્યક્રમની તસવીર", "સેવાકીય પ્રવૃત્તિની તસવીર", "NSS સ્વયંસેવકોની તસવીર"][i % 3])}</figcaption></figure>`;
  const bodyHtml = paras.map((p, i) => {
    const block = `<p>${escapeHtml(p).replaceAll("\n", "<br/>")}</p>`;
    if (i === 1 && photos[0]) return `${block}<div class="feature-photo">${photoBlock(photos[0], 0)}</div>`;
    if (i === 3 && photos.length > 1) return `${block}<div class="photo-row">${photos.slice(1, 3).map(photoBlock).join("")}</div>`;
    return block;
  }).join("");
  const remainingPhotos = photos.slice(3).map(photoBlock).join("");
  const html = `<!doctype html>
<html><head><meta charset="utf-8" /><title>Press note — ${escapeHtml(opts.event.name)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati:wght@400;600;700&family=Noto+Serif:wght@600;700&display=swap" />
<style>
@page{size:A4;margin:11mm 12mm}*{box-sizing:border-box}html,body{margin:0;background:#eee7d8}body{font-family:"Noto Sans Gujarati","Noto Sans",sans-serif;color:#211d18}.wrap{padding:12px}#print-root{background:#fff;max-width:210mm;margin:0 auto;padding:15px 18px 22px;box-shadow:0 2px 16px #0001}.head{display:flex;align-items:center;gap:12px;border-bottom:1px solid #b9892e;padding-bottom:9px}.head img{width:65px;height:65px;object-fit:contain}.mid{flex:1;text-align:center}.mid h1{margin:0;font-family:"Noto Serif",serif;font-size:18px;color:#173b29}.mid h2{margin:4px 0 0;font-size:13px;color:#173b29}.mid p{margin:4px 0 0;font-size:11px}.tri{height:4px;display:flex;margin:7px 0 13px}.tri span{flex:1}.title{text-align:center;font-family:"Noto Serif",serif;font-size:21px;color:#9d1b16;margin:0 0 4px}.date{text-align:right;font-weight:700;font-size:12px;margin:0 0 12px}.body p{font-size:13.5px;line-height:1.72;text-align:justify;margin:0 0 9px}.feature-photo figure{margin:10px auto 12px;max-width:88%}.feature-photo img{width:100%;height:225px;object-fit:cover}.photo-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0 12px}.photo-row figure,.more-photos figure{margin:0}.photo-row img{width:100%;height:145px;object-fit:cover}.more-photos{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}.more-photos img{width:100%;height:145px;object-fit:cover}.more-photos figure:nth-child(3){grid-column:1/-1}.more-photos figure:nth-child(3) img{height:190px}.caption,figcaption{font-size:10.5px;text-align:center;color:#555;margin-top:3px;font-style:italic}.annexure{margin-top:16px;border-top:1px solid #b9892e;padding-top:9px}.annexure h3{font-size:14px;color:#173b29;margin:0 0 7px}.annexure ol{columns:2;padding-left:22px;margin:0}.annexure li{font-size:11.5px;margin:0 0 3px;break-inside:avoid}.id{color:#777;font-size:9.5px}footer{text-align:center;border-top:1px solid #ddd;margin-top:14px;padding-top:8px;font-size:11px;color:#555}.no-print{text-align:center;margin-top:14px}.no-print button{min-height:42px;padding:8px 18px;border:0;border-radius:8px;font-weight:700;cursor:pointer}.print{background:#176b3a;color:#fff}@media print{html,body{background:#fff!important}body *{visibility:hidden!important}#print-root,#print-root *{visibility:visible!important}#print-root{position:absolute;left:0;top:0;width:100%;padding:0;box-shadow:none}.no-print{display:none!important}}
</style></head><body><div class="wrap"><article id="print-root">
<div class="head"><img src="${logos.college}" alt="" /><div class="mid"><h1>એસ.ડી. આર્ટ્સ એન્ડ શાહ બી.આર. કોમર્સ કોલેજ, માણસા</h1><h2>રાષ્ટ્રીય સેવા યોજના (NSS)</h2><p>પ્રોગ્રામ ઑફિસર: ${escapeHtml(opts.state.settings.poName)}</p></div><img src="${logos.nss}" alt="" /></div>
<div class="tri"><span style="background:#ff9933"></span><span style="background:#fff;outline:1px solid #ddd"></span><span style="background:#138808"></span></div>
<h2 class="title">${escapeHtml(opts.event.name)}</h2><p class="date">માણસા, ${escapeHtml(formatLongDate(opts.event.date))}</p>
<div class="body">${bodyHtml}</div>
${remainingPhotos ? `<div class="more-photos">${remainingPhotos}</div>` : ""}
<div class="annexure"><h3>કાર્યક્રમમાં ભાગ લેનાર NSS સ્વયંસેવકો · કુલ ${present.length}</h3>${list ? `<ol>${list}</ol>` : `<p>હાજરી નોંધાઈ નથી.</p>`}</div>
<footer>— NSS એકમ, એસ.ડી. આર્ટ્સ એન્ડ શાહ બી.આર. કોમર્સ કોલેજ, માણસા —</footer>
</article><p class="no-print"><button class="print" onclick="window.print()">Print / Save PDF</button></p></div></body></html>`;
  return html;
  });
}

export async function openNaacReport(opts: {
  state: PortalState;
  event: NssEvent;
  body: string;
  photos?: string[];
}) {
  return openHtmlDocumentWhenReady(async () => {
  const logos = await logoDataUrls();
  const photos = opts.photos ?? (await eventPhotoDataUrls(opts.state, opts.event.id));
  const present = presentVolunteers(opts.state, opts.event.id);
  const list = present
    .map((v, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(v.volunteerId)}</td><td>${escapeHtml(v.fullName)}</td><td>${escapeHtml(v.course)} Sem ${escapeHtml(v.semester)}</td><td>Present</td></tr>`)
    .join("");
  const photoHtml = photos
    .map((src) => `<img src="${src}" alt="" />`)
    .join("");
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>NAAC report — ${escapeHtml(opts.event.name)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; background: #eef2f6; }
    body { font-family: "Times New Roman", Georgia, serif; color: #111; }
    .wrap { padding: 12px; }
    #print-root { background: #fff; padding: 16px 18px 24px; max-width: 210mm; margin: 0 auto; }
    .head { display: flex; align-items: center; gap: 14px; }
    .head img { width: 64px; height: 64px; object-fit: contain; }
    .mid { flex: 1; text-align: center; }
    .mid h1 { margin: 0; font-size: 16px; letter-spacing: 0.02em; }
    .mid h2 { margin: 4px 0 0; font-size: 12px; letter-spacing: 0.16em; color: #1b5e3b; }
    .mid h3 { margin: 8px 0 0; font-size: 14px; }
    pre { white-space: pre-wrap; font-family: "Times New Roman", Georgia, serif; font-size: 13px; line-height: 1.55; }
    .photos { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
    .photos img { width: 160px; height: 110px; object-fit: cover; border: 1px solid #ccc; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #bbb; padding: 5px 7px; text-align: left; }
    th { background: #13294b; color: #fff; }
    .no-print { text-align: center; margin-top: 16px; }
    .no-print button { min-height: 42px; padding: 8px 16px; border: 0; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .print { background: #15803d; color: #fff; }
    @media print {
      html, body { background: #fff !important; }
      body * { visibility: hidden !important; }
      #print-root, #print-root * { visibility: visible !important; }
      #print-root { position: absolute; left: 0; top: 0; width: 100%; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <article id="print-root">
      <div class="head">
        <img src="${logos.college}" alt="" />
        <div class="mid">
          <h1>${escapeHtml(opts.state.settings.collegeName)}</h1>
          <h2>NATIONAL SERVICE SCHEME · NAAC / IQAC FILE</h2>
          <h3>${escapeHtml(opts.event.name)}</h3>
        </div>
        <img src="${logos.nss}" alt="" />
      </div>
      <pre>${escapeHtml(opts.body)}</pre>
      ${photoHtml ? `<p><strong>Photographs</strong></p><div class="photos">${photoHtml}</div>` : ""}
      <p><strong>Attendance annexure (${present.length} present)</strong></p>
      <table>
        <thead><tr><th>Sr.</th><th>ID</th><th>Name</th><th>Class</th><th>Status</th></tr></thead>
        <tbody>${list || `<tr><td colspan="5">—</td></tr>`}</tbody>
      </table>
    </article>
    <p class="no-print"><button class="print" onclick="window.print()">Print / Save PDF</button></p>
  </div>
</body>
</html>`;
  return html;
  });
}

function pressEvents(state: PortalState) {
  return [...(state.events ?? [])]
    .filter((event) => event?.id && String(event.name || "").trim() && !isDemoRecord(event.id))
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")))
    .slice(0, 40);
}

async function smallPressPhoto(item: GalleryItem) {
  const src = item.src || "";
  if (src.startsWith("data:image/") && src.length > 80 && src.length < 220000) return src;
  const key = item.kind === "video" ? item.posterKey : item.mediaKey;
  if (!key) return "";
  const blob = await getMedia(key);
  if (!blob?.type.startsWith("image/")) return "";
  return compressSlideJpeg(blob);
}

async function smallPressPhotos(state: PortalState, event: NssEvent) {
  const name = event.name.toLowerCase();
  const items = (state.gallery ?? []).filter(
    (item) =>
      item.eventId === event.id ||
      (item.eventName && item.eventName === event.name) ||
      (item.caption && name && item.caption.toLowerCase().includes(name)),
  );
  const urls: string[] = [];
  for (const item of items) {
    if (urls.length >= 3) break;
    const url = await smallPressPhoto(item);
    if (url) urls.push(url);
  }
  return urls;
}

export function openAllGujaratiPress(state: PortalState) {
  const events = pressEvents(state);
  if (!events.length) return Promise.resolve(false);
  return openHtmlDocumentWhenReady(async () => {
    const logos = await logoDataUrls();
    const sheets = await Promise.all(
      events.map(async (event) => {
        const present = presentVolunteers(state, event.id);
        const body = defaultGujaratiPress(event, state.settings, present.length);
        const photos = await smallPressPhotos(state, event);
        const paras = body.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
        const list = present
          .map((volunteer) => `<li>${escapeHtml(volunteer.fullName)} <span class="id">${escapeHtml(volunteer.volunteerId)}</span></li>`)
          .join("");
        const photoHtml = photos
          .map((src) => `<figure><img src="${src}" alt="" /><figcaption>કાર્યક્રમની તસવીર</figcaption></figure>`)
          .join("");
        return `<article class="sheet">
<div class="head"><img src="${logos.college}" alt="" /><div class="mid"><h1>એસ.ડી. આર્ટ્સ એન્ડ શાહ બી.આર. કોમર્સ કોલેજ, માણસા</h1><h2>રાષ્ટ્રીય સેવા યોજના (NSS)</h2><p>પ્રોગ્રામ ઑફિસર: ${escapeHtml(state.settings.poName)}</p></div><img src="${logos.nss}" alt="" /></div>
<div class="tri"><span style="background:#ff9933"></span><span style="background:#fff;outline:1px solid #ddd"></span><span style="background:#138808"></span></div>
<h2 class="title">${escapeHtml(event.name)}</h2>
<p class="date">માણસા, ${escapeHtml(formatLongDate(event.date))}${event.location ? ` · ${escapeHtml(event.location)}` : ""}</p>
<div class="body">${paras.map((part) => `<p>${escapeHtml(part).replaceAll("\n", "<br/>")}</p>`).join("")}</div>
${photoHtml ? `<div class="photo-row">${photoHtml}</div>` : ""}
<div class="annexure"><h3>હાજર સ્વયંસેવકો · ${present.length}</h3>${list ? `<ol>${list}</ol>` : "<p>હાજરી નોંધાઈ નથી.</p>"}</div>
</article>`;
      }),
    );
    return `<!doctype html>
<html><head><meta charset="utf-8" /><title>બધા કાર્યક્રમોની પ્રેસ રિપોર્ટ</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati:wght@400;600;700&family=Noto+Serif:wght@600;700&display=swap" />
<style>
@page{size:A4;margin:12mm}*{box-sizing:border-box}html,body{margin:0;background:#eee7d8}body{font-family:"Noto Sans Gujarati","Noto Sans",sans-serif;color:#211d18}
.wrap{padding:12px}article.sheet{background:#fff;max-width:210mm;margin:0 auto 16px;padding:15px 18px 22px;box-shadow:0 2px 16px #0001;break-after:page;page-break-after:always}
article.sheet:last-of-type{break-after:auto;page-break-after:auto}
.head{display:flex;align-items:center;gap:12px;border-bottom:1px solid #b9892e;padding-bottom:9px}.head img{width:58px;height:58px;object-fit:contain}.mid{flex:1;text-align:center}
.mid h1{margin:0;font-family:"Noto Serif",serif;font-size:16px;color:#173b29}.mid h2{margin:3px 0 0;font-size:12px;color:#173b29}.mid p{margin:3px 0 0;font-size:11px}
.tri{height:4px;display:flex;margin:7px 0 12px}.tri span{flex:1}
.title{text-align:center;font-family:"Noto Serif",serif;font-size:20px;color:#9d1b16;margin:0 0 4px}
.date{text-align:right;font-weight:700;font-size:12px;margin:0 0 10px}
.body p{font-size:13.5px;line-height:1.7;text-align:justify;margin:0 0 9px}
.photo-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:8px 0 12px}.photo-row img{width:100%;height:120px;object-fit:cover}
figcaption{font-size:10px;text-align:center;color:#555}
.annexure{margin-top:12px;border-top:1px solid #b9892e;padding-top:8px}.annexure h3{font-size:13px;color:#173b29;margin:0 0 6px}
.annexure ol{columns:2;padding-left:20px;margin:0}.annexure li{font-size:11px;margin:0 0 3px;break-inside:avoid}.id{color:#777;font-size:9px}
.no-print{text-align:center;margin:8px 0 18px}.no-print button{min-height:42px;padding:8px 18px;border:0;border-radius:8px;font-weight:700;cursor:pointer;background:#176b3a;color:#fff}
@media print{html,body{background:#fff!important}.wrap{padding:0}.no-print{display:none!important}article.sheet{box-shadow:none;margin:0;max-width:none}}
</style></head><body><div class="wrap">
<p class="no-print"><button onclick="window.print()">બધી પ્રેસ રિપોર્ટ છાપો / PDF</button></p>
${sheets.join("")}
</div></body></html>`;
  }).then(() => true);
}
