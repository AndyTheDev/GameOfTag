type PageProps = {
  params: {
    checkpointId: string;
  };
};

export default async function CheckpointPage(
    {params}: 
    {params: Promise<{ checkpointId: string }>;}
) {
  const { checkpointId } = await params;
  return (
    <>
      <h1>Checkpoint Page</h1>
      <p>Checkpoint ID: {checkpointId}</p>
    </>
  );
}