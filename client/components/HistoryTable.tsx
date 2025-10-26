import { useMemo, useState } from "react";
import { useLuna } from "@/store/store";
import { Button } from "@/components/ui/button";
import { ArrowDownUp, Edit3, Trash2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function HistoryTable({ limit }: { limit?: number }) {
  const { history, updateHistoryTopic, deleteHistoryEntry } = useLuna();
  const [asc, setAsc] = useState(false);
  const { toast } = useToast();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [topicDraft, setTopicDraft] = useState("");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const copy = [...history];
    copy.sort((a, b) => (asc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
    const q = query.trim().toLowerCase();
    return q ? copy.filter(h => h.winner.toLowerCase().includes(q) || (h.topic ?? "").toLowerCase().includes(q)) : copy;
  }, [history, asc, query]);

  const visibleRows = limit ? rows.slice(0, limit) : rows;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Presentation History</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAsc((s) => !s)} className="rounded-xl">
            <ArrowDownUp className="mr-1" /> Sort
          </Button>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-white/50" />
            <Input value={query} onChange={(e)=> setQuery(e.target.value)} placeholder="Search winner or topic" className="pl-8 h-9 rounded-xl w-56" />
          </div>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-white/70 text-sm">
            <tr>
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Winner</th>
              <th className="py-2 pr-4">Topic</th>
              <th className="py-2 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 && (
              <tr>
                <td className="py-4 text-white/60" colSpan={3}>
                  No history yet. Spin the wheel to get started!
                </td>
              </tr>
            )}
            {visibleRows.map((h, idx) => (
              <tr key={idx} className="border-t border-white/10">
                <td className="py-3 pr-4 text-white/90">{h.date}</td>
                <td className="py-3 pr-4 text-white font-medium">{h.winner}</td>
                <td className="py-3 pr-4 text-white/90">{h.topic ?? ""}</td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <Dialog onOpenChange={(open)=>{ if(!open) { setEditingIndex(null); setTopicDraft(""); } }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={()=>{ const originalIndex = history.indexOf(h); setEditingIndex(originalIndex); setTopicDraft(h.topic ?? ""); }}>
                          <Edit3 className="mr-1"/> Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Topic</DialogTitle>
                          <DialogDescription>Update the presentation topic for {h.winner} on {h.date}.</DialogDescription>
                        </DialogHeader>
                        <Input value={topicDraft} onChange={(e)=> setTopicDraft(e.target.value)} placeholder="Enter topic" className="rounded-xl" />
                        <div className="flex justify-end">
                          <Button className="rounded-xl" onClick={()=>{ if(editingIndex!=null){ updateHistoryTopic(editingIndex, topicDraft.trim()); toast({title:"Topic saved"}); } }}>Save</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="rounded-xl">
                          <Trash2 className="mr-1"/> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete entry?</AlertDialogTitle>
                          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={()=>{ const originalIndex = history.indexOf(h); deleteHistoryEntry(originalIndex); toast({title:"Entry deleted"}); }}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
