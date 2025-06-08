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
    label: 'Projects',
    itemRender: (item) => (
      <div className="flex flex-col gap-2">
        <div className="font-bold text-sm">{item.name}</div>
        <div className="text-xs text-neutral-400">{item.role}</div>
      </div>
    )
  },
  {
    key: 'education',
    icon: FaGraduationCap,
    label: 'Education',
    formFields: dynamicFormFields.education,
    itemRender: (item) => (
      <div className="flex flex-col gap-2">
        <div className="font-bold text-sm">{item.school}</div>
        <div className="text-xs text-neutral-400">{item.major}</div>
      </div>
    )
  },
  {
    key: 'skills',
    icon: FaLayerGroup,
    label: 'Skills',
    itemRender: (item) => <div className="font-bold text-sm">{item.skill}</div>
  },
  {
    key: 'languages',
    icon: FaLanguage,
    label: 'Languages',
    itemRender: (item) => <div className="font-bold text-sm">{item.language}</div>
  },
  {
    key: 'certificates',
    icon: FaCertificate,
    label: 'Certificates',
    itemRender: (item) => <div className="font-bold text-sm">{item.certificate}</div>
  },
  {
    key: 'experience',
    icon: FaBriefcase,
    label: 'Experience',
    formFields: dynamicFormFields.experience,
    itemRender: (item) => (
      <div className="flex flex-col gap-2">
        <div className="font-bold text-sm">{item.company}</div>
        <div className="text-xs text-neutral-400">{item.location}</div>
      </div>
    )
  },
  {
    key: 'profiles',
    icon: FaUser,
    label: 'Profiles',
    formFields: dynamicFormFields.profiles,
    itemRender: (item) => (
      <div className="flex flex-col gap-2">
        <div className="font-bold text-sm">{item.platform}</div>
        <div className="text-xs text-neutral-400">{item.url}</div>
      </div>
    )
  }
];

export default sidebarMenu;
