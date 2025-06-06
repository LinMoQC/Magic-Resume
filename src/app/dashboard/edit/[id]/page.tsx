import ResumeEdit from './ResumeEdit';

export default function Page({ params }: { params: { id: string } }) {
  return <ResumeEdit id={params.id} />;
} 