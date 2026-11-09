export interface CompanyData {
  companyName: string;
  legalName: string;
  website: string;
  industry: string;
  companySize: string;
  foundedYear: string;
  companyType: string;
  gstNumber: string;
  panNumber: string;
  country: string;
  state: string;
  city: string;
  address: string;
  about: string;
  agree: boolean;
  logoFile?: File | null;
}

export interface AdminData {
  fullName: string;
  designation: string;
  department: string;
  email: string;
  countryCode: string;
  mobile: string;
  altCountryCode: string;
  altMobile: string;
  password: string;
  confirmPassword: string;
  timeZone: string;
  language: string;
  emailNotifications: string;
}
