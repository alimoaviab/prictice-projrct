import { Card } from "../../../components/ui";
import { SchoolShell } from "../../../layouts/SchoolShell";

const sections = [
  { title: "Students", value: "1,248", detail: "Active enrollment", icon: "group", trend: "+12%", trendUp: true },
  { title: "Teachers", value: "86", detail: "Faculty members", icon: "person", trend: "+2", trendUp: true },
  { title: "Revenue", value: "$42.8k", detail: "Monthly collection", icon: "payments", trend: "+8%", trendUp: true },
  { title: "Attendance", value: "92%", detail: "Avg. this week", icon: "check_circle", trend: "-1%", trendUp: false },
  { title: "Exams", value: "14", detail: "Upcoming tests", icon: "description", trend: "Stable", trendUp: true }
];

export default function AdminDashboardPage() {
  return (
    <SchoolShell eyebrow="Overview" title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {sections.map((section) => (
          <Card key={section.title} className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">{section.icon}</span>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                section.trendUp ? "bg-success/10 text-success" : "bg-error/10 text-error"
              }`}>
                {section.trend}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{section.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{section.value}</h3>
              <p className="text-xs text-gray-400 mt-1">{section.detail}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-semibold">Attendance Overview</h3>
             <select className="text-sm border-none bg-gray-50 rounded-md px-2 py-1 outline-none">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
             </select>
          </div>
          <div className="h-64 bg-gray-50 rounded-lg flex items-end justify-between p-6 gap-2">
            {[40, 70, 45, 90, 65, 80, 95].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-secondary rounded-t-sm transition-all duration-500"
                  style={{ height: `${height}%` }}
                ></div>
                <span className="text-[10px] text-gray-400 font-medium">Day {i+1}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-6">Quick Actions</h3>
          <div className="space-y-3">
             {[
               { label: "Add New Student", icon: "person_add", color: "bg-blue-50 text-blue-600" },
               { label: "Record Attendance", icon: "how_to_reg", color: "bg-green-50 text-green-600" },
               { label: "Generate Report", icon: "summarize", color: "bg-purple-50 text-purple-600" },
               { label: "Create Exam", icon: "add_task", color: "bg-orange-50 text-orange-600" }
             ].map((action) => (
               <button key={action.label} className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/20 hover:bg-primary/5 transition-all group">
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <span className="material-symbols-outlined text-xl">{action.icon}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{action.label}</span>
                  <span className="material-symbols-outlined text-gray-400 ml-auto text-sm">chevron_right</span>
               </button>
             ))}
          </div>
        </Card>
      </div>
    </SchoolShell>
  );
}
