/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, SystemConfig } from './types';

export const COUNTRIES = [
  ["Tanzania", "+255"], ["Kenya", "+254"], ["Uganda", "+256"], ["Rwanda", "+250"], ["Burundi", "+257"],
  ["United States", "+1"], ["United Kingdom", "+44"], ["India", "+91"], ["Nigeria", "+234"], ["South Africa", "+27"],
  ["Afghanistan", "+93"], ["Albania", "+355"], ["Algeria", "+213"], ["Andorra", "+376"], ["Angola", "+244"],
  ["Argentina", "+54"], ["Armenia", "+374"], ["Australia", "+61"], ["Austria", "+43"], ["Azerbaijan", "+994"],
  ["Bahamas", "+1"], ["Bahrain", "+973"], ["Bangladesh", "+880"], ["Barbados", "+1"], ["Belarus", "+375"],
  ["Belgium", "+32"], ["Belize", "+501"], ["Benin", "+229"], ["Bhutan", "+975"], ["Bolivia", "+591"],
  ["Bosnia and Herzegovina", "+387"], ["Botswana", "+267"], ["Brazil", "+55"], ["Brunei", "+673"], ["Bulgaria", "+359"],
  ["Burkina Faso", "+226"], ["Cameroon", "+237"], ["Canada", "+1"], ["Cape Verde", "+238"], ["Central African Republic", "+236"],
  ["Chad", "+235"], ["Chile", "+56"], ["China", "+86"], ["Colombia", "+57"], ["Comoros", "+269"], ["Congo (DRC)", "+243"],
  ["Congo (Republic)", "+242"], ["Costa Rica", "+506"], ["Croatia", "+385"], ["Cuba", "+53"], ["Cyprus", "+357"],
  ["Czech Republic", "+420"], ["Denmark", "+45"], ["Djibouti", "+253"], ["Dominica", "+1"], ["Dominican Republic", "+1"],
  ["Ecuador", "+593"], ["Egypt", "+20"], ["El Salvador", "+503"], ["Equatorial Guinea", "+240"], ["Eritrea", "+291"],
  ["Estonia", "+372"], ["Eswatini", "+268"], ["Ethiopia", "+251"], ["Fiji", "+679"], ["Finland", "+358"],
  ["France", "+33"], ["Gabon", "+241"], ["Gambia", "+220"], ["Georgia", "+995"], ["Germany", "+49"],
  ["Ghana", "+233"], ["Greece", "+30"], ["Grenada", "+1"], ["Guatemala", "+502"], ["Guinea", "+224"],
  ["Guinea-Bissau", "+245"], ["Guyana", "+592"], ["Haiti", "+509"], ["Honduras", "+504"], ["Hungary", "+36"],
  ["Iceland", "+354"], ["Indonesia", "+62"], ["Iran", "+98"], ["Iraq", "+964"], ["Ireland", "+353"],
  ["Israel", "+972"], ["Italy", "+39"], ["Ivory Coast", "+225"], ["Jamaica", "+1"], ["Japan", "+81"],
  ["Jordan", "+962"], ["Kazakhstan", "+7"], ["Kiribati", "+686"], ["Kosovo", "+383"], ["Kuwait", "+965"],
  ["Kyrgyzstan", "+996"], ["Laos", "+856"], ["Latvia", "+371"], ["Lebanon", "+961"], ["Lesotho", "+266"],
  ["Liberia", "+231"], ["Libya", "+218"], ["Liechtenstein", "+423"], ["Lithuania", "+370"], ["Luxembourg", "+352"],
  ["Madagascar", "+261"], ["Malawi", "+265"], ["Malaysia", "+60"], ["Maldives", "+960"], ["Mali", "+223"],
  ["Malta", "+356"], ["Marshall Islands", "+692"], ["Mauritania", "+222"], ["Mauritius", "+230"], ["Mexico", "+52"],
  ["Micronesia", "+691"], ["Moldova", "+373"], ["Monaco", "+377"], ["Mongolia", "+976"], ["Montenegro", "+382"],
  ["Morocco", "+212"], ["Mozambique", "+258"], ["Myanmar", "+95"], ["Namibia", "+264"], ["Nauru", "+674"],
  ["Nepal", "+977"], ["Netherlands", "+31"], ["New Zealand", "+64"], ["Nicaragua", "+505"], ["Niger", "+227"],
  ["North Korea", "+850"], ["North Macedonia", "+389"], ["Norway", "+47"], ["Oman", "+968"], ["Pakistan", "+92"],
  ["Palau", "+680"], ["Palestine", "+970"], ["Panama", "+507"], ["Papua New Guinea", "+675"], ["Paraguay", "+595"],
  ["Peru", "+51"], ["Philippines", "+63"], ["Poland", "+48"], ["Portugal", "+351"], ["Qatar", "+974"],
  ["Romania", "+40"], ["Russia", "+7"], ["Saint Kitts and Nevis", "+1"], ["Saint Lucia", "+1"],
  ["Saint Vincent and the Grenadines", "+1"], ["Samoa", "+685"], ["San Marino", "+378"], ["Sao Tome and Principe", "+239"],
  ["Saudi Arabia", "+966"], ["Senegal", "+221"], ["Serbia", "+381"], ["Seychelles", "+248"], ["Sierra Leone", "+232"],
  ["Singapore", "+65"], ["Slovakia", "+421"], ["Slovenia", "+386"], ["Solomon Islands", "+677"], ["Somalia", "+252"],
  ["Spain", "+34"], ["Sri Lanka", "+94"], ["Sudan", "+249"], ["Suriname", "+597"], ["Sweden", "+46"],
  ["Switzerland", "+41"], ["Syria", "+963"], ["Taiwan", "+886"], ["Tajikistan", "+992"], ["Thailand", "+66"],
  ["Timor-Leste", "+670"], ["Togo", "+228"], ["Tonga", "+676"], ["Trinidad and Tobago", "+1"], ["Tunisia", "+216"],
  ["Turkey", "+90"], ["Turkmenistan", "+993"], ["Tuvalu", "+688"], ["Ukraine", "+380"], ["United Arab Emirates", "+971"],
  ["Uruguay", "+598"], ["Uzbekistan", "+998"], ["Vanuatu", "+678"], ["Vatican City", "+379"], ["Venezuela", "+58"],
  ["Vietnam", "+84"], ["Yemen", "+967"], ["Zambia", "+260"], ["Zimbabwe", "+263"]
];

