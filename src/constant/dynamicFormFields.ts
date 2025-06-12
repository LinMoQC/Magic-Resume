// 动态表单配置
export type FieldConfig = {
    key: string;
    labelKey: string;
    type: 'input' | 'richtext';
    placeholderKey?: string;
    required?: boolean;
};

const educationFields: FieldConfig[] = [
    { key: 'school', labelKey: 'dynamicForm.fields.education.school.label', type: 'input', placeholderKey: 'dynamicForm.fields.education.school.placeholder', required: true },
    { key: 'degree', labelKey: 'dynamicForm.fields.education.degree.label', type: 'input', placeholderKey: 'dynamicForm.fields.education.degree.placeholder' },
    { key: 'major', labelKey: 'dynamicForm.fields.education.major.label', type: 'input', placeholderKey: 'dynamicForm.fields.education.major.placeholder' },
    { key: 'date', labelKey: 'dynamicForm.fields.education.date.label', type: 'input', placeholderKey: 'dynamicForm.fields.education.date.placeholder' },
    { key: 'location', labelKey: 'dynamicForm.fields.education.location.label', type: 'input', placeholderKey: 'dynamicForm.fields.education.location.placeholder' }
];

const experienceFields: FieldConfig[] = [
    { key: 'company', labelKey: 'dynamicForm.fields.experience.company.label', type: 'input', placeholderKey: 'dynamicForm.fields.experience.company.placeholder', required: true },
    { key: 'position', labelKey: 'dynamicForm.fields.experience.position.label', type: 'input', placeholderKey: 'dynamicForm.fields.experience.position.placeholder', required: true },
    { key: 'date', labelKey: 'dynamicForm.fields.experience.date.label', type: 'input', placeholderKey: 'dynamicForm.fields.experience.date.placeholder' },
    { key: 'location', labelKey: 'dynamicForm.fields.experience.location.label', type: 'input', placeholderKey: 'dynamicForm.fields.experience.location.placeholder' },
    { key: 'website', labelKey: 'dynamicForm.fields.experience.website.label', type: 'input', placeholderKey: 'dynamicForm.fields.experience.website.placeholder' },
];

const profilesFields: FieldConfig[] = [
    { key: 'platform', labelKey: 'dynamicForm.fields.profiles.platform.label', type: 'input', placeholderKey: 'dynamicForm.fields.profiles.platform.placeholder', required: true },
    { key: 'url', labelKey: 'dynamicForm.fields.profiles.url.label', type: 'input', placeholderKey: 'dynamicForm.fields.profiles.url.placeholder', required: true },
];

const skillsFields: FieldConfig[] = [
    { key: 'name', labelKey: 'dynamicForm.fields.skills.name.label', type: 'input', placeholderKey: 'dynamicForm.fields.skills.name.placeholder', required: true },
    { key: 'level', labelKey: 'dynamicForm.fields.skills.level.label', type: 'input', placeholderKey: 'dynamicForm.fields.skills.level.placeholder' },
];

const projectsFields: FieldConfig[] = [
    { key: 'name', labelKey: 'dynamicForm.fields.projects.name.label', type: 'input', placeholderKey: 'dynamicForm.fields.projects.name.placeholder', required: true },
    { key: 'role', labelKey: 'dynamicForm.fields.projects.role.label', type: 'input', placeholderKey: 'dynamicForm.fields.projects.role.placeholder' },
    { key: 'date', labelKey: 'dynamicForm.fields.projects.date.label', type: 'input', placeholderKey: 'dynamicForm.fields.projects.date.placeholder' },
    { key: 'link', labelKey: 'dynamicForm.fields.projects.link.label', type: 'input', placeholderKey: 'dynamicForm.fields.projects.link.placeholder' },
];

const languagesFields: FieldConfig[] = [
    { key: 'language', labelKey: 'dynamicForm.fields.languages.language.label', type: 'input', placeholderKey: 'dynamicForm.fields.languages.language.placeholder', required: true },
    { key: 'level', labelKey: 'dynamicForm.fields.languages.level.label', type: 'input', placeholderKey: 'dynamicForm.fields.languages.level.placeholder' },
];

const certificatesFields: FieldConfig[] = [
    { key: 'name', labelKey: 'dynamicForm.fields.certificates.name.label', type: 'input', placeholderKey: 'dynamicForm.fields.certificates.name.placeholder', required: true },
    { key: 'issuer', labelKey: 'dynamicForm.fields.certificates.issuer.label', type: 'input', placeholderKey: 'dynamicForm.fields.certificates.issuer.placeholder' },
    { key: 'date', labelKey: 'dynamicForm.fields.certificates.date.label', type: 'input', placeholderKey: 'dynamicForm.fields.certificates.date.placeholder' },
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
  
