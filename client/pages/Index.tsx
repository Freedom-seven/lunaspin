import { useLuna } from "@/store/store";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, NotebookPen } from "lucide-react";
import { useMemo, useState } from "react";
import LunaWheel from "@/components/LunaWheel";
import DailyHuddle from "@/components/DailyHuddle";
import HistoryTable from "@/components/HistoryTable";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function Index() {
  const { teamName, setTeamName, members, addMember, removeMember, setTopicForWinner, lastWinnerId, resetAll } = useLuna();
  const [newMember, setNewMember] = useState("");
  const [topic, setTopic] = useState("");
  const { toast } = useToast();

  const canSpin = members.length >= 2;

  const lastWinnerName = useMemo(() => members.find(m => m.id === lastWinnerId)?.name ?? "", [members, lastWinnerId]);

  return (
    <Layout>
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl p-5 bg-white/5 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur">
            <h2 className="text-2xl font-extrabold">Create Team</h2>
            <p className="text-white/70 mt-1">LunaSpin spark curiosity with a weekly spin and daily micro-huddles.</p>
            <div className="mt-4 space-y-3">
              <label className="text-sm text-white/80">Team Name</label>
              <Input value={teamName} onChange={(e)=> setTeamName(e.target.value)} placeholder="e.g. Lunim Devs" className="rounded-xl" aria-label="Team name" />
            </div>
            <div className="mt-4">
              <label className="text-sm text-white/80">Members</label>
              <div className="mt-2 flex gap-2">
                <Input value={newMember} onChange={(e)=> setNewMember(e.target.value)} placeholder="Add member name" className="rounded-xl" aria-label="New member name" />
                <Button onClick={()=> { if(newMember.trim()){ addMember(newMember.trim()); setNewMember(""); toast({ title: "Member added" }); } }} className="rounded-xl">
                  <Plus />
                </Button>
              </div>
              <ul className="mt-3 max-h-56 overflow-auto pr-1 space-y-2">
                {members.map((m)=> (
                  <li key={m.id} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2 border border-white/10">
                    <span className="font-medium">{m.name}</span>
                    <Button variant="ghost" size="icon" aria-label={`Remove ${m.name}`} onClick={()=> removeMember(m.id)}>
                      <Trash2 />
                    </Button>
                  </li>
                ))}
                {members.length === 0 && (
                  <div className="text-white/60 text-sm">Add at least two members to enable spinning.</div>
                )}
              </ul>
              <div className="mt-3 flex gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="rounded-xl">Reset All</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset all data?</AlertDialogTitle>
                      <AlertDialogDescription>This will clear the team name, members, and presentation history. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={()=> { resetAll(); toast({ title: "All data reset" }); }}>Reset</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          <DailyHuddle />
        </div>

        <div className="lg:col-span-3">
          <div className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-lg">
            <h2 className="text-2xl font-extrabold mb-2">Today's Spin</h2>
            <p className="text-white/70 mb-4">{canSpin ? "Click spin to select a presenter fairly." : "Add members to generate the wheel."}</p>
            <LunaWheel />
            {lastWinnerName && (
              <div className="mt-6 rounded-2xl p-4 bg-[#14131f] border border-white/10">
                <div className="flex items-center gap-3 font-bold text-lg">
                  <NotebookPen className="text-secondary" />
                  {lastWinnerName}`s presentation topic!
                </div>
                <div className="mt-3 flex gap-2">
                  <Input value={topic} onChange={(e)=> setTopic(e.target.value)} placeholder="e.g. How Pixar builds culture" className="rounded-xl" aria-label="Presentation topic" />
                  <Button className="rounded-xl" onClick={()=> { if(topic.trim()){ setTopicForWinner(topic.trim()); setTopic(""); toast({ title: "Topic saved" }); } }}>Save</Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <HistoryTable limit={4} />
          </div>
        </div>
      </section>
    </Layout>
  );
}
