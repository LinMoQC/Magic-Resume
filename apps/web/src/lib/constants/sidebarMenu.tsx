import { ComponentType } from 'react';
import { SectionItem } from "@/types/frontend/resume";
import { dynamicFormFields, FieldConfig } from "./dynamicFormFields";
import {
  FolderKanban,
  GraduationCap,
  Zap,
  Globe,
  Award,
  BriefcaseBusiness
} from 'lucide-react';

export type SidebarMenuItem = {
  key: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  formFields?: FieldConfig[];
  itemRender?: (item: SectionItem) => React.ReactNode;
};

// 菜单栏配置
const sidebarMenu: SidebarMenuItem[] = [
  {
    key: 'projects',
    icon: FolderKanban,
    label: 'sections.projects',
    itemRender: (item) => (
      <div className="flex min-w-0 flex-col gap-2">
        <div className="truncate font-bold text-sm">{item.name}</div>
        <div className="truncate text-xs text-neutral-400">{item.role}</div>
      </div>
    )
  },
  {
    key: 'education',
    icon: GraduationCap,
    label: 'sections.education',
    formFields: dynamicFormFields.education,
    itemRender: (item) => (
      <div className="flex min-w-0 flex-col gap-2">
        <div className="truncate font-bold text-sm">{item.school}</div>
        <div className="truncate text-xs text-neutral-400">{item.major}</div>
      </div>
    )
  },
  {
    key: 'skills',
    icon: Zap,
    label: 'sections.skills',
    // 技能条目的 name 往往是整句描述,限制两行防止卡片被撑高
    itemRender: (item) => <div className="line-clamp-2 font-bold text-sm">{item.name}</div>
  },
  {
    key: 'languages',
    icon: Globe,
    label: 'sections.languages',
    itemRender: (item) => <div className="truncate font-bold text-sm">{item.language}</div>
  },
  {
    key: 'certificates',
    icon: Award,
    label: 'sections.certificates',
    // 证书条目的标题字段是 name(见 dynamicFormFields.certificatesFields),
    // 不是 certificate——旧写法取不到值,列表行会整行空白。
    itemRender: (item) => (
      <div className="flex min-w-0 flex-col gap-2">
        <div className="truncate font-bold text-sm">{item.name}</div>
        <div className="truncate text-xs text-neutral-400">{item.issuer}</div>
      </div>
    )
  },
  {
    key: 'experience',
    icon: BriefcaseBusiness,
    label: 'sections.experience',
    formFields: dynamicFormFields.experience,
    itemRender: (item) => (
      <div className="flex min-w-0 flex-col gap-2">
        <div className="truncate font-bold text-sm">{item.company}</div>
        <div className="truncate text-xs text-neutral-400">{item.location}</div>
      </div>
    )
  },
  // {
  //   key: 'profiles',
  //   icon: User,
  //   label: 'sections.profiles',
  //   formFields: dynamicFormFields.profiles,
  //   itemRender: (item) => (
  //     <div className="flex flex-col gap-2 max-w-[155px] ">
  //       <div className="font-bold text-sm">{item.platform}</div>
  //       <div className="text-xs text-neutral-400">{item.url}</div>
  //     </div>
  //   )
  // }
];

export default sidebarMenu;
