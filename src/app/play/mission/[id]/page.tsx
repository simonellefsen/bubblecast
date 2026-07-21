import { AppShell } from "@/components/AppShell";
import { MissionPlayer } from "@/components/MissionPlayer";

export default async function MissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell title="Mission">
      <MissionPlayer missionId={id} />
    </AppShell>
  );
}
