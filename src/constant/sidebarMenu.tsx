import { FaBook, FaBriefcase, FaCertificate,FaGraduationCap, FaLanguage, FaLayerGroup, FaUser } from "react-icons/fa";
import { ComponentType } from 'react';
import { SectionItem } from "@/store/useResumeStore";
import { dynamicFormFields, FieldConfig } from "./dynamicFormFields";

export type SidebarMenuItem = {
  key: string;
  icon: ComponentType;
  label: string;
  formFields?: FieldConfig[];
  itemRender?: (item: SectionItem) => React.ReactNode;
};

// 菜单栏配置
const sidebarMenu: SidebarMenuItem[] = [
  {
    key: 'projects',
    icon: FaBook,
    label: 'sections.projects',
    itemRender: (item) => (
      <div className="flex flex-col gap-2 max-w-[155px]">
        <div className="font-bold text-sm">{item.name}</div>
        <div className="text-xs text-neutral-400">{item.role}</div>
      </div>
    )
  },
  {
    key: 'education',
    icon: FaGraduationCap,
    label: 'sections.education',
    formFields: dynamicFormFields.education,
    itemRender: (item) => (
      <div className="flex flex-col gap-2 max-w-[155px]">
        <div className="font-bold text-sm">{item.school}</div>
        <div className="text-xs text-neutral-400">{item.major}</div>
      </div>
    )
  },
  {
    key: 'skills',
    icon: FaLayerGroup,
    label: 'sections.skills',
    itemRender: (item) => <div className="font-bold text-sm max-w-[155px]">{item.name}</div>
  },
  {
    key: 'languages',
    icon: FaLanguage,
    label: 'sections.languages',
    itemRender: (item) => <div className="font-bold text-sm max-w-[155px]">{item.language}</div>
  },
  {
    key: 'certificates',
    icon: FaCertificate,
    label: 'sections.certificates',
    itemRender: (item) => <div className="font-bold text-sm max-w-[155px]">{item.certificate}</div>
  },
  {
    key: 'experience',
    icon: FaBriefcase,
    label: 'sections.experience',
    formFields: dynamicFormFields.experience,
    itemRender: (item) => (
      <div className="flex flex-col gap-2 max-w-[155px]">
        <div className="font-bold text-sm">{item.company}</div>
        <div className="text-xs text-neutral-400">{item.location}</div>
      </div>
    )
  },
  {
    key: 'profiles',
    icon: FaUser,
    label: 'sections.profiles',
    formFields: dynamicFormFields.profiles,
    itemRender: (item) => (
      <div className="flex flex-col gap-2 max-w-[155px] ">
        <div className="font-bold text-sm">{item.platform}</div>
        <div className="text-xs text-neutral-400">{item.url}</div>
      </div>
    )
  }
];

export default sidebarMenu;
