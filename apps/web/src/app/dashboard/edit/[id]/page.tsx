import ResumeEdit from '../_components/ResumeEdit';
import DocumentTitle from '../_components/DocumentTitle';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <DocumentTitle />
      <ResumeEdit id={id} />
    </>
  );
}
