import CheckpointForm from '@/src/components/CheckpointForm';
import { Header } from '@/src/components/Header';
import { Footer } from '@/src/components/Footer';

type Props = {
  params: Promise<{ checkpointId: string }>;
};

export default async function CheckpointPage({ params }: Props) {
  const { checkpointId } = await params;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header type="basic" backgroundColor="light" />

      <main className="relative overflow-hidden py-20 px-4 flex-1 flex items-center">
        <div className="absolute top-[-40] left-[-100] w-4xl h-[768px] opacity-20 bg-[radial-gradient(ellipse_70.71%_70.71%_at_50.00%_50.00%,var(--color-pink)_0%,rgba(255,54,184,0)_70%)] blur-3xl" />
        <div className="absolute top-80 right-[-40] w-4xl h-[768px] opacity-20 bg-[radial-gradient(ellipse_70.71%_70.71%_at_50.00%_50.00%,#8A00FF_25%,rgba(255,54,184,0)_70%)] blur-3xl" />

        <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center text-center gap-6">
          <CheckpointForm initialCode={checkpointId} />
        </div>
      </main>

      <Footer />
    </div>
  );
} 