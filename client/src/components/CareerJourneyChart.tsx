import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

interface MonthlyXP {
  month: string;
  xp: number;
}

interface CareerJourneyChartProps {
  data: MonthlyXP[];
}

export default function CareerJourneyChart({ data }: CareerJourneyChartProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold font-poppins">Career Journey</h2>
          <div className="text-sm text-primary">
            <select className="border-none bg-transparent focus:outline-none cursor-pointer">
              <option>This Year</option>
              <option>Last Year</option>
              <option>All Time</option>
            </select>
          </div>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                fontSize={12}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                fontSize={12}
                tickFormatter={(value) => `${value} XP`}
              />
              <Tooltip
                formatter={(value) => [`${value} XP`, 'XP Earned']}
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                }}
              />
              <Legend />
              <Bar 
                dataKey="xp" 
                name="XP Earned" 
                fill="hsl(231, 44%, 56%)" 
                radius={[4, 4, 0, 0]} 
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex items-center justify-center mt-4 text-sm">
          <div className="flex items-center mr-4">
            <div className="w-3 h-3 bg-primary rounded-full mr-2"></div>
            <span>XP Earned</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#8bc34a] rounded-full mr-2"></div>
            <span>Goals Completed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
