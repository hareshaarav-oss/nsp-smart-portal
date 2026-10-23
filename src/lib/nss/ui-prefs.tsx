import { useEffect, useState } from "react";

export type Lang = "en" | "gu";

const TEXT: Record<string, { en: string; gu: string }> = {
  back: { en: "Back", gu: "પાછળ" },
  home: { en: "Home", gu: "હોમ" },
  gallery: { en: "Gallery", gu: "ગેલેરી" },
  contact: { en: "Contact", gu: "સંપર્ક" },
  desk: { en: "Desk", gu: "ડેસ્ક" },
  dashboard: { en: "Dashboard", gu: "ડેશબોર્ડ" },
  chat: { en: "Chat", gu: "ચેટ" },
  attendance: { en: "Attendance", gu: "હાજરી" },
  reports: { en: "Reports", gu: "અહેવાલ" },
  volunteers: { en: "Volunteers", gu: "સ્વયંસેવકો" },
  alumni: { en: "Alumni", gu: "ભૂતપૂર્વ" },
  events: { en: "Events", gu: "કાર્યક્રમ" },
  press: { en: "Press", gu: "પ્રેસ" },
  certificates: { en: "Certificates", gu: "પ્રમાણપત્ર" },
  notices: { en: "Notices", gu: "નોટિસ" },
  birthdays: { en: "Birthdays", gu: "જન્મદિવસ" },
  settings: { en: "Settings", gu: "સેટિંગ" },
  logs: { en: "Logs", gu: "નોંધ" },
  smart: { en: "Smart Command", gu: "સ્માર્ટ" },
  impact: { en: "NSS Impact", gu: "અસર" },
  backup: { en: "Backup", gu: "બેકઅપ" },
  register: { en: "Student registration", gu: "વિદ્યાર્થી નોંધણી" },
  studentLogin: { en: "Student login", gu: "વિદ્યાર્થી પ્રવેશ" },
  adminLogin: { en: "Admin login", gu: "એડમિન પ્રવેશ" },
  verify: { en: "Certificate verification", gu: "પ્રમાણપત્ર ચકાસો" },
  emptyNotice: { en: "No notice today.", gu: "આજે કોઈ નોટિસ નથી." },
  id: { en: "Digital ID", gu: "ડિજિટલ આઈડી" },
  more: { en: "More", gu: "વધુ" },
  next: { en: "Next", gu: "આગળ" },
  recent: { en: "Recent work", gu: "તાજેતરનું કામ" },
  noticesTitle: { en: "Notices", gu: "નોટિસ" },
  install: { en: "Install NSP", gu: "ઇન્સ્ટોલ" },
  signin: { en: "Sign in", gu: "પ્રવેશ" },
  signout: { en: "Sign out", gu: "બહાર" },
  message: { en: "Message", gu: "સંદેશ" },
  tomorrow: { en: "Tomorrow", gu: "કાલે" },
  save: { en: "Save", gu: "સાચવો" },
  details: { en: "My photo, mobile and MPIN", gu: "ફોટો, મોબાઇલ અને MPIN" },
};

export function translate(key: string, lang: Lang) {
  return TEXT[key]?.[lang] || TEXT[key]?.en || key;
}

function readLang(): Lang {
  try {
    return localStorage.getItem("nsp-lang") === "gu" ? "gu" : "en";
  } catch {
    return "en";
  }
}

function readDark() {
  try {
    return localStorage.getItem("nsp-dark") === "1";
  } catch {
    return false;
  }
}

export function useUi() {
  const [lang, setLangState] = useState<Lang>("en");
  const [dark, setDarkState] = useState(false);

  useEffect(() => {
    const apply = () => {
      const nextLang = readLang();
      const nextDark = readDark();
      setLangState(nextLang);
      setDarkState(nextDark);
      document.documentElement.lang = nextLang === "gu" ? "gu" : "en";
      document.documentElement.classList.toggle("dark", nextDark);
    };
    apply();
    window.addEventListener("nsp-ui", apply);
    return () => window.removeEventListener("nsp-ui", apply);
  }, []);

  function setLang(next: Lang) {
    localStorage.setItem("nsp-lang", next);
    window.dispatchEvent(new Event("nsp-ui"));
  }

  function toggleDark() {
    localStorage.setItem("nsp-dark", dark ? "0" : "1");
    window.dispatchEvent(new Event("nsp-ui"));
  }

  function t(key: string) {
    return translate(key, lang);
  }

  return { lang, dark, setLang, toggleDark, t };
}
