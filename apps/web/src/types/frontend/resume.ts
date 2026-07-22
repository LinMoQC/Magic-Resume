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
      lineHeight?: number;
      letterSpacing?: string;
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
    pageSize?: 'A4' | 'Letter';
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
    showTitleDivider?: boolean;
    showTitleIcon?: boolean;
  };
  /** 头像 / 页眉样式覆盖,合并进 Header / ProfileCard 组件的 props。 */
  header?: {
    avatarPosition?: 'left' | 'right';
    avatarWidth?: number;
    avatarHeight?: number;
    avatarRounded?: boolean;
    contactStyle?: 'icon' | 'label';
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
  customFields?: CustomInfoField[];
};

export type CustomInfoField = {
  id: string;
  name: string;
  value: string;
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

// Cloud version shape returned by the API.
export interface CloudVersion {
  id: string;
  createdAt?: string;
  timestamp?: number;
  changelog?: string;
  type?: string;
  content: string | object;
}

export interface CloudResume {
  id: string;
  title: string;
  updatedAt: string;
  content: string | object;
  isPublic: boolean;
  shareId?: string;
  shareRole: 'VIEWER' | 'COMMENTER' | 'EDITOR';
  /** 服务端乐观锁版本号,作为下次 PATCH 的 baseRevision(见 docs/specs/cloud-sync-v2) */
  revision?: number;
  versions?: CloudVersion[];
}
