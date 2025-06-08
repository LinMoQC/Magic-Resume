// 动态表单配置
export type FieldConfig = {
    key: string;
    label: string;
    type: 'input' | 'richtext';
    placeholder?: string;
    required?: boolean;
};

const educationFields: FieldConfig[] = [
    { key: 'school', label: 'School', type: 'input', placeholder: '学校', required: true },
    { key: 'degree', label: 'Degree', type: 'input', placeholder: '学位' },
    { key: 'major', label: 'Major', type: 'input', placeholder: '专业' },
    { key: 'date', label: 'Date or Date Range', type: 'input', placeholder: '2019-2023' },
    { key: 'location', label: 'Location', type: 'input', placeholder: '城市' }
];

const experienceFields: FieldConfig[] = [
    { key: 'company', label: 'Company', type: 'input', placeholder: '公司名称', required: true },
    { key: 'position', label: 'Position', type: 'input', placeholder: '职位', required: true },
    { key: 'date', label: 'Date or Date Range', type: 'input', placeholder: '2023年3月至今' },
    { key: 'location', label: 'Location', type: 'input', placeholder: '城市' },
    { key: 'website', label: 'Website', type: 'input', placeholder: '网址' },
];

const profilesFields: FieldConfig[] = [
    { key: 'platform', label: 'Platform', type: 'input', placeholder: '如 LinkedIn, GitHub', required: true },
    { key: 'url', label: 'URL', type: 'input', placeholder: '链接地址', required: true },
];

const skillsFields: FieldConfig[] = [
    { key: 'name', label: 'Skill Name', type: 'input', placeholder: '技能名称', required: true },
    { key: 'level', label: 'Level', type: 'input', placeholder: '熟练度（如 Expert, Intermediate, Beginner）' },
];

const projectsFields: FieldConfig[] = [
    { key: 'name', label: 'Project Name', type: 'input', placeholder: '项目名称', required: true },
    { key: 'role', label: 'Role', type: 'input', placeholder: '担任角色' },
    { key: 'date', label: 'Date or Date Range', type: 'input', placeholder: '2022.01-2022.12' },
    { key: 'link', label: 'Link', type: 'input', placeholder: '项目链接' },
];

const languagesFields: FieldConfig[] = [
    { key: 'language', label: 'Language', type: 'input', placeholder: '语言', required: true },
    { key: 'level', label: 'Level', type: 'input', placeholder: '熟练度（如 Native, Fluent, Intermediate）' },
];

const certificatesFields: FieldConfig[] = [
    { key: 'name', label: 'Certificate Name', type: 'input', placeholder: '证书名称', required: true },
    { key: 'issuer', label: 'Issuer', type: 'input', placeholder: '颁发机构' },
    { key: 'date', label: 'Date', type: 'input', placeholder: '获得时间' },
];

export const dynamicFormFields: Record<string, FieldConfig[]> = {
    education: educationFields,
    experience: experienceFields,
    profiles: profilesFields,
    skills: skillsFields,
    projects: projectsFields,
    languages: languagesFields,
    certificates: certificatesFields,
};
  