export const DOCUMENT_CATEGORIES = [
  'General', 'Health', 'Academic', 'Social', 'Doctor of Medicine', 
  'Bachelor of Science in Physiotherapy', 'Doctor of Dental Surgery', 
  'Bachelor of Science in Therapeutic Radiography', 'Bachelor of Science in Nursing', 
  'Bachelor of Science in Nursing Anaesthesia', 'Bachelor of Science in Biomedical Engineering', 
  'Bachelor of Science in Dental Laboratory Technology', 'Bachelor of Science in Medical Laboratory Technology', 
  'Bachelor of Science in Occupational Therapy', 'Bachelor of Science in Medical Psychology', 
  'Bachelor of Science in Environmental Health Science'
];

export const COURSES = [
  "Doctor of Medicine",
  "Bachelor of Science in Physiotherapy",
  "Doctor of Dental Surgery",
  "Bachelor of Science in Therapeutic Radiography",
  "Bachelor of Science in Nursing",
  "Bachelor of Science in Nursing Anaesthesia",
  "Bachelor of Science in Biomedical Engineering",
  "Bachelor of Science in Dental Laboratory Technology",
  "Bachelor of Science in Medical Laboratory Technology",
  "Bachelor of Science in Occupational Therapy",
  "Bachelor of Science in Medical Psychology",
  "Bachelor of Science in Environmental Health Science"
];

export const INITIAL_USERS: User[] = [
  {
    firstName: "Baraka",
    middleName: "Gabriel",
    lastName: "SHIRIMA",
    gender: "Male",
    regNo: "2025-04-00000",
    course: "Doctor of Medicine",
    email: "barakagabriel07@gmail.com",
    countryCode: "+255",
    phone: "712345678",
    password: "123",
    role: "user",
    photo: null,
    chatAlias: "BarakaG"
  },
  {
    firstName: "System",
    middleName: "",
    lastName: "Programmer",
    gender: "Prefer not to say",
    regNo: "Programmer",
    course: "System Programmer",
    email: "programmer@muhaspulse.app",
    countryCode: "+255",
    phone: "700000000",
    password: "123",
    role: "programmer",
    photo: null,
    chatAlias: "RootDeveloper"
  },
  {
    firstName: "Demo",
    middleName: "",
    lastName: "Admin",
    gender: "Prefer not to say",
    regNo: "admin",
    course: "Administration",
    email: "admin@muhaspulse.app",
    countryCode: "+255",
    phone: "700000001",
    password: "123",
    role: "admin",
    photo: null,
    chatAlias: "AdminHead",
    adminRole: "Head of Department"
  },
  {
    firstName: "Sarah",
    middleName: "Elizabeth",
    lastName: "Mwansa",
    gender: "Female",
    regNo: "2025-04-00012",
    course: "Bachelor of Science in Nursing",
    email: "sarah.mwansa@muhas.ac.tz",
    countryCode: "+255",
    phone: "744112233",
    password: "123",
    role: "user",
    photo: null,
    chatAlias: "NurseSarah"
  }
];

export const DEFAULT_CONFIG: SystemConfig = {
  colorAccent: 'teal',
  borderRadius: 'smooth',
  glassmorphism: 'frosted',
  tickerSpeed: 'medium',
  layoutWidth: 'default',
  fontSize: 'default',
  particleBg: true,
  soundToggle: true,
  maintenanceMode: false,
  notificationSound: 'modern',
  chatBubbleStyle: 'rounded',
  customGreeting: "Welcome to MUHAS PULSE",
  allowMultipleProgrammers: true,
  siteName: "MUHAS PULSE",
  siteLogo: null
};

export const INITIAL_NEWS = [
  "Welcome to MUHAS PULSE — register once and stay updated.",
  "Library extended hours begin next week for clinical student support.",
  "Clinical rotations schedule for Year 3 Doctor of Medicine will be released soon."
];
