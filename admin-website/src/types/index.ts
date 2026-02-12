export interface Job {
  id: string;
  title: string;
  organization: string;
  category: string;
  description: string;
  qualification: string;
  ageLimit: string;
  totalVacancies: number;
  applicationStartDate: string;
  applicationEndDate?: string;
  examDate?: string;
  applicationFee: string;
  applyUrl: string;
  isNew: boolean;
  createdAt: string;
  tags: string[];
  location: string;
  salary?: string;
  jobType: 'permanent' | 'temporary' | 'contractual';
  notificationImageUrl?: string;
}

export interface JobCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  totalJobs: number;
  color: string;
}

export interface JobFormData {
  title: string;
  organization: string;
  category: string;
  description: string;
  qualification: string;
  ageLimit: string;
  totalVacancies: number;
  applicationStartDate: string;
  applicationEndDate?: string;
  examDate?: string;
  applicationFee: string;
  applyUrl: string;
  location: string;
  salary?: string;
  jobType: 'permanent' | 'temporary' | 'contractual';
  tags: string;
  notificationImageUrl?: string;
}

export interface CategoryFormData {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}