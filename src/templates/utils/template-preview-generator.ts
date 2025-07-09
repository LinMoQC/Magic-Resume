import { MagicTemplateDSL } from '../types/magic-dsl';
import { Resume } from '@/store/useResumeStore';

// 示例数据用于生成预览图
const SAMPLE_RESUME_DATA: Resume = {
  id: 'preview',
  name: 'Sample Resume',
  info: {
    fullName: 'John Doe',
    headline: 'Senior Software Engineer',
    email: 'john.doe@example.com',
    phoneNumber: '+1 (555) 123-4567',
    address: 'San Francisco, CA',
    website: 'https://johndoe.dev',
    avatar: ''
  },
      sections: {
      experience: [
        {
          id: '1',
          visible: true,
          company: 'Tech Corp',
          position: 'Senior Software Engineer',
          date: '2022 - Present',
          location: 'San Francisco, CA',
          summary: 'Led development of scalable web applications using React and Node.js. Improved system performance by 40%.'
        },
        {
          id: '2',
          visible: true,
          company: 'Startup Inc',
          position: 'Full Stack Developer',
          date: '2020 - 2022',
          location: 'New York, NY',
          summary: 'Built and maintained multiple web applications. Collaborated with cross-functional teams.'
        }
      ],
      education: [
        {
          id: '1',
          visible: true,
          school: 'University of Technology',
          degree: 'Bachelor of Computer Science',
          date: '2016 - 2020',
          location: 'Boston, MA',
          major: 'Computer Science'
        }
      ],
      projects: [
        {
          id: '1',
          visible: true,
          name: 'E-commerce Platform',
          role: 'Lead Developer',
          date: '2023',
          summary: 'Built a full-stack e-commerce platform with React, Node.js, and PostgreSQL.'
        }
      ],
      skills: [
        { id: '1', visible: true, skill: 'JavaScript', level: 'Expert' },
        { id: '2', visible: true, skill: 'React', level: 'Expert' },
        { id: '3', visible: true, skill: 'Node.js', level: 'Advanced' },
        { id: '4', visible: true, skill: 'Python', level: 'Intermediate' }
      ],
      languages: [
        { id: '1', visible: true, language: 'English', level: 'Native' },
        { id: '2', visible: true, language: 'Spanish', level: 'Intermediate' }
      ],
          certificates: [
        { id: '1', visible: true, certificate: 'AWS Certified Developer', date: '2023' }
      ],
      profiles: [
        { id: '1', visible: true, name: 'GitHub', title: 'github.com/johndoe' }
      ]
    },
    sectionOrder: [
      { key: 'experience', label: 'Experience' },
      { key: 'education', label: 'Education' },
      { key: 'projects', label: 'Projects' },
      { key: 'skills', label: 'Skills' },
      { key: 'languages', label: 'Languages' },
      { key: 'certificates', label: 'Certificates' },
      { key: 'profiles', label: 'Profiles' }
    ],
        template: 'classic',
    themeColor: '#3b82f6',
    typography: 'inter',
    updatedAt: Date.now()
};

export class TemplatePreviewGenerator {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor() {
    this.initCanvas();
  }

