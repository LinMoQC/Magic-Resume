// Custom Template Configuration
export type CustomTemplateConfig = {
  designTokens?: {
    colors?: Partial<{
      primary: string;
      secondary: string;
      text: string;
      textSecondary: string;
      background: string;
      border: string;
      accent?: string;
      sidebar?: string;
    }>;
    typography?: {
      fontFamily?: {
        primary?: string;
        secondary?: string;
        mono?: string;
      };
      fontSize?: Partial<{
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        xxl: string;
      }>;
      fontWeight?: Partial<{
        normal: number;
        medium: number;
        bold: number;
      }>;
    };
    spacing?: Partial<{
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    }>;
    borderRadius?: Partial<{
      none: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    }>;
  };
  layout?: {
    type?: 'single-column' | 'two-column' | 'sidebar' | 'grid';
    containerWidth?: string;
    containerHeight?: string;
    padding?: string;
    gap?: string;
    twoColumn?: {
      leftWidth?: string;
      rightWidth?: string;
      gap?: string;
    };
    sidebar?: {
      position?: 'left' | 'right';
      width?: string;
      gap?: string;
    };
  };
};

export type InfoType = {
  fullName: string;
  headline: string;
  email: string;
  phoneNumber: string;
  address: string;
  website: string;
  avatar: string;
};

export type SectionItem = {
  id: string;
  visible: boolean;
  [key: string]: string | boolean;
};

export type Section = {
  [key: string]: SectionItem[];
};

export type SectionOrder = {
  key: string;
  label: string;
};

export type ResumeVersion = {
  id: string;
  updatedAt: number;
  type: 'auto' | 'manual';
  data: Omit<Resume, 'versions'>;
  name?: string;
};

export type Resume = {
  id: string;
  userId?: string; // Owner ID
  name: string;
  updatedAt: number;
  info: InfoType;
  sections: Section;
  sectionOrder: SectionOrder[];
  template: string; // Base template ID
  customTemplate?: CustomTemplateConfig; // User custom configuration
  themeColor: string;
  typography: string;
  versions?: ResumeVersion[];
  isPublic?: boolean;
  shareId?: string;
  shareRole?: 'VIEWER' | 'COMMENTER' | 'EDITOR';
};
