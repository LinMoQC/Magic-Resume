import ResumeEdit from './ResumeEdit';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ResumeEdit id={id}/>;
}