  private initCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 300; // 预览图宽度
    this.canvas.height = 400; // 预览图高度
    this.ctx = this.canvas.getContext('2d');
  }

  // 生成模板预览图
  async generatePreview(template: MagicTemplateDSL): Promise<string> {
    if (!this.ctx || !this.canvas) {
      throw new Error('Canvas not initialized');
    }

    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 设置背景
    this.ctx.fillStyle = template.designTokens.colors.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 应用模板样式
    this.applyTemplateStyles(template);

    // 渲染简历内容
    await this.renderResumeContent(template, SAMPLE_RESUME_DATA);

    // 返回base64图片数据
    return this.canvas.toDataURL('image/png', 0.8);
  }

  private applyTemplateStyles(template: MagicTemplateDSL) {
    if (!this.ctx) return;

    // 设置字体
    this.ctx.font = `12px ${template.designTokens.typography.fontFamily.primary}`;
    this.ctx.fillStyle = template.designTokens.colors.text;
  }

  private async renderResumeContent(template: MagicTemplateDSL, data: Resume) {
    if (!this.ctx) return;

    const { components, layout } = template;
    let yOffset = 20;

    // 渲染头部信息
    const headerComponent = components.find(comp => comp.dataBinding === 'info');
    if (headerComponent) {
      yOffset = this.renderHeader(data.info, yOffset);
    }

    // 渲染各个部分
    for (const component of components) {
      if (component.dataBinding.startsWith('sections.')) {
        const sectionKey = component.dataBinding.replace('sections.', '');
        const sectionData = data.sections[sectionKey as keyof typeof data.sections];
        
        if (sectionData && Array.isArray(sectionData) && sectionData.length > 0) {
          yOffset = this.renderSection(component, sectionData, yOffset);
        }
      }
    }
  }

  private renderHeader(info: Resume['info'], yOffset: number): number {
    if (!this.ctx) return yOffset;

    // 渲染姓名
    this.ctx.font = 'bold 16px Arial';
    this.ctx.fillStyle = '#000000';
    this.ctx.fillText(info.fullName || 'John Doe', 20, yOffset);
    yOffset += 25;

    // 渲染职位
    this.ctx.font = '12px Arial';
    this.ctx.fillStyle = '#666666';
    this.ctx.fillText(info.headline || 'Software Engineer', 20, yOffset);
    yOffset += 20;

    // 渲染联系信息
    this.ctx.font = '10px Arial';
    const contactInfo = [
      info.email,
      info.phoneNumber,
      info.address
    ].filter(Boolean).join(' • ');

    if (contactInfo) {
      this.ctx.fillText(contactInfo, 20, yOffset);
      yOffset += 25;
    }

    return yOffset;
  }

  private renderSection(component: any, data: any[], yOffset: number): number {
    if (!this.ctx) return yOffset;

    // 渲染标题
    this.ctx.font = 'bold 12px Arial';
    this.ctx.fillStyle = '#000000';
    this.ctx.fillText(component.props?.title || 'Section', 20, yOffset);
    yOffset += 20;

    // 渲染内容（简化版本）
    this.ctx.font = '10px Arial';
    this.ctx.fillStyle = '#333333';

    // 只显示前2-3个项目作为预览
    const previewItems = data.slice(0, 2);
    
    for (const item of previewItems) {
      const title = item.company || item.school || item.name || item.skill || '';
      const subtitle = item.position || item.degree || item.level || '';
      
      if (title) {
        this.ctx.fillText(title, 20, yOffset);
        yOffset += 15;
      }
      
      if (subtitle) {
        this.ctx.fillStyle = '#666666';
        this.ctx.fillText(subtitle, 20, yOffset);
        this.ctx.fillStyle = '#333333';
        yOffset += 15;
      }
      
      yOffset += 5;
    }

    return yOffset + 10;
  }

  // 批量生成所有模板的预览图
  async generateAllPreviews(templates: MagicTemplateDSL[]): Promise<Record<string, string>> {
    const previews: Record<string, string> = {};
    
    for (const template of templates) {
      try {
        const preview = await this.generatePreview(template);
        previews[template.id] = preview;
      } catch (error) {
        console.error(`Failed to generate preview for template ${template.id}:`, error);
      }
    }
    
    return previews;
  }

  // 保存预览图到文件系统（仅在Node.js环境中）
  async savePreviewToFile(templateId: string, previewData: string, outputPath: string): Promise<void> {
    // 这里需要Node.js的fs模块，在浏览器环境中不适用
    // 实际实现时可以使用服务器端API来保存文件
    console.log(`Preview for template ${templateId} would be saved to ${outputPath}`);
  }
}

// 导出单例实例
export const previewGenerator = new TemplatePreviewGenerator();