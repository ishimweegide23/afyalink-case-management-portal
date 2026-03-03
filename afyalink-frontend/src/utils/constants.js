export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

export const TOKEN_KEY = "afyalink_token";
export const USER_KEY = "afyalink_user";

export const USER_ROLES = {
  ADMIN: "ADMIN",
  SUPERVISOR: "SUPERVISOR",
  SOCIAL_WORKER: "SOCIAL_WORKER",
};

/** All 30 districts of Rwanda grouped by province */
export const RWANDA_DISTRICTS = [
  { value: "Gasabo", label: "Gasabo", province: "Kigali City" },
  { value: "Kicukiro", label: "Kicukiro", province: "Kigali City" },
  { value: "Nyarugenge", label: "Nyarugenge", province: "Kigali City" },
  { value: "Gisagara", label: "Gisagara", province: "Southern Province" },
  { value: "Huye", label: "Huye", province: "Southern Province" },
  { value: "Kamonyi", label: "Kamonyi", province: "Southern Province" },
  { value: "Muhanga", label: "Muhanga", province: "Southern Province" },
  { value: "Nyamagabe", label: "Nyamagabe", province: "Southern Province" },
  { value: "Nyanza", label: "Nyanza", province: "Southern Province" },
  { value: "Nyaruguru", label: "Nyaruguru", province: "Southern Province" },
  { value: "Ruhango", label: "Ruhango", province: "Southern Province" },
  { value: "Karongi", label: "Karongi", province: "Western Province" },
  { value: "Ngororero", label: "Ngororero", province: "Western Province" },
  { value: "Nyabihu", label: "Nyabihu", province: "Western Province" },
  { value: "Nyamasheke", label: "Nyamasheke", province: "Western Province" },
  { value: "Rubavu", label: "Rubavu", province: "Western Province" },
  { value: "Rusizi", label: "Rusizi", province: "Western Province" },
  { value: "Rutsiro", label: "Rutsiro", province: "Western Province" },
  { value: "Burera", label: "Burera", province: "Northern Province" },
  { value: "Gakenke", label: "Gakenke", province: "Northern Province" },
  { value: "Gicumbi", label: "Gicumbi", province: "Northern Province" },
  { value: "Musanze", label: "Musanze", province: "Northern Province" },
  { value: "Rulindo", label: "Rulindo", province: "Northern Province" },
  { value: "Bugesera", label: "Bugesera", province: "Eastern Province" },
  { value: "Gatsibo", label: "Gatsibo", province: "Eastern Province" },
  { value: "Kayonza", label: "Kayonza", province: "Eastern Province" },
  { value: "Kirehe", label: "Kirehe", province: "Eastern Province" },
  { value: "Ngoma", label: "Ngoma", province: "Eastern Province" },
  { value: "Nyagatare", label: "Nyagatare", province: "Eastern Province" },
  { value: "Rwamagana", label: "Rwamagana", province: "Eastern Province" },
];

export const PROVINCES = [
  { value: "Kigali City", label: "Kigali City" },
  { value: "Southern Province", label: "Southern Province" },
  { value: "Western Province", label: "Western Province" },
  { value: "Northern Province", label: "Northern Province" },
  { value: "Eastern Province", label: "Eastern Province" },
];

export const getDistrictsByProvince = (province) => {
  if (!province) return RWANDA_DISTRICTS;
  return RWANDA_DISTRICTS.filter((d) => d.province === province);
};

export const getProvinceForDistrict = (district) => {
  const found = RWANDA_DISTRICTS.find((d) => d.value === district);
  return found ? found.province : null;
};

export const getAllDistrictsForDropdown = () =>
  RWANDA_DISTRICTS.map((d) => ({
    value: d.value,
    label: `${d.label} (${d.province})`,
  }));

export const CASE_STATUSES = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  CLOSED: "CLOSED",
};

export const CASE_PRIORITIES = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
};

export const CASE_ENTRY_TYPES = {
  NOTE: "NOTE",
  TASK: "TASK",
  MILESTONE: "MILESTONE",
};

export const CASE_ENTRY_STATUSES = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  OVERDUE: "OVERDUE",
};

export const INTERVENTION_STATUSES = {
  PLANNED: "PLANNED",
  SCHEDULED: "SCHEDULED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
};

export const INTERVENTION_TYPES = {
  HOME_VISIT: "HOME_VISIT",
  MEDICAL: "MEDICAL",
  EDUCATION: "EDUCATION",
  COUNSELING: "COUNSELING",
  TRAINING: "TRAINING",
  EMERGENCY: "EMERGENCY",
};

export const BENEFICIARY_STATUS = {
  ACTIVE: "ACTIVE",
  PENDING: "PENDING",
  CLOSED: "CLOSED",
};

export const VULNERABILITY_LEVEL = {
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
};

export const BENEFICIARY_CATEGORIES = [
  "Child Support",
  "Youth Services",
  "Family Care",
  "Emergency",
  "HIV Support",
  "Teen Mothers",
  "Disability Support",
];

export const PAGE_SIZE = 10;

/** Common emojis for message composer */
export const EMOJI_LIST = ['😀','😊','👍','❤️','🙏','✅','📎','📄','📷','🔔','⭐','🎉','💬','📌','⚠️','📋','🏠','👥','💼','📅'];
