import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      appName: 'Crime Alert System',
      tagline: 'Report crimes safely and anonymously',
      reportCrime: 'Report a Crime',
      trackReport: 'Track Your Report',
      howItWorks: 'How It Works',
      step1: 'Submit your report anonymously',
      step2: 'Get a reference number',
      step3: 'Track status with reference number',
      reportAnonymously: 'Report Anonymously',
      yourSafetyMatters: 'Your safety and privacy matter',
      description: 'Description',
      location: 'Location',
      submit: 'Submit Report',
      selectCategory: 'Select Category',
      categories: {
        theft: 'Theft',
        assault: 'Assault',
        vandalism: 'Vandalism',
        burglary: 'Burglary',
        robbery: 'Robbery',
        fraud: 'Fraud',
        other: 'Other'
      }
    }
  },
  sn: {
    translation: {
      appName: 'Chirongwa Chekuzivisa Mhosva',
      tagline: 'Zivisa mhosva zvakachengeteka uye munyarare',
      reportCrime: 'Zivisa Mhosva',
      trackReport: 'Terera Gwaro Rako',
      howItWorks: 'Zvinoshanda Sei',
      step1: 'Tumira gwaro rako munyarare',
      step2: 'Uwane nhamba yekutevera',
      step3: 'Terera mamiriro ezvinhu nenhamba',
      reportAnonymously: 'Zivisa Munyarare',
      yourSafetyMatters: 'Kuchengeteka kwako kunokosha',
      description: 'Tsanangudzo',
      location: 'Nzvimbo',
      submit: 'Tumira Gwaro',
      selectCategory: 'Sarudza Rudzi',
      categories: {
        theft: 'Kuba',
        assault: 'Kurohwa',
        vandalism: 'Kuparadza',
        burglary: 'Kupaza',
        robbery: 'Kupamba',
        fraud: 'Kunyengera',
        other: 'Zvimwe'
      }
    }
  },
  nd: {
    translation: {
      appName: 'Uhlelo Lokwazisa Ubugebengu',
      tagline: 'Bikela ubugebengu ngokuphephile nangasithelelwe',
      reportCrime: 'Bikela Ubugebengu',
      trackReport: 'Landelela Umbiko Wakho',
      howItWorks: 'Kusebenza Kanjani',
      step1: 'Thumela umbiko wakho ngasithelelwe',
      step2: 'Thola inombolo yokulandelela',
      step3: 'Landelela isimo ngenombolo',
      reportAnonymously: 'Bikela Ngasithelelwe',
      yourSafetyMatters: 'Ukuphepha kwakho kubalulekile',
      description: 'Incazelo',
      location: 'Indawo',
      submit: 'Thumela Umbiko',
      selectCategory: 'Khetha Uhlobo',
      categories: {
        theft: 'Ukwebiwa',
        assault: 'Ukushaywa',
        vandalism: 'Ukonakalisa',
        burglary: 'Ukugqekeza',
        robbery: 'Ukuphanqa',
        fraud: 'Ukukhohlisa',
        other: 'Okunye'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
