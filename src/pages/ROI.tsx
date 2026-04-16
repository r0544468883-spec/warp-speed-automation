import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, TrendingUp, Clock, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import DashboardLayout from "@/components/DashboardLayout";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ROI() {
  const [frequency, setFrequency] = useState(20); // times per week
  const [duration, setDuration] = useState(15); // minutes per task
  const [maintenance, setMaintenance] = useState(2); // hours per month

  const weeklyMinutes = frequency * duration;
  const monthlySaved = (weeklyMinutes * 4) / 60 - maintenance;
  const yearlySaved = monthlySaved * 12;
  const hourlyRate = 150; // NIS
  const yearlySavingsNIS = yearlySaved * hourlyRate;

  const chartData = Array.from({ length: 12 }, (_, i) => ({
    month: `חודש ${i + 1}`,
    savings: Math.round(monthlySaved * (i + 1)),
    cost: Math.round(maintenance * (i + 1)),
  }));

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-gradient mb-1 flex items-center gap-3">
          <Calculator className="h-8 w-8 text-primary" /> מחשבון ROI
        </h1>
        <p className="text-muted-foreground text-sm">חשב כמה זמן וכסף תחסוך עם אוטומציה</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="space-y-6">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6 space-y-6">
              <div>
                <Label className="text-sm mb-3 block">תדירות המשימה (פעמים בשבוע): <span className="text-primary font-bold">{frequency}</span></Label>
                <Slider value={[frequency]} onValueChange={([v]) => setFrequency(v)} min={1} max={100} step={1} />
              </div>
              <div>
                <Label className="text-sm mb-3 block">משך כל ביצוע (דקות): <span className="text-primary font-bold">{duration}</span></Label>
                <Slider value={[duration]} onValueChange={([v]) => setDuration(v)} min={1} max={120} step={1} />
              </div>
              <div>
                <Label className="text-sm mb-3 block">תחזוקת אוטומציה (שעות/חודש): <span className="text-primary font-bold">{maintenance}</span></Label>
                <Slider value={[maintenance]} onValueChange={([v]) => setMaintenance(v)} min={0} max={20} step={0.5} />
              </div>
            </CardContent>
          </Card>

          {/* Formula */}
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <h3 className="text-sm font-heading font-semibold mb-3">נוסחה</h3>
              <div dir="ltr" className="bg-muted/50 rounded-lg p-4 font-mono text-xs text-center text-muted-foreground">
                SavedTime = (Frequency × Duration) − Maintenance
                <br />
                = ({frequency} × {duration}min × 4weeks) / 60 − {maintenance}h
                <br />
                = <span className="text-primary font-bold">{monthlySaved.toFixed(1)} שעות/חודש</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Clock, label: "חסכון חודשי", value: `${monthlySaved.toFixed(1)} שעות`, color: "text-primary" },
              { icon: TrendingUp, label: "חסכון שנתי", value: `${yearlySaved.toFixed(0)} שעות`, color: "text-success" },
              { icon: DollarSign, label: "שווי שנתי (₪)", value: `₪${yearlySavingsNIS.toLocaleString()}`, color: "text-secondary" },
              { icon: Calculator, label: "ROI", value: monthlySaved > 0 ? `${Math.round((monthlySaved / (maintenance || 1)) * 100)}%` : "0%", color: "text-primary" },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
                <Card className="bg-card/50 border-border">
                  <CardContent className="p-4 text-center">
                    <s.icon className={`h-6 w-6 mx-auto mb-2 ${s.color}`} />
                    <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                    <p className="text-xl font-heading font-bold">{s.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Chart */}
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <h3 className="text-sm font-heading font-semibold mb-4">חסכון מצטבר (שעות)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 15%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(222, 47%, 6%)", border: "1px solid hsl(222, 30%, 15%)", borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Area type="monotone" dataKey="savings" stroke="hsl(185, 100%, 50%)" fill="url(#savingsGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
