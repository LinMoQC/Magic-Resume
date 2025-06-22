// Magic模板DSL设计
export interface MagicTemplateDSL {
  id: string;
  name: string;
  version: string;
  description: string;
  thumbnailUrl: string;
  tags: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  
  // 设计令牌系统
  designTokens: {
    colors: {
      primary: string;
      secondary: string;
      text: string;
      textSecondary: string;
      background: string;
      border: string;
      accent?: string;
      sidebar?: string;
    };
    typography: {
      fontFamily: {
        primary: string;
        secondary?: string;
        mono?: string;
      };
      fontSize: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        xxl: string;
      };
      fontWeight: {
        normal: number;
        medium: number;
        bold: number;
      };
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    borderRadius: {
      none: string;
      sm: string;
      md: string;
      lg: string;
    };
  };
  
  // 布局系统
  layout: {
    type: 'single-column' | 'two-column' | 'sidebar' | 'grid';
    containerWidth: string;
    containerHeight?: string;
    padding: string;
    gap: string;
    
    // 两栏布局配置
    twoColumn?: {
      leftWidth: string;
      rightWidth: string;
      gap: string;
    };
    
    // 侧边栏布局配置
    sidebar?: {
      position: 'left' | 'right';
      width: string;
      gap: string;
    };
  };
  
  // 组件定义
  components: ComponentDefinition[];
}

export interface ComponentDefinition {
  id: string;
  type: ComponentType;
  dataBinding: string;
  position: ComponentPosition;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props?: Record<string, any>;
  style?: ComponentStyle;
  fieldMap?: FieldMapping;
}

export type ComponentType = 
  | 'Header'
  | 'DefaultSection'
  | 'ClassicHeader'
  | 'ClassicSection'
  | 'ClassicSkills'
  | 'Section'
  | 'ListSection' 
  | 'ProfileCard'
  | 'ContactInfo'
  | 'Timeline'
  | 'CompactList'
  | 'Divider';

export interface ComponentPosition {
  area?: 'main' | 'sidebar' | 'header' | 'footer';
  order?: number;
}

export interface ComponentStyle {
  backgroundColor?: string;
  color?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  border?: string;
  boxShadow?: string;
}

export interface FieldMapping {
  title?: string | string[];
  subtitle?: string | string[];
  description?: string | string[];
  date?: string | string[];
  level?: string | string[];
  
  // 扩展字段，用于更复杂的组件
  mainTitle?: string | string[];
  mainSubtitle?: string | string[];
  secondarySubtitle?: string | string[];
  sideTitle?: string | string[];
  sideSubtitle?: string | string[];
  secondarySideSubtitle?: string | string[];
  
  // ListSection字段
  itemName?: string | string[];
  itemDetail?: string | string[];
  summary?: string | string[];
  
  custom?: Record<string, string | string[]>;
} 