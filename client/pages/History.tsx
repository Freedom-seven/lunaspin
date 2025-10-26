import Layout from "@/components/Layout";
import HistoryTable from "@/components/HistoryTable";

export default function HistoryPage() {
  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold">History</h1>
        <p className="text-white/70">Log of winners and topics across your sessions.</p>
        <HistoryTable />
      </div>
    </Layout>
  );
}
