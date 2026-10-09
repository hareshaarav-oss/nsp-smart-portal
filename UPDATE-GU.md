# NSP Smart Portal — 9 October 2026 update

આ અપડેટ તમારા GitHub repo hareshaarav-oss/nsp-smart-portal પર છે.
Vercel આ repo સાથે જોડાયેલ હોય તો main પર push થતાં જાતે deploy થશે.
નહીં હોય તો Vercel → Project → Deployments → Redeploy.

## શું સુધર્યું
- /api/nss-cloud હવે મોબાઇલ, ઈમેલ, સરનામું, બ્લડ ગ્રુપ, વાલીનો નંબર અને attendance પબ્લિક મોકલતું નથીં.
- વિદ્યાર્થી લોગિન સર્વર પર મોબાઇલ ચેક કરે છે. આખી યાદી બ્રાઉઝરમાં આવતી નથીં.
- હોમ Service hours ક્લાઉડના આંકડા પરથી આવે છે.
- જૂની તારીખવાળો NSS Camp Upcomingમાં નહીં આવે.
- Certificate verificationનું ખાલી લિંક સુધર્યું.
- Welcome to Avyansh Tech બદલીને NSS Smart Portal.
- લોગિન વગર Back to dashboard દેખાશે નહીં.

## તમારે કરવાનું
1. Vercel પર Redeploy.
2. https://nsp-smart-portal.vercel.app/api/nss-cloud ખોલીને મોબાઇલ નથીં એ ચેક કરો.
3. હોમ પર Service hours 576 છે કે નહીં જુઓ.
4. Firestore rulesમાં volunteers પબ્લિક read હોય તો તે પણ બંધ કરો.
