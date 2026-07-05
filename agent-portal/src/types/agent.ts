export interface DocumentUpload {
  name: string;
  url: string;
  uploadedAt: string;
}

export interface Agent {
  _id: string;
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  companyName: string;
  gstNumber: string;
  businessCategory: string;
  address: string;
  city: string;
  state: string;
  country: string;
  website: string;
  instagram: string;
  facebook: string;
  logo: string;
  profileImage: string;
  profileCompleted: boolean;
  emailVerified: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Legacy compat fields
  agentName?: string;
  description?: string;
  logoUrl?: string;
  profilePhotoUrl?: string;
  isVerified?: boolean;
  documents?: DocumentUpload[];

  // KYC Fields
  kycStatus?: "PENDING" | "EMAIL_VERIFIED" | "MOBILE_VERIFIED" | "KYC_COMPLETED" | "APPROVED";
  dob?: string;
  mobile?: string;
  mobileVerified?: boolean;
  agentPhoto?: string;
  companyLogo?: string;
  gstNo?: string;
}